export const airports = [
  { code: 'ALA', name: 'Алматы', country: 'Казахстан', airport: 'Международный аэропорт Алматы', hub: true },
  { code: 'NQZ', name: 'Астана', country: 'Казахстан', airport: 'Нурсултан Назарбаев', hub: true },
  { code: 'CIT', name: 'Шымкент', country: 'Казахстан', airport: 'Аэропорт Шымкент' },
  { code: 'KGF', name: 'Караганда', country: 'Казахстан', airport: 'Сары-Арка' },
  { code: 'AKX', name: 'Актобе', country: 'Казахстан', airport: 'Аэропорт Актобе' },
  { code: 'GUW', name: 'Атырау', country: 'Казахстан', airport: 'Аэропорт Атырау' },
  { code: 'SCO', name: 'Актау', country: 'Казахстан', airport: 'Аэропорт Актау' },
  { code: 'UKK', name: 'Усть-Каменогорск', country: 'Казахстан', airport: 'Аэропорт Усть-Каменогорск' },
  { code: 'TSE', name: 'Туркестан', country: 'Казахстан', airport: 'Хазрет Султан' },
  { code: 'IST', name: 'Стамбул', country: 'Турция', airport: 'Аэропорт Стамбул' },
  { code: 'DXB', name: 'Дубай', country: 'ОАЭ', airport: 'Международный аэропорт Дубай' },
  { code: 'TAS', name: 'Ташкент', country: 'Узбекистан', airport: 'Ислам Каримов' },
  { code: 'FRU', name: 'Бишкек', country: 'Кыргызстан', airport: 'Манас' },
];

export const airlines = [
  { code: 'KC', name: 'Air Astana' },
  { code: 'FS', name: 'FlyArystan' },
  { code: 'DV', name: 'SCAT' },
  { code: 'QH', name: 'Qazaq Air' },
];

export const fareTemplates = [
  {
    id: 'basic',
    name: 'Basic',
    multiplier: 1,
    features: [
      { text: 'Ручная кладь 5 кг', included: true },
      { text: 'Багаж', included: false },
      { text: 'Возврат', included: false },
    ],
  },
  {
    id: 'classic',
    name: 'Classic',
    multiplier: 1.2,
    features: [
      { text: 'Ручная кладь 7 кг', included: true },
      { text: 'Багаж 20 кг', included: true },
      { text: 'Возврат', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    multiplier: 1.4,
    features: [
      { text: 'Ручная кладь 10 кг', included: true },
      { text: 'Багаж 23 кг', included: true },
      { text: 'Возврат', included: true },
    ],
  },
];

export const countries = [
  { code: 'KZ', name: 'Казахстан' },
  { code: 'RU', name: 'Россия' },
  { code: 'UZ', name: 'Узбекистан' },
  { code: 'KG', name: 'Кыргызстан' },
  { code: 'TR', name: 'Турция' },
  { code: 'AE', name: 'ОАЭ' },
];

export const users = [
  { id: 1, username: 'student', password: 'kbtu2026', email: 'student@kbtu.kz' },
  { id: 2, username: 'admin', password: 'admin123', email: 'admin@kbtu.kz' },
];
