import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthToken } from '../models/auth-token.model';
import { ContactList } from '../models/contact-list.model';
import { ContactDetail } from '../models/contact-detail.model';

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

  async listContacts(): Promise<ContactList[]> {
    return firstValueFrom(this.http.get<ContactList[]>(this.contactsUrl));
  }

  async getContact(id: number): Promise<ContactDetail> {
    return firstValueFrom(this.http.get<ContactDetail>(`${this.contactsUrl}/${id}`));
  }

  async addContact(contact: ContactDetail): Promise<ContactDetail> {
    return firstValueFrom(this.http.post<ContactDetail>(this.contactsUrl, contact));
  }

  async updateContact(contact: ContactDetail): Promise<ContactDetail> {
    return firstValueFrom(this.http.put<ContactDetail>(`${this.contactsUrl}/${contact.id}`, contact));
  }

  async deleteContact(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.contactsUrl}/${id}`));
  }

  async checkApiReachability(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(this.contactsUrl, { observe: 'response' })
      );
      return this.isReachableResponse(response);
    } catch (error: unknown) {
      const status = this.getHttpStatus(error);
      return status > 0;
    }
  }

  private isReachableResponse(response: HttpResponse<unknown>): boolean {
    return response.status > 0;
  }

  private getHttpStatus(error: unknown): number {
    if (!error || typeof error !== 'object') {
      return 0;
    }

    const maybeStatus = (error as { status?: unknown }).status;
    return typeof maybeStatus === 'number' ? maybeStatus : 0;
  }
}
