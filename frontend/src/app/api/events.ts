import { apiClient } from './client';
import type { GarageEvent } from '../data/mockData';

export async function getEvents(): Promise<GarageEvent[]> {
  const response = await apiClient.get<GarageEvent[]>('/api/events');
  return Array.isArray(response.data) ? response.data : [];
}

export async function getEventById(id: string): Promise<GarageEvent | null> {
  const response = await apiClient.get<GarageEvent>(`/api/events/${encodeURIComponent(id)}`);
  return response.data;
}

export async function createEvent(payload: {
  title: string;
  description: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  garageId: string;
  floor: number;
  isPublic: boolean;
  orgId?: string;
  coverImage?: string;
}): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>('/api/events', payload);
  return response.data;
}

export async function uploadEventImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post<{ imageUrl: string }>('/api/uploads/event-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.imageUrl;
}

export async function updateEvent(id: string, payload: Partial<GarageEvent>): Promise<void> {
  await apiClient.patch(`/api/events/${encodeURIComponent(id)}`, payload);
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/api/events/${encodeURIComponent(id)}`);
}

export async function rsvpToEvent(id: string): Promise<{ attendees: number; isGoing: boolean; alreadyGoing: boolean }> {
  const response = await apiClient.post<{ attendees: number; isGoing: boolean; alreadyGoing: boolean }>(
    `/api/events/${encodeURIComponent(id)}/rsvp`,
  );
  return response.data;
}
