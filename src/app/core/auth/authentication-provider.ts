import {
  AuthenticationResult,
  CreateUserInput,
  LoginCredentials,
  User,
} from '../../features/change-requests/models/change-request.models';

export abstract class AuthenticationProvider {
  abstract login(credentials: LoginCredentials): Promise<AuthenticationResult>;
  abstract createUser(input: CreateUserInput): Promise<User>;
  abstract restore(): Promise<AuthenticationResult | null>;
  abstract logout(): void;
}
