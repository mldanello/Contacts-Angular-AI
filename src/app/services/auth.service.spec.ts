/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock?.verify();
  });

  it('stores a token returned by the API and marks the user authenticated', async () => {
    const loginPromise = service.login('demo', 'password');

    const req = httpMock.expectOne('http://localhost:4200/api/token');
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 'abc123', expiresIn: 3600 });

    await loginPromise;

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.tokenValue?.accessToken).toBe('abc123');
  });
});
