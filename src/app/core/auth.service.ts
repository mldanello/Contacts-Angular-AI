import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthToken } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'md-management-token';
  private tokenSubject = new BehaviorSubject<AuthToken | null>(this.loadToken());

  constructor(private api: ApiService) {}

  get token$(): Observable<AuthToken | null> {
    return this.tokenSubject.asObservable();
  }

  get token(): AuthToken | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.token?.accessToken;
  }

  login(username: string, password: string): Observable<AuthToken> {
    return this.api.authenticate(username, password).pipe(
      tap(token => {
        this.saveToken(token);
        this.tokenSubject.next(token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.tokenSubject.next(null);
  }

  private loadToken(): AuthToken | null {
    const raw = localStorage.getItem(this.tokenKey);
    return raw ? JSON.parse(raw) as AuthToken : null;
  }

  private saveToken(token: AuthToken): void {
    localStorage.setItem(this.tokenKey, JSON.stringify(token));
  }
}
