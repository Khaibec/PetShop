export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
  role: 'Admin' | 'User';
  createdAt?: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'User';
  expiresAt: string;
}

export interface ExternalAccount {
  id: number;
  provider: string;
  providerEmail?: string;
  createdAt: string;
}
