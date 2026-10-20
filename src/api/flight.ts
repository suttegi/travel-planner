import { api } from '@/boot/axios';
import type {
  Booking,
  Contact,
  Fare,
  Flight,
  Location,
  Passenger,
  SearchPayload,
} from '@/types/flight';

export const autocomplete = (query: string) => api.get<Location[]>(`/flight/autocomplete/${query}`);

export const searchFlights = (payload: SearchPayload) =>
  api.post<{ result: Flight[] }>('/flight/search', payload);

export const getFlight = (flightId: string) => api.get<Flight>(`/flight/${flightId}`);

export const getCalendarPrices = (from: string, to: string) =>
  api.get<Record<string, number>>(`/flight/calendar/${from}/${to}`);

export const getFares = (flightId: string) => api.get<Fare[]>(`/flight/fares/${flightId}`);

export const bookFlight = (body: {
  flight_id: string;
  fare_id: string;
  passengers: Passenger[];
  contact: Contact;
}) => api.post<{ book_id: string }>('/flight/book', body);

export const getCountries = () => api.get<{ code: string; name: string }[]>('/countries');

export const getMyBookings = () => api.get<Booking[]>('/bookings');
