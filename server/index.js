import express from 'express';
import cors from 'cors';
import { randomBytes } from 'node:crypto';
import { airports, airlines, fareTemplates, countries, users } from './data.js';

const PORT = Number(process.env.PORT ?? 3001);
const DELAY = Number(process.env.DELAY ?? 500);

const app = express();
app.use(cors());
app.use(express.json());
app.use((_req, _res, next) => setTimeout(next, DELAY));

const sessions = new Map();
const flightsCache = new Map();
const bookings = new Map();

const hash = (str) =>
  [...str].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

const seeded = (seed) => {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

const pad = (n) => String(n).padStart(2, '0');
const formatTime = (d) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
const formatDate = (d) =>
  `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${WEEKDAYS[d.getUTCDay()]}`;
const formatDuration = (min) => `${Math.floor(min / 60)}ч ${pad(min % 60)}м`;
const isoDate = (d) => d.toISOString().slice(0, 10);
const addMinutes = (d, min) => new Date(d.getTime() + min * 60_000);
const round100 = (n) => Math.round(n / 100) * 100;

const findAirport = (code) => airports.find((a) => a.code === code);
const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

const point = (airport, date) => ({
  time: formatTime(date),
  date: formatDate(date),
  city: airport.name,
  airport: airport.airport,
  code: airport.code,
});

const segment = (from, to, departure, minutes, carrier, rnd) => {
  const arrival = addMinutes(departure, minutes);
  return {
    seg: {
      carrier: { ...carrier, number: `${carrier.code} ${100 + Math.floor(rnd() * 900)}` },
      departure: point(from, departure),
      arrival: point(to, arrival),
      duration: formatDuration(minutes),
      layover: null,
    },
    arrival,
  };
};

const pickHub = (fromCode, toCode) =>
  airports.find((a) => a.hub && a.code !== fromCode && a.code !== toCode) ?? findAirport('KGF');

const makeLeg = (fromCode, toCode, date, rnd, withTransfer) => {
  const from = findAirport(fromCode);
  const to = findAirport(toCode);
  const carrier = airlines[Math.floor(rnd() * airlines.length)];
  const baseMinutes = 80 + (hash(`${fromCode}${toCode}`) % 180);
  const departure = new Date(
    `${date}T${pad(5 + Math.floor(rnd() * 17))}:${pad(Math.floor(rnd() * 4) * 15)}:00Z`,
  );

  if (!withTransfer) {
    const { seg } = segment(from, to, departure, baseMinutes, carrier, rnd);
    return {
      departure: seg.departure,
      arrival: seg.arrival,
      duration: seg.duration,
      durationMinutes: baseMinutes,
      transfers: 0,
      segments: [seg],
    };
  }

  const hub = pickHub(fromCode, toCode);
  const first = segment(from, hub, departure, Math.round(baseMinutes * 0.6), carrier, rnd);
  const layover = 60 + Math.floor(rnd() * 12) * 15;
  first.seg.layover = formatDuration(layover);
  const second = segment(
    hub,
    to,
    addMinutes(first.arrival, layover),
    Math.round(baseMinutes * 0.6),
    carrier,
    rnd,
  );
  const total = Math.round((second.arrival - departure) / 60_000);

  return {
    departure: first.seg.departure,
    arrival: second.seg.arrival,
    duration: formatDuration(total),
    durationMinutes: total,
    transfers: 1,
    segments: [first.seg, second.seg],
  };
};

const generateFlights = ({ routes, passengers, cabin_class }) => {
  const [outbound, inbound] = routes;
  const searchKey = routes
    .map((r) => `${r.departure_code}-${r.arrival_code}-${r.departure_date}`)
    .join('_');
  const rnd = seeded(searchKey);
  const count = 6 + Math.floor(rnd() * 4);
  const basePrice = 18000 + (hash(`${outbound.departure_code}${outbound.arrival_code}`) % 40000);
  const paxFactor = passengers.adult + passengers.child * 0.75 + passengers.infant * 0.1;
  const cabinFactor = cabin_class === 'business' ? 2.5 : 1;

  return Array.from({ length: count }, (_, i) => {
    const withTransfer = i % 3 === 1;
    const legs = [outbound, inbound]
      .filter(Boolean)
      .map((r) => makeLeg(r.departure_code, r.arrival_code, r.departure_date, rnd, withTransfer));
    const variation = 0.8 + rnd() * 0.5;
    const price = round100(
      basePrice * variation * (withTransfer ? 0.85 : 1) * legs.length * paxFactor * cabinFactor,
    );
    const flight = {
      id: `${searchKey}_${i}`,
      price,
      oldPrice: rnd() < 0.25 ? round100(price * 1.12) : null,
      hasBaggage: rnd() > 0.4,
      legs,
    };
    flightsCache.set(flight.id, flight);
    return flight;
  });
};

const validateSearch = (body) => {
  const routes = body?.routes;
  if (!Array.isArray(routes) || routes.length === 0 || routes.length > 2)
    return 'routes: 1 или 2 направления';
  for (const r of routes) {
    if (!findAirport(r.departure_code)) return `Неизвестный аэропорт: ${r.departure_code}`;
    if (!findAirport(r.arrival_code)) return `Неизвестный аэропорт: ${r.arrival_code}`;
    if (r.departure_code === r.arrival_code) return 'Города вылета и прилёта совпадают';
    if (!isValidDate(r.departure_date)) return 'departure_date должна быть в формате YYYY-MM-DD';
    if (r.departure_date < isoDate(new Date())) return 'Дата вылета в прошлом';
  }
  const p = body.passengers;
  if (!p || !(p.adult >= 1)) return 'passengers.adult должно быть >= 1';
  if (p.adult + (p.child ?? 0) > 9) return 'Не больше 9 пассажиров';
  if ((p.infant ?? 0) > p.adult) return 'Младенцев не может быть больше, чем взрослых';
  return null;
};

const LATIN = /^[a-zA-Z\s-]+$/;
const DATE_RU = /^\d{2}\.\d{2}\.\d{4}$/;

const validatePassenger = (p, i) => {
  const errors = [];
  if (!p?.lastName || !LATIN.test(p.lastName)) errors.push(`passengers[${i}].lastName: латиница`);
  if (!p?.firstName || !LATIN.test(p.firstName))
    errors.push(`passengers[${i}].firstName: латиница`);
  if (!DATE_RU.test(p?.birthDate ?? '')) errors.push(`passengers[${i}].birthDate: ДД.ММ.ГГГГ`);
  if (!p?.docNumber) errors.push(`passengers[${i}].docNumber: обязательно`);
  if (!['adult', 'child', 'infant'].includes(p?.type))
    errors.push(`passengers[${i}].type: adult | child | infant`);
  return errors;
};

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const userId = token && sessions.get(token);
  if (!userId) return res.status(401).json({ message: 'Требуется авторизация' });
  req.user = users.find((u) => u.id === userId);
  next();
};

const publicUser = ({ id, username, email }) => ({ id, username, email });

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body ?? {};
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Неверный логин или пароль' });
  const token = randomBytes(24).toString('hex');
  sessions.set(token, user.id);
  res.json({ token, user: publicUser(user) });
});

app.get('/auth/me', requireAuth, (req, res) => res.json(publicUser(req.user)));

app.post('/auth/logout', requireAuth, (req, res) => {
  sessions.delete(req.headers.authorization.replace(/^Bearer\s+/i, ''));
  res.status(204).end();
});

app.get('/flight/autocomplete/:query', (req, res) => {
  const q = req.params.query.trim().toLowerCase();
  const result = airports
    .filter((a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().startsWith(q))
    .slice(0, 8)
    .map(({ code, name, country }) => ({ code, name, country }));
  res.json(result);
});

app.post('/flight/search', (req, res) => {
  const error = validateSearch(req.body);
  if (error) return res.status(400).json({ message: error });
  const body = {
    ...req.body,
    passengers: { adult: 1, child: 0, infant: 0, ...req.body.passengers },
    cabin_class: req.body.cabin_class ?? 'economy',
  };
  res.json({ result: generateFlights(body) });
});

app.get('/flight/calendar/:from/:to', (req, res) => {
  const { from, to } = req.params;
  if (!findAirport(from) || !findAirport(to))
    return res.status(400).json({ message: 'Неизвестный аэропорт' });
  const base = 18000 + (hash(`${from}${to}`) % 40000);
  const today = new Date();
  const prices = {};
  for (let i = 0; i < 90; i++) {
    const day = isoDate(new Date(today.getTime() + i * 86_400_000));
    prices[day] = round100(base * (0.75 + seeded(`${from}${to}${day}`)() * 0.6));
  }
  res.json(prices);
});

app.get('/flight/fares/:id', (req, res) => {
  const flight = flightsCache.get(req.params.id);
  if (!flight) return res.status(404).json({ message: 'Рейс не найден, выполните поиск заново' });
  res.json(
    fareTemplates.map(({ multiplier, ...fare }) => ({
      ...fare,
      price: round100(flight.price * multiplier),
      oldPrice: flight.oldPrice ? round100(flight.oldPrice * multiplier) : null,
    })),
  );
});

app.get('/flight/:id', (req, res) => {
  const flight = flightsCache.get(req.params.id);
  if (!flight) return res.status(404).json({ message: 'Рейс не найден, выполните поиск заново' });
  res.json(flight);
});

app.post('/flight/book', requireAuth, (req, res) => {
  const { flight_id, fare_id, passengers, contact } = req.body ?? {};
  const flight = flightsCache.get(flight_id);
  if (!flight) return res.status(404).json({ message: 'Рейс не найден, выполните поиск заново' });
  const fare = fareTemplates.find((f) => f.id === fare_id);
  if (!fare) return res.status(400).json({ message: 'Неизвестный тариф' });
  if (!Array.isArray(passengers) || passengers.length === 0)
    return res.status(400).json({ message: 'Нет пассажиров' });
  const errors = passengers.flatMap(validatePassenger);
  if (!/^\d{10}$/.test(contact?.phone ?? '')) errors.push('contact.phone: 10 цифр без +7');
  if (!/.+@.+\..+/.test(contact?.email ?? '')) errors.push('contact.email: неверный формат');
  if (errors.length) return res.status(422).json({ message: 'Проверьте данные', errors });

  const book_id = `TP-${randomBytes(3).toString('hex').toUpperCase()}`;
  bookings.set(book_id, {
    book_id,
    userId: req.user.id,
    flight,
    fare: { id: fare.id, name: fare.name, price: round100(flight.price * fare.multiplier) },
    passengers,
    contact,
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ book_id });
});

app.get('/bookings', requireAuth, (req, res) => {
  const mine = [...bookings.values()]
    .filter((b) => b.userId === req.user.id)
    .map(({ userId: _userId, ...booking }) => booking)
    .reverse();
  res.json(mine);
});

app.get('/countries', (_req, res) => res.json(countries));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => console.log(`Mock API: http://localhost:${PORT}`));
