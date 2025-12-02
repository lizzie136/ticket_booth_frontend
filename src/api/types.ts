export type SeatingMode = 'GA' | 'SEATED';
export type TicketTierName = 'VIP' | 'FRONT_ROW' | 'GA';

export interface Event {
  id: number;
  slug: string;
  title: string;
  description: string;
  dates: EventDateSummary[];
}

export interface EventDateSummary {
  id: number;
  date: string;
  venueName: string;
  seatingMode: SeatingMode;
}

export interface EventDate {
  id: number;
  event: {
    id: number;
    title: string;
    description: string;
  };
  date: string;
  venue: {
    id: number;
    name: string;
    capacity: number;
  };
  seatingMode: SeatingMode;
}

export interface Tier {
  id: number;
  name: TicketTierName;
  price: number;
  remaining: number;
}

export interface Seat {
  seatId: number;
  label: string;
  ticketType: TicketTierName;
  ticketTypeId?: number; // Optional - may not be in API response
  price: number;
  available: boolean;
}

export interface SeatRow {
  row: string;
  seats: Seat[];
}

export interface SeatSection {
  section: string;
  rows: SeatRow[];
}

export interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string; 
  firstName: string;
  lastName: string;
}

export interface GAAvailabilityResponse {
  seatingMode: 'GA';
  tiers: Tier[];
}

export interface SeatedAvailabilityResponse {
  seatingMode: 'SEATED';
  sections: SeatSection[];
}

export type AvailabilityResponse = GAAvailabilityResponse | SeatedAvailabilityResponse;

export interface GABookingRequest {
  eventDateId: number;
  customerName: string;
  userId: number;
  paymentSource: string;
  tiers: {
    ticketTypeId: number;
    quantity: number;
  }[];
}

export interface SeatedBookingRequest {
  eventDateId: number;
  customerName: string;
  userId: number;
  paymentSource: string;
  seats: {
    seatId: number;
    ticketTypeId: number;
  }[];
}

export type BookingRequest = GABookingRequest | SeatedBookingRequest;

export interface Ticket {
  id: number;
  ticketType: TicketTierName;
  seatLabel: string | null;
  toName: string;
}

export interface BookingResponse {
  orderId: number;
  totalAmount: number;
  tickets: Ticket[];
}

export interface BookingError {
  error: 'INSUFFICIENT_INVENTORY' | 'SEAT_ALREADY_TAKEN';
  message: string;
}

export interface OrderTicket {
  id: number;
  eventTitle: string;
  eventDate: string;
  ticketType: TicketTierName;
  seatLabel: string | null;
}

export interface Order {
  id: number;
  createdAt: string;
  customerName: string;
  totalAmount: number;
  tickets: OrderTicket[];
}


export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignUpResponse {
  token: string;
  user: AuthUser;
}
