import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { Contact, AuthToken } from '../models';

const mockContacts: Contact[] = [
  {
    id: '1',
    firstName: 'Maya',
    lastName: 'Dane',
    email: 'maya.dane@example.com',
    phone: '+1 555 0123',
    company: 'MD Management Studio',
    notes: 'Core contact for event planning.'
  },
  {
    id: '2',
    firstName: 'James',
    lastName: 'Harper',
    email: 'james.harper@example.com',
    phone: '+1 555 0456',
    company: 'Studio Finance',
    notes: 'Accounts lead.'
  }
];

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return of(null).pipe(
      delay(300),
      mergeMap(() => {
        if (req.url.endsWith('/token') && req.method === 'POST') {
          return this.handleToken(req as HttpRequest<{ username: string; password: string }>);
        }

        if (req.url.endsWith('/contacts') && req.method === 'GET') {
          return of(new HttpResponse({ status: 200, body: mockContacts }));
        }

        if (req.url.match(/\/contacts\/\w+$/) && req.method === 'GET') {
          const id = req.url.split('/').pop() as string;
          const contact = mockContacts.find(item => item.id === id);
          return contact
            ? of(new HttpResponse({ status: 200, body: contact }))
            : throwError(() => ({ status: 404, error: 'Not found' }));
        }

        if (req.url.endsWith('/contacts') && req.method === 'POST') {
          const newContact = { ...(req.body as Contact), id: `${Date.now()}` };
          mockContacts.push(newContact);
          return of(new HttpResponse({ status: 201, body: newContact }));
        }

        if (req.url.match(/\/contacts\/\w+$/) && req.method === 'PUT') {
          const id = req.url.split('/').pop() as string;
          const body = req.body as Contact;
          const index = mockContacts.findIndex(item => item.id === id);
          if (index === -1) {
            return throwError(() => ({ status: 404, error: 'Not found' }));
          }
          mockContacts[index] = body;
          return of(new HttpResponse({ status: 200, body: body }));
        }

        if (req.url.match(/\/contacts\/\w+$/) && req.method === 'DELETE') {
          const id = req.url.split('/').pop() as string;
          const index = mockContacts.findIndex(item => item.id === id);
          if (index === -1) {
            return throwError(() => ({ status: 404, error: 'Not found' }));
          }
          mockContacts.splice(index, 1);
          return of(new HttpResponse({ status: 200 }));
        }

        return next.handle(req);
      })
    );
  }

  private handleToken(req: HttpRequest<{ username: string; password: string }>): Observable<HttpEvent<unknown>> {
    const credentials = req.body;
    if (credentials?.username && credentials.password) {
      const token: AuthToken = { accessToken: 'mock-token-12345', expiresIn: 3600 };
      return of(new HttpResponse({ status: 200, body: token }));
    }
    return throwError(() => ({ status: 400, error: 'Missing credentials' }));
  }
}

export const mockBackendProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: MockBackendInterceptor,
  multi: true
};
