import { Injectable, computed, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthToken } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'md-management-token';
  private tokenSignal = signal<AuthToken | null>(this.loadToken());
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticatedSignal = computed(() => !!this.tokenSignal()?.accessToken);

  constructor(private api: ApiService) {}

  get tokenValue(): AuthToken | null {
    return this.tokenSignal();
  }

  isAuthenticated(): boolean {
    return !!this.tokenValue?.accessToken;
  }

  async login(username: string, password: string): Promise<AuthToken> {
    const token = await this.api.authenticate(username, password);
    this.saveToken(token);
    this.tokenSignal.set(token);
    return token;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.tokenSignal.set(null);
  }

  private loadToken(): AuthToken | null {
    const raw = localStorage.getItem(this.tokenKey);
    return raw ? (JSON.parse(raw) as AuthToken) : null;
  }

  private saveToken(token: AuthToken): void {
    localStorage.setItem(this.tokenKey, JSON.stringify(token));
  }
}
