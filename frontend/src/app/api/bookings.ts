import { apiClient } from './client';
import type { Booking } from '../data/mockData';

export async function getGarageBookings(garageId: string, date: string): Promise<Booking[]> {
  const response = await apiClient.get<Booking[]>('/api/bookings', {
    params: { garageId, date },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getMyBookings(): Promise<Booking[]> {
  const response = await apiClient.get<Booking[]>('/api/bookings/mine');
  return Array.isArray(response.data) ? response.data : [];
}

export async function createBooking(payload: {
  garageId: string;
  floor: number;
  startTime: string;
  endTime: string;
  date: string;
  isWeekly: boolean;
  orgId?: string;
}): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>('/api/bookings', payload);
  return response.data;
}

export async function deleteBooking(id: string): Promise<void> {
  await apiClient.delete(`/api/bookings/${encodeURIComponent(id)}`);
}
