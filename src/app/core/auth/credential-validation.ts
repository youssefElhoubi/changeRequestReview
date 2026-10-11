import {
  CreateUserInput,
  LoginCredentials,
} from '../../features/change-requests/models/change-request.models';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

export function isValidPassword(password: string): boolean {
  return (
    password.length >= MIN_PASSWORD_LENGTH && PASSWORD_PATTERN.test(password)
  );
}

export function validateLoginCredentials(
  credentials: LoginCredentials,
): boolean {
  return isValidEmail(credentials.email) && credentials.password.length > 0;
}

export function validateCreateUserInput(input: CreateUserInput): string | null {
  if (!input.name.trim() || !isValidEmail(input.email)) {
    return 'Enter a name and a valid email address.';
  }

  if (!isValidPassword(input.password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
  }

  return null;
}
