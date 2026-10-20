import { defineStore, acceptHMRUpdate } from 'pinia';
import { isAxiosError } from 'axios';
import { bookFlight, getFares, getFlight, getMyBookings, searchFlights } from '@/api/flight';
import type {
  Booking,
  Contact,
  Fare,
  Filters,
  Flight,
  Passenger,
  PassengerCountKey,
  PassengerType,
  SearchForm,
  SearchPayload,
  SortType,
  TimeRange,
} from '@/types/flight';

interface FlightState {
  searchForm: SearchForm;
  searchResult: Flight[];
  selectedFlight: Flight | null;
  fares: Fare[];
  selectedFareId: string | null;
  passengers: Passenger[];
  contact: Contact;
  orderId: string | null;
  bookings: Booking[];
  filters: Filters;
  sort: SortType;
  loading: boolean;
  error: string | null;
}

const defaultFilters = (): Filters => ({
  stops: 'all',
  stopsDuration: null,
  time1: { min: 0, max: 24 },
  time2: { min: 0, max: 24 },
  time3: { min: 0, max: 24 },
  time4: { min: 0, max: 24 },
  airlines: [],
});

const toHours = (time: string) => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h + m / 60;
};

const inRange = (time: string | undefined, range: TimeRange) =>
  time === undefined || (toHours(time) >= range.min && toHours(time) <= range.max);

const layoverHours = (layover: string) => {
  const [, h = '0', m = '0'] = /(\d+)ч\s*(\d+)м/.exec(layover) ?? [];
  return Number(h) + Number(m) / 60;
};

const totalMinutes = (flight: Flight) =>
  flight.legs.reduce((sum, leg) => sum + leg.durationMinutes, 0);

const passengerTypes: Record<PassengerCountKey, PassengerType> = {
  adt: 'adult',
  chd: 'child',
  inf: 'infant',
};

const createPassenger = (type: PassengerType): Passenger => ({
  type,
  lastName: '',
  firstName: '',
  birthDate: '',
  citizenship: 'KZ',
  docType: type === 'adult' ? 'id_card' : 'birth_certificate',
  docNumber: '',
  docExpiry: '',
  gender: 'male',
});

const errorMessage = (error: unknown) => {
  if (!isAxiosError<{ message?: string; errors?: string[] }>(error)) return 'Что-то пошло не так';
  const data = error.response?.data;
  return data?.errors?.join('\n') ?? data?.message ?? 'Сервер недоступен';
};

export const useFlightStore = defineStore('flight', {
  state: (): FlightState => ({
    searchForm: {
      from: { code: null, name: null, country: 'KZ' },
      to: { code: null, name: null, country: 'KZ' },
      date: null,
      returnDate: null,
      isRoundTrip: true,
      passengers: { adt: 1, chd: 0, inf: 0 },
      cabin: 'economy',
    },
    searchResult: [],
    selectedFlight: null,
    fares: [],
    selectedFareId: null,
    passengers: [],
    contact: { phone: '', email: '' },
    orderId: null,
    bookings: [],
    filters: defaultFilters(),
    sort: 'cheaper',
    loading: false,
    error: null,
  }),

  getters: {
    passengersCount: (state) =>
      state.searchForm.passengers.adt +
      state.searchForm.passengers.chd +
      state.searchForm.passengers.inf,

    filteredFlights: (state) => {
      const { stops, stopsDuration, time1, time2, time3, time4, airlines } = state.filters;

      const list = state.searchResult.filter((flight) => {
        const [there, back] = flight.legs;
        if (stops !== 'all' && flight.legs.some((leg) => leg.transfers > stops)) return false;
        if (
          stopsDuration !== null &&
          flight.legs.some((leg) =>
            leg.segments.some((s) => s.layover && layoverHours(s.layover) > stopsDuration),
          )
        ) {
          return false;
        }
        if (!inRange(there?.departure.time, time1) || !inRange(there?.arrival.time, time2)) {
          return false;
        }
        if (!inRange(back?.departure.time, time3) || !inRange(back?.arrival.time, time4)) {
          return false;
        }
        if (
          airlines.length &&
          !flight.legs.some((leg) => leg.segments.some((s) => airlines.includes(s.carrier.name)))
        ) {
          return false;
        }
        return true;
      });

      const compare: Record<SortType, (a: Flight, b: Flight) => number> = {
        cheaper: (a, b) => a.price - b.price,
        faster: (a, b) => totalMinutes(a) - totalMinutes(b),
        earlier: (a, b) =>
          (a.legs[0]?.departure.time ?? '').localeCompare(b.legs[0]?.departure.time ?? ''),
      };
      return list.sort(compare[state.sort]);
    },

    cheapestId: (state) =>
      state.searchResult.reduce<Flight | null>(
        (best, f) => (!best || f.price < best.price ? f : best),
        null,
      )?.id ?? null,

    fastestId: (state) =>
      state.searchResult.reduce<Flight | null>(
        (best, f) => (!best || totalMinutes(f) < totalMinutes(best) ? f : best),
        null,
      )?.id ?? null,

    airlines: (state) => [
      ...new Set(
        state.searchResult.flatMap((f) =>
          f.legs.flatMap((l) => l.segments.map((s) => s.carrier.name)),
        ),
      ),
    ],

    ticketPrice: (state) => state.fares.find((f) => f.id === state.selectedFareId)?.price ?? 0,
  },

  actions: {
    reverseRoutes() {
      [this.searchForm.from, this.searchForm.to] = [this.searchForm.to, this.searchForm.from];
    },

    setDates(value: { from: string; to: string } | string | null) {
      if (typeof value === 'string') {
        this.searchForm.date = value;
        this.searchForm.returnDate = null;
      } else {
        this.searchForm.date = value?.from ?? null;
        this.searchForm.returnDate = value?.to ?? null;
      }
    },

    incrementPassenger(type: PassengerCountKey) {
      const p = this.searchForm.passengers;
      if (type !== 'inf' && p.adt + p.chd >= 9) return;
      if (type === 'inf' && p.inf >= p.adt) return;
      p[type]++;
    },

    decrementPassenger(type: PassengerCountKey) {
      const p = this.searchForm.passengers;
      if (p[type] <= (type === 'adt' ? 1 : 0)) return;
      p[type]--;
      if (p.inf > p.adt) p.inf = p.adt;
    },

    async search() {
      const { from, to, date, returnDate, isRoundTrip, passengers, cabin } = this.searchForm;
      this.error = null;
      if (!from.code || !to.code || !date) {
        this.error = 'Укажите города и дату вылета';
        return false;
      }

      const payload: SearchPayload = {
        cabin_class: cabin,
        direct_flight: false,
        only_refundable: false,
        passengers: { adult: passengers.adt, child: passengers.chd, infant: passengers.inf },
        routes: [{ departure_code: from.code, arrival_code: to.code, departure_date: date }],
      };
      if (isRoundTrip && returnDate) {
        payload.routes.push({
          departure_code: to.code,
          arrival_code: from.code,
          departure_date: returnDate,
        });
      }

      this.loading = true;
      try {
        const { data } = await searchFlights(payload);
        this.searchResult = data.result;
        return true;
      } catch (error) {
        this.searchResult = [];
        this.error = errorMessage(error);
        return false;
      } finally {
        this.loading = false;
      }
    },

    resetFilters() {
      this.filters = defaultFilters();
    },

    selectFlight(flight: Flight) {
      this.selectedFlight = flight;
    },

    async loadBooking(flightId: string) {
      this.loading = true;
      this.error = null;
      this.selectedFlight = null;
      try {
        const [flightRes, faresRes] = await Promise.all([getFlight(flightId), getFares(flightId)]);
        this.selectedFlight = flightRes.data;
        this.fares = faresRes.data;
        this.selectedFareId = faresRes.data[0]?.id ?? null;
        this.passengers = (Object.keys(passengerTypes) as PassengerCountKey[]).flatMap((key) =>
          Array.from({ length: this.searchForm.passengers[key] }, () =>
            createPassenger(passengerTypes[key]),
          ),
        );
      } catch (error) {
        this.error = errorMessage(error);
      } finally {
        this.loading = false;
      }
    },

    async book() {
      if (!this.selectedFlight || !this.selectedFareId) {
        this.error = 'Выберите тариф';
        return false;
      }
      this.loading = true;
      this.error = null;
      try {
        const { data } = await bookFlight({
          flight_id: this.selectedFlight.id,
          fare_id: this.selectedFareId,
          passengers: this.passengers,
          contact: this.contact,
        });
        this.orderId = data.book_id;
        return true;
      } catch (error) {
        this.error = errorMessage(error);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async loadBookings() {
      this.loading = true;
      this.error = null;
      try {
        this.bookings = (await getMyBookings()).data;
      } catch (error) {
        this.error = errorMessage(error);
      } finally {
        this.loading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFlightStore, import.meta.hot));
}
