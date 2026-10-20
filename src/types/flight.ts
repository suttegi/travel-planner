export type Cabin = 'economy' | 'business';
export type PassengerType = 'adult' | 'child' | 'infant';
export type PassengerCountKey = 'adt' | 'chd' | 'inf';
export type SortType = 'cheaper' | 'earlier' | 'faster';

export interface Location {
  code: string | null;
  name: string | null;
  country: string | null;
}

export interface PassengersCount {
  adt: number;
  chd: number;
  inf: number;
}

export interface SearchForm {
  from: Location;
  to: Location;
  date: string | null;
  returnDate: string | null;
  isRoundTrip: boolean;
  passengers: PassengersCount;
  cabin: Cabin;
}

export interface SearchPayload {
  cabin_class: Cabin;
  direct_flight: boolean;
  only_refundable: boolean;
  passengers: { adult: number; child: number; infant: number };
  routes: { departure_code: string; arrival_code: string; departure_date: string }[];
}

export interface Point {
  time: string;
  date: string;
  city: string;
  airport: string;
  code: string;
}

export interface Segment {
  carrier: { code: string; name: string; number: string };
  departure: Point;
  arrival: Point;
  duration: string;
  layover: string | null;
}

export interface Leg {
  departure: Point;
  arrival: Point;
  duration: string;
  durationMinutes: number;
  transfers: number;
  segments: Segment[];
}

export interface Flight {
  id: string;
  price: number;
  oldPrice: number | null;
  hasBaggage: boolean;
  legs: Leg[];
}

export interface Fare {
  id: string;
  name: string;
  price: number;
  oldPrice: number | null;
  features: { text: string; included: boolean }[];
}

export interface Passenger {
  type: PassengerType;
  lastName: string;
  firstName: string;
  birthDate: string;
  citizenship: string;
  docType: 'id_card' | 'passport' | 'birth_certificate';
  docNumber: string;
  docExpiry: string;
  gender: 'male' | 'female';
}

export interface Booking {
  book_id: string;
  flight: Flight;
  fare: { id: string; name: string; price: number };
  passengers: Passenger[];
  contact: Contact;
  createdAt: string;
}

export interface Contact {
  phone: string;
  email: string;
}

export interface TimeRange {
  min: number;
  max: number;
}

export interface Filters {
  stops: 0 | 1 | 'all';
  stopsDuration: number | null;
  time1: TimeRange;
  time2: TimeRange;
  time3: TimeRange;
  time4: TimeRange;
  airlines: string[];
}
