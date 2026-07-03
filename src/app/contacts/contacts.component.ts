import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Contact } from '../models/models';

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

  contacts = signal<Contact[]>([]);
  selectedContact = signal<Contact>(this.newContactTemplate());
  editing = signal(false);
  originalContact = signal<Contact | null>(null);

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
      this.contacts.set(contacts);
    } catch {
      this.error.set('Could not load contacts.');
    } finally {
      this.loading.set(false);
    }
  }

  selectContact(contact: Contact, edit = false): void {
    this.selectedContact.set({ ...contact });
    this.message.set('');
    this.error.set('');

    if (contact.id) {
      this.originalContact.set({ ...contact });
      this.editing.set(edit);
    } else {
      this.originalContact.set(null);
      this.editing.set(true);
    }
  }

  goToEditMode(contact?: Contact): void {
    const selected = contact ? { ...contact } : { ...this.selectedContact() };
    this.selectedContact.set(selected);
    this.originalContact.set({ ...selected });
    this.editing.set(true);
    this.message.set('');
    this.error.set('');
  }

  cancelEdit(): void {
    const original = this.originalContact();
    if (original && original.id) {
      this.selectedContact.set({ ...original });
    } else {
      this.selectedContact.set(this.newContactTemplate());
    }
    this.editing.set(false);
    this.message.set('');
    this.error.set('');
  }

  setSelectedContactField<K extends keyof Contact>(field: K, value: Contact[K]): void {
    this.selectedContact.update(contact => ({ ...contact, [field]: value }));
  }

  async saveContact(): Promise<void> {
    this.error.set('');
    this.message.set('');
    this.loading.set(true);

    const contact = this.selectedContact();
    try {
      const saved = contact.id ? await this.api.updateContact(contact) : await this.api.addContact(contact);
      this.message.set('Contact saved successfully.');
      this.updateLocalList(saved);
      this.selectContact(saved);
      this.editing.set(false);
    } catch {
      this.error.set('Unable to save contact.');
    } finally {
      this.loading.set(false);
    }
  }

  confirmDelete(id: string): void {
    const confirmed = window.confirm('Are you sure you want to delete this contact?');
    if (!confirmed) {
      return;
    }

    this.removeContact(id);
  }

  async removeContact(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await this.api.deleteContact(id);
      this.contacts.update(list => list.filter(contact => contact.id !== id));
      this.message.set('Contact removed.');
      if (this.selectedContact()?.id === id) {
        this.selectContact(this.newContactTemplate());
      }
    } catch {
      this.error.set('Unable to delete contact.');
    } finally {
      this.loading.set(false);
    }
  }

  updateLocalList(contact: Contact): void {
    this.contacts.update(list => {
      const index = list.findIndex(item => item.id === contact.id);
      if (index === -1) {
        return [...list, contact];
      }
      const updated = [...list];
      updated[index] = contact;
      return updated;
    });
  }

  newContactTemplate(): Contact {
    return {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      notes: ''
    };
  }
}
