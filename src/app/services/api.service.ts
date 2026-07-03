import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact, AuthToken } from '../models/models';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  get tokenUrl(): string {
    return `${this.baseUrl}/token`;
  }

  get contactsUrl(): string {
    return `${this.baseUrl}/contacts`;
  }

  authenticate(username: string, password: string): Observable<AuthToken> {
    return this.http.post<AuthToken>(this.tokenUrl, { username, password });
  }

  listContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.contactsUrl);
  }

  getContact(id: string): Observable<Contact> {
    return this.http.get<Contact>(`${this.contactsUrl}/${id}`);
  }

  addContact(contact: Contact): Observable<Contact> {
    return this.http.post<Contact>(this.contactsUrl, contact);
  }

  updateContact(contact: Contact): Observable<Contact> {
    return this.http.put<Contact>(`${this.contactsUrl}/${contact.id}`, contact);
  }

  deleteContact(id: string): Observable<void> {
    return this.http.delete<void>(`${this.contactsUrl}/${id}`);
  }
}
