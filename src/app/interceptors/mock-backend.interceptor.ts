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
import { AuthToken } from '../models/auth-token.model';
import { ContactDetail } from '../models/contact-detail.model';
import { ContactList } from '../models/contact-list.model';

const mockContacts: ContactDetail[] = [
  {
    id: 1,
    tenantId: 1,
    firstName: 'Maya',
    middleName: '',
    lastName: 'Dane',
    companyName: 'MD Management Studio',
    email: 'maya.dane@example.com',
    web: 'https://mdms.example.com',
    notes: 'Core contact for event planning.',
    isActive: true,
    createdAt: '2026-01-10T08:30:00Z',
    modifiedAt: '2026-06-25T14:15:00Z',
    contactAddresses: [],
    contactPhones: []
  },
  {
    id: 2,
    tenantId: 1,
    firstName: 'James',
    middleName: '',
    lastName: 'Harper',
    companyName: 'Studio Finance',
    email: 'james.harper@example.com',
    web: '',
    notes: 'Accounts lead.',
    isActive: true,
    createdAt: '2026-02-01T11:00:00Z',
    modifiedAt: '2026-06-20T09:45:00Z',
    contactAddresses: [],
    contactPhones: []
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
          const listItems: ContactList[] = mockContacts.map(({ id, firstName, lastName }) => ({
            id,
            firstName,
            lastName
          }));
          return of(new HttpResponse({ status: 200, body: listItems }));
        }

        if (req.url.match(/\/contacts\/\w+$/) && req.method === 'GET') {
          const id = Number(req.url.split('/').pop());
          const contact = mockContacts.find(item => item.id === id);
          return contact
            ? of(new HttpResponse({ status: 200, body: contact }))
            : throwError(() => ({ status: 404, error: 'Not found' }));
        }

        if (req.url.endsWith('/contacts') && req.method === 'POST') {
          const body = req.body as ContactDetail;
          const now = new Date().toISOString();
          const maxId = mockContacts.reduce((max, item) => Math.max(max, item.id), 0);
          const newContact: ContactDetail = {
            id: maxId + 1,
            tenantId: body.tenantId ?? 1,
            firstName: body.firstName ?? '',
            middleName: body.middleName ?? '',
            lastName: body.lastName,
            companyName: body.companyName ?? '',
            email: body.email ?? '',
            web: body.web ?? '',
            notes: body.notes ?? '',
            isActive: body.isActive ?? true,
            createdAt: now,
            modifiedAt: now,
            contactAddresses: body.contactAddresses ?? [],
            contactPhones: body.contactPhones ?? []
          };
          mockContacts.push(newContact);
          return of(new HttpResponse({ status: 201, body: newContact }));
        }

        if (req.url.match(/\/contacts\/\w+$/) && req.method === 'PUT') {
          const id = Number(req.url.split('/').pop());
          const body = req.body as ContactDetail;
          const index = mockContacts.findIndex(item => item.id === id);
          if (index === -1) {
            return throwError(() => ({ status: 404, error: 'Not found' }));
          }

          const existing = mockContacts[index];
          const updated: ContactDetail = {
            ...existing,
            ...body,
            id: existing.id,
            isActive: existing.isActive,
            createdAt: existing.createdAt,
            modifiedAt: new Date().toISOString()
          };
          mockContacts[index] = updated;
          return of(new HttpResponse({ status: 200, body: updated }));
        }

        if (req.url.match(/\/contacts\/\w+$/) && req.method === 'DELETE') {
          const id = Number(req.url.split('/').pop());
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
