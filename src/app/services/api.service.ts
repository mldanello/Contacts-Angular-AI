import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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

  async authenticate(username: string, password: string): Promise<AuthToken> {
    return firstValueFrom(this.http.post<AuthToken>(this.tokenUrl, { username, password }));
  }

  async listContacts(): Promise<Contact[]> {
    return firstValueFrom(this.http.get<Contact[]>(this.contactsUrl));
  }

  async getContact(id: string): Promise<Contact> {
    return firstValueFrom(this.http.get<Contact>(`${this.contactsUrl}/${id}`));
  }

  async addContact(contact: Contact): Promise<Contact> {
    return firstValueFrom(this.http.post<Contact>(this.contactsUrl, contact));
  }

  async updateContact(contact: Contact): Promise<Contact> {
    return firstValueFrom(this.http.put<Contact>(`${this.contactsUrl}/${contact.id}`, contact));
  }

  async deleteContact(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.contactsUrl}/${id}`));
  }
}
