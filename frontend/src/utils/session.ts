export type AccountType = 'fan' | 'member';

export interface SessionUser {
  id: string;
  email: string;
  isVerified?: boolean;
  accountType: AccountType;
  displayName: string;
  organizationId: string | null;
  memberRoleLabel: string;
}

const USER_KEY = 'user_data';

export function storeUser(user: SessionUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.id || !parsed?.email || !parsed?.accountType) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('token_data');
}

export function hasSession(): boolean {
  const user = getStoredUser();
  const token = localStorage.getItem('token_data');
  return Boolean(user && token);
}
