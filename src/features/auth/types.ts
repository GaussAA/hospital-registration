// ── Enums ──

export type UserRole = "patient" | "admin";

// ── Auth DTOs ──

export interface LoginDTO {
  account: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

// ── Patient Profile DTOs ──

export interface PatientProfileDTO {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  gender: string;
}

export interface UpdateProfileDTO {
  name?: string;
  idCard?: string;
  phone?: string;
  gender?: string;
}
