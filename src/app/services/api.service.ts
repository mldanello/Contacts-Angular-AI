import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { firstValueFrom, retry, timeout, timer } from 'rxjs';
import { AuthToken } from '../models/auth-token.model';
import { ContactList } from '../models/contact-list.model';
import { ContactDetail, ContactSearchTag } from '../models/contact-detail.model';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly searchTagsCacheTtlMs = 2 * 60 * 1000;
  private readonly searchTagsRequestTimeoutMs = 1200;
  private readonly searchTagsRetryDelayMs = 250;
  private searchTagsCache: { value: string[]; expiresAt: number } | null = null;

  constructor(private http: HttpClient) {}

  get tokenUrl(): string {
    return `${this.baseUrl}/token`;
  }

  get contactsUrl(): string {
    return `${this.baseUrl}/contacts`;
  }

  get searchTagsUrl(): string {
    return `${this.baseUrl}/searchtags`;
  }

  get contactSearchTagsUrl(): string {
    return `${this.baseUrl}/contacts/searchtags`;
  }

  get contactTagsUrl(): string {
    return `${this.baseUrl}/contacts/tags`;
  }

  async authenticate(username: string, password: string): Promise<AuthToken> {
    return firstValueFrom(this.http.post<AuthToken>(this.tokenUrl, { username, password }));
  }

  async listContacts(): Promise<ContactList[]> {
    const payload = await firstValueFrom(this.http.get<unknown>(this.contactsUrl));
    return this.toContactList(payload);
  }

  async getContact(id: number): Promise<ContactDetail> {
    return firstValueFrom(this.http.get<ContactDetail>(`${this.contactsUrl}/${id}`));
  }

  async addContact(contact: ContactDetail): Promise<ContactDetail> {
    const saved = await firstValueFrom(this.http.post<ContactDetail | null>(this.contactsUrl, contact));
    const resolvedContact = saved ?? contact;
    this.mergeSearchTagsIntoCache(resolvedContact.contactSearchTags ?? contact.contactSearchTags ?? []);
    return resolvedContact;
  }

  async updateContact(contact: ContactDetail): Promise<ContactDetail> {
    const saved = await firstValueFrom(this.http.put<ContactDetail | null>(`${this.contactsUrl}/${contact.id}`, contact));
    const resolvedContact = saved ?? contact;
    this.mergeSearchTagsIntoCache(resolvedContact.contactSearchTags ?? contact.contactSearchTags ?? []);
    return resolvedContact;
  }

  async deleteContact(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.contactsUrl}/${id}`));
  }

  async listSearchTags(): Promise<string[]> {
    const cached = this.getValidSearchTagsCache();
    if (cached) {
      return [...cached];
    }

    try {
      const tags = await this.listSearchTagsFromKnownEndpoints();
      this.setSearchTagsCache(tags);
      return [...tags];
    } catch {
      const fallbackTags = await this.listSearchTagsFromContacts();
      const tags = this.toDistinctSortedTags(fallbackTags);
      this.setSearchTagsCache(tags);
      return [...tags];
    }
  }

  private getValidSearchTagsCache(): string[] | null {
    if (!this.searchTagsCache) {
      return null;
    }

    if (Date.now() >= this.searchTagsCache.expiresAt) {
      this.searchTagsCache = null;
      return null;
    }

    return this.searchTagsCache.value;
  }

  private setSearchTagsCache(tags: string[]): void {
    this.searchTagsCache = {
      value: [...tags],
      expiresAt: Date.now() + this.searchTagsCacheTtlMs
    };
  }

  private mergeSearchTagsIntoCache(tags: ContactSearchTag[]): void {
    const normalizedIncoming = this.toDistinctSortedTags(
      tags
        .filter(tag => tag.isActive)
        .map(tag => (tag.tagText ?? '').trim())
        .filter(tagText => tagText.length > 0)
    );

    if (normalizedIncoming.length === 0) {
      return;
    }

    const existing = this.getValidSearchTagsCache() ?? [];
    const merged = this.toDistinctSortedTags([...existing, ...normalizedIncoming]);
    this.setSearchTagsCache(merged);
  }

  private async listSearchTagsFromContacts(): Promise<string[]> {
    const contactsPayload = await firstValueFrom(this.http.get<unknown>(this.contactsUrl));
    const tagsFromListPayload = this.extractSearchTagTexts(contactsPayload);
    if (tagsFromListPayload.length > 0) {
      return tagsFromListPayload;
    }

    const contacts = await this.listContacts();
    const details = await Promise.allSettled(contacts.map(contact => this.getContact(contact.id)));

    return details
      .filter(
        (result): result is PromiseFulfilledResult<ContactDetail> => result.status === 'fulfilled'
      )
      .flatMap(result => result.value.contactSearchTags ?? [])
      .filter(tag => tag.isActive)
      .map(tag => (tag.tagText ?? '').trim())
      .filter(tagText => tagText.length > 0);
  }

  private async listSearchTagsFromKnownEndpoints(): Promise<string[]> {
    const urls = [this.searchTagsUrl, this.contactSearchTagsUrl, this.contactTagsUrl];
    let lastError: unknown = null;
    let sawSuccessfulResponse = false;

    for (const url of urls) {
      try {
        const response = await firstValueFrom(
          this.http.get<unknown>(url).pipe(
            timeout(this.searchTagsRequestTimeoutMs),
            retry({ count: 1, delay: () => timer(this.searchTagsRetryDelayMs) })
          )
        );
        sawSuccessfulResponse = true;
        const tags = this.toDistinctSortedTags(this.extractSearchTagTexts(response));
        if (tags.length > 0) {
          return tags;
        }
      } catch (error: unknown) {
        lastError = error;
      }
    }

    if (sawSuccessfulResponse) {
      return [];
    }

    throw lastError ?? new Error('Unable to load search tag suggestions.');
  }

  private toDistinctSortedTags(tagTexts: string[]): string[] {
    const unique = Array.from(new Set(tagTexts.map(tagText => tagText.toLowerCase())));
    const byKey = new Map(tagTexts.map(tagText => [tagText.toLowerCase(), tagText]));
    return unique
      .map(key => byKey.get(key) ?? key)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  private extractSearchTagTexts(payload: unknown): string[] {
    const root = this.unwrapCollectionPayload(payload);
    const results = this.collectSearchTagTexts(root, new Set<unknown>());
    return results.filter(tagText => tagText.length > 0);
  }

  private collectSearchTagTexts(node: unknown, seen: Set<unknown>): string[] {
    if (node === null || node === undefined) {
      return [];
    }

    if (typeof node !== 'object') {
      return [];
    }

    if (seen.has(node)) {
      return [];
    }
    seen.add(node);

    if (Array.isArray(node)) {
      const directStrings = node
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const nestedStrings = node
        .filter((item): item is object => !!item && typeof item === 'object')
        .flatMap(item => this.collectSearchTagTexts(item, seen));

      return [...directStrings, ...nestedStrings];
    }

    const obj = node as Record<string, unknown>;
    const directTagValues: string[] = [];

    const tagTextValue = obj['tagText'];
    if (typeof tagTextValue === 'string' && tagTextValue.trim().length > 0) {
      directTagValues.push(tagTextValue.trim());
    }

    const tagTextPascalValue = obj['TagText'];
    if (typeof tagTextPascalValue === 'string' && tagTextPascalValue.trim().length > 0) {
      directTagValues.push(tagTextPascalValue.trim());
    }

    const collectionKeys = [
      'contactSearchTags',
      'ContactSearchTags',
      'searchTags',
      'SearchTags',
      'tags',
      'Tags',
      'items',
      'Items',
      'value',
      'Value',
      'results',
      'Results',
      'data',
      'Data',
      '$values'
    ];

    const nestedTagValues = collectionKeys.flatMap(key => {
      if (!(key in obj)) {
        return [];
      }

      return this.collectSearchTagTexts(obj[key], seen);
    });

    return [...directTagValues, ...nestedTagValues];
  }

  private unwrapCollectionPayload(payload: unknown): unknown {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const maybeWrapped = payload as {
      items?: unknown;
      value?: unknown;
      results?: unknown;
      data?: unknown;
      $values?: unknown;
    };

    return (
      maybeWrapped.items ??
      maybeWrapped.value ??
      maybeWrapped.results ??
      maybeWrapped.data ??
      maybeWrapped.$values ??
      payload
    );
  }

  private toContactList(payload: unknown): ContactList[] {
    const root = this.unwrapCollectionPayload(payload);
    if (!Array.isArray(root)) {
      return [];
    }

    return root
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map(item => {
        const id = Number(item['id'] ?? 0);
        const firstName = String(item['firstName'] ?? '');
        const lastName = String(item['lastName'] ?? '');
        const rawSearchTags = item['searchTags'];

        return {
          id,
          firstName,
          lastName,
          searchTags: this.toStringList(rawSearchTags)
        };
      });
  }

  private toStringList(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    return [];
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
