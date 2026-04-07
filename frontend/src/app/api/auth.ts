import { apiClient, clearAccessToken, storeAccessToken } from './client';
import type { AccountType, User } from '../data/mockData';

interface BackendUser {
  id: string;
  email: string;
  accountType: AccountType;
  displayName: string;
  organizationId: string | null;
  memberRoleLabel: string;
  bio?: string;
  notificationPrefs?: {
    invites: boolean;
    events: boolean;
    bookings: boolean;
    digest: boolean;
  };
}

interface AuthResponse {
  accessToken: string;
  user: BackendUser;
}

function initialsFromName(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'U';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

export function mapBackendUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.displayName,
    email: user.email,
    avatar: initialsFromName(user.displayName),
    accountType: user.accountType,
    bio: user.bio || '',
    orgId: user.organizationId || undefined,
    orgIds: user.organizationId ? [user.organizationId] : [],
  };
}

export async function loginRequest(email: string, password: string): Promise<User> {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
  storeAccessToken(response.data.accessToken);
  return mapBackendUser(response.data.user);
}

export async function registerRequest(payload: {
  email: string;
  password: string;
  displayName: string;
  accountType: AccountType;
  memberRoleLabel?: string;
}): Promise<{ registrationStatusToken?: string; user: User; message: string }> {
  const response = await apiClient.post<{
    registrationStatusToken?: string;
    message: string;
    user: BackendUser;
  }>('/api/auth/register', payload);

  return {
    registrationStatusToken: response.data.registrationStatusToken,
    message: response.data.message,
    user: mapBackendUser(response.data.user),
  };
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<AuthResponse>('/api/auth/me');
  storeAccessToken(response.data.accessToken);
  return mapBackendUser(response.data.user);
}

export async function verifyEmailToken(token: string): Promise<User> {
  const response = await apiClient.get<AuthResponse>(`/api/auth/verify?token=${encodeURIComponent(token)}`);
  storeAccessToken(response.data.accessToken);
  return mapBackendUser(response.data.user);
}

export function logoutRequest(): void {
  clearAccessToken();
}

export async function updateMe(payload: {
  displayName?: string;
  bio?: string;
  memberRoleLabel?: string;
  notificationPrefs?: {
    invites: boolean;
    events: boolean;
    bookings: boolean;
    digest: boolean;
  };
}): Promise<User> {
  const response = await apiClient.patch<AuthResponse>('/api/auth/me', payload);
  storeAccessToken(response.data.accessToken);
  return mapBackendUser(response.data.user);
}
