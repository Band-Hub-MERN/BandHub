import { apiClient } from './client';
import type { Invite, Organization } from '../data/mockData';

export interface OutgoingInvite {
  id: string;
  invitedEmail: string;
  role?: 'admin' | 'member' | 'owner';
  status: string;
  expiresAt: string;
  createdAt: string;
}

export async function createOrganization(
  name: string,
  category: string,
  description = '',
): Promise<void> {
  const response = await apiClient.post<{ accessToken?: string }>('/api/org/create', {
    name,
    category,
    description,
  });
  if (response.data?.accessToken) {
    localStorage.setItem('token_data', response.data.accessToken);
  }
}

export async function getOrganizations(): Promise<Organization[]> {
  const response = await apiClient.get<Organization[]>('/api/organizations');
  return Array.isArray(response.data) ? response.data : [];
}

export async function getOrganizationById(id: string): Promise<Organization> {
  const response = await apiClient.get<Organization>(`/api/organizations/${encodeURIComponent(id)}`);
  return response.data;
}

export async function updateOrganization(
  id: string,
  payload: Partial<Pick<Organization, 'name' | 'category' | 'description' | 'color'>>,
): Promise<Organization> {
  const response = await apiClient.patch<Organization>(`/api/organizations/${encodeURIComponent(id)}`, payload);
  return response.data;
}

export async function inviteToOrganization(id: string, email: string, role: 'admin' | 'member'): Promise<void> {
  await apiClient.post(`/api/organizations/${encodeURIComponent(id)}/invite`, { email, role });
}

export async function updateOrganizationMemberRole(
  orgId: string,
  memberId: string,
  role: 'admin' | 'member',
): Promise<Organization> {
  const response = await apiClient.patch<Organization>(
    `/api/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(memberId)}`,
    { role },
  );
  return response.data;
}

export async function removeOrganizationMember(orgId: string, memberId: string): Promise<void> {
  await apiClient.delete(`/api/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(memberId)}`);
}

export async function leaveOrganization(orgId: string): Promise<void> {
  const response = await apiClient.delete<{ accessToken?: string }>(`/api/organizations/${encodeURIComponent(orgId)}/leave`);
  if (response.data?.accessToken) {
    localStorage.setItem('token_data', response.data.accessToken);
  }
}

export async function deleteOrganization(orgId: string): Promise<void> {
  const response = await apiClient.delete<{ accessToken?: string }>(`/api/organizations/${encodeURIComponent(orgId)}`);
  if (response.data?.accessToken) {
    localStorage.setItem('token_data', response.data.accessToken);
  }
}

export async function getOrganizationInvites(): Promise<OutgoingInvite[]> {
  const response = await apiClient.get<{ invites: OutgoingInvite[] }>('/api/org/invites');
  return response.data.invites;
}

export async function sendOrganizationInvite(invitedEmail: string, role: 'admin' | 'member' = 'member'): Promise<void> {
  await apiClient.post('/api/org/invites', { invitedEmail, role });
}

export async function acceptOrganizationInvite(inviteId: string): Promise<void> {
  const response = await apiClient.post<{ accessToken?: string }>('/api/org/invites/accept', { inviteId });
  if (response.data?.accessToken) {
    localStorage.setItem('token_data', response.data.accessToken);
  }
}

export async function getIncomingInvites(): Promise<Invite[]> {
  const response = await apiClient.get<Invite[]>('/api/invites');
  return Array.isArray(response.data) ? response.data : [];
}

export async function acceptIncomingInvite(inviteId: string): Promise<void> {
  const response = await apiClient.post<{ accessToken?: string }>(`/api/invites/${encodeURIComponent(inviteId)}/accept`);
  if (response.data?.accessToken) {
    localStorage.setItem('token_data', response.data.accessToken);
  }
}

export async function declineIncomingInvite(inviteId: string): Promise<void> {
  await apiClient.post(`/api/invites/${encodeURIComponent(inviteId)}/decline`);
}
