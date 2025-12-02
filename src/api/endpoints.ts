import axios, { AxiosError } from 'axios';
import { apiClient } from './client';
import type {
  Event,
  EventDate,
  AvailabilityResponse,
  BookingRequest,
  BookingResponse,
  BookingError,
  Order,
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
} from './types';

export const getEvents = async (): Promise<Event[]> => {
  const response = await apiClient.get<Event[]>('/api/events');
  return response.data;
};

export const getEventDate = async (id: number): Promise<EventDate> => {
  const response = await apiClient.get<EventDate>(`/api/event-dates/${id}`);
  return response.data;
};

export const getAvailability = async (id: number): Promise<AvailabilityResponse> => {
  const response = await apiClient.get<AvailabilityResponse>(`/api/event-dates/${id}/availability`);
  return response.data;
};

export const createBooking = async (
  data: BookingRequest
): Promise<BookingResponse> => {
  const response = await apiClient.post<BookingResponse>('/api/bookings', data);
  return response.data;
};

export const getOrder = async (id: number): Promise<Order> => {
  const response = await apiClient.get<Order>(`/api/orders/${id}`);
  return response.data;
};

export const getOrders = async (userId: number): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>('/api/orders', {
    params: { userId },
  });
  return response.data;
};

// Helper to check if error is a booking conflict
export const isBookingError = (
  error: unknown
): error is AxiosError<BookingError> => {
  return (
    axios.isAxiosError<BookingError>(error) &&
    error.response?.status === 409 &&
    (error.response.data?.error === 'INSUFFICIENT_INVENTORY' ||
      error.response.data?.error === 'SEAT_ALREADY_TAKEN')
  );
};

export const getBookingError = (error: unknown): BookingError | null => {
  if (isBookingError(error)) {
    return error.response?.data ?? null;
  }
  return null;
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/login', data);
  return response.data;
};

export const signUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  const response = await apiClient.post<SignUpResponse>('/api/signup', data);
  return response.data;
};
