import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ContactList } from '../models/contact-list.model';
import { ContactDetail } from '../models/contact-detail.model';

@Component({
  standalone: true,
  selector: 'app-contacts',
  imports: [FormsModule],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private api = inject(ApiService);

  message = signal('');
  error = signal('');
  loading = signal(false);
  loadingDetail = signal(false);

  contacts = signal<ContactList[]>([]);
  selectedContactId = signal<number | null>(null);
  selectedContact = signal<ContactDetail>(this.newContactTemplate());
  editing = signal(false);
  originalContact = signal<ContactDetail | null>(null);

  constructor() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    } else {
      this.loadContacts();
    }
  }

  async loadContacts(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const contacts = await this.api.listContacts();
      const sortedContacts = this.sortContacts(contacts);
      this.contacts.set(sortedContacts);
      if (sortedContacts.length > 0) {
        await this.selectContact(sortedContacts[0]);
      }
    } catch {
      this.error.set('Could not load contacts.');
    } finally {
      this.loading.set(false);
    }
  }

  async selectContact(contact: ContactList, edit = false): Promise<void> {
    this.selectedContactId.set(contact.id);
    this.message.set('');
    this.error.set('');

    await this.loadContactDetail(contact.id);
    this.originalContact.set({ ...this.selectedContact() });
    this.editing.set(edit);
  }

  createNewContact(): void {
    this.selectedContactId.set(null);
    this.selectedContact.set(this.newContactTemplate());
    this.originalContact.set(null);
    this.editing.set(true);
    this.message.set('');
    this.error.set('');
  }

  private async loadContactDetail(id: number): Promise<void> {
    this.loadingDetail.set(true);
    this.error.set('');

    try {
      const contact = await this.api.getContact(id);
      this.selectedContact.set({ ...contact });
    } catch {
      this.error.set('Unable to load selected contact.');
    } finally {
      this.loadingDetail.set(false);
    }
  }

  goToEditMode(contact?: ContactDetail): void {
    const selected = contact ? { ...contact } : { ...this.selectedContact() };
    this.selectedContact.set(selected);
    this.originalContact.set({ ...selected });
    this.editing.set(true);
    this.message.set('');
    this.error.set('');
  }

  cancelEdit(): void {
    const original = this.originalContact();
    const selectedId = this.selectedContactId();
    const firstContact = this.contacts()[0];

    if (original && original.id > 0) {
      this.selectedContact.set({ ...original });
    } else if (selectedId) {
      const selectedListItem = this.contacts().find(contact => contact.id === selectedId);
      if (selectedListItem) {
        this.editing.set(false);
        this.message.set('');
        this.error.set('');
        void this.selectContact(selectedListItem);
        return;
      }
    } else if (firstContact) {
      this.editing.set(false);
      this.message.set('');
      this.error.set('');
      void this.selectContact(firstContact);
      return;
    } else {
      this.selectedContact.set(this.newContactTemplate());
    }

    this.editing.set(false);
    this.message.set('');
    this.error.set('');
  }

  setSelectedContactField<K extends keyof Omit<ContactDetail, 'id' | 'tenantId' | 'isActive' | 'createdAt' | 'modifiedAt'>>(
    field: K,
    value: ContactDetail[K]
  ): void {
    this.selectedContact.update(contact => ({ ...contact, [field]: value }));
  }

  async saveContact(): Promise<void> {
    this.error.set('');
    this.message.set('');
    this.loading.set(true);

    const contact = this.selectedContact();
    try {
      if (contact.id > 0) {
        await this.api.updateContact(contact);
        this.message.set('Contact saved successfully.');
        this.editing.set(false);
        await this.selectContact(this.toListItem(contact));
        this.updateLocalList(this.selectedContact());
      } else {
        const saved = await this.api.addContact(contact);
        this.message.set('Contact saved successfully.');
        this.updateLocalList(saved);
        this.editing.set(false);
        await this.selectContact(this.toListItem(saved));
      }
    } catch {
      this.error.set('Unable to save contact.');
    } finally {
      this.loading.set(false);
    }
  }

  confirmDelete(id: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this contact?');
    if (!confirmed) {
      return;
    }

    this.removeContact(id);
  }

  async removeContact(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await this.api.deleteContact(id);
      this.contacts.update(list => list.filter(contact => contact.id !== id));
      this.message.set('Contact removed.');
      if (this.selectedContactId() === id) {
        const remaining = this.contacts();
        if (remaining.length > 0) {
          await this.selectContact(remaining[0]);
        } else {
          this.createNewContact();
        }
      }
    } catch {
      this.error.set('Unable to delete contact.');
    } finally {
      this.loading.set(false);
    }
  }

  updateLocalList(contact: ContactDetail): void {
    const listItem = this.toListItem(contact);
    this.contacts.update(list => {
      const index = list.findIndex(item => item.id === listItem.id);
      if (index === -1) {
        return this.sortContacts([...list, listItem]);
      }
      const updated = [...list];
      updated[index] = listItem;
      return this.sortContacts(updated);
    });
  }

  newContactTemplate(): ContactDetail {
    const now = new Date().toISOString();

    return {
      id: 0,
      tenantId: 1,
      firstName: '',
      middleName: '',
      lastName: '',
      companyName: '',
      email: '',
      web: '',
      notes: '',
      isActive: true,
      createdAt: now,
      modifiedAt: now
    };
  }

  private toListItem(contact: ContactDetail): ContactList {
    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName
    };
  }

  private sortContacts(list: ContactList[]): ContactList[] {
    return [...list].sort((a, b) => {
      const lastNameComparison = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: 'base' });
      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }

      return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: 'base' });
    });
  }
}
