import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Contact } from '../models';

@Component({
  standalone: true,
  selector: 'app-contacts',
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent {
  username = '';
  password = '';
  authError = '';
  message = '';
  error = '';

  contacts = signal<Contact[]>([]);
  selectedContact = signal<Contact>(this.newContactTemplate());

  constructor(public authService: AuthService, private api: ApiService) {
    if (this.authService.isAuthenticated()) {
      this.loadContacts();
    }
  }

  login(): void {
    this.authError = '';
    this.authService.login(this.username, this.password).subscribe({
      next: () => this.loadContacts(),
      error: () => this.authError = 'Unable to sign in. Please check your credentials.'
    });
  }

  loadContacts(): void {
    this.error = '';
    this.api.listContacts().subscribe({
      next: contacts => this.contacts.set(contacts),
      error: () => this.error = 'Could not load contacts.'
    });
  }

  selectContact(contact: Contact): void {
    this.selectedContact.set({ ...contact });
  }

  saveContact(): void {
    this.error = '';
    this.message = '';
    const contact = this.selectedContact();
    const request = contact.id ? this.api.updateContact(contact) : this.api.addContact(contact);
    request.subscribe({
      next: saved => {
        this.message = 'Contact saved successfully.';
        this.updateLocalList(saved);
        this.selectContact(saved);
      },
      error: () => this.error = 'Unable to save contact.'
    });
  }

  removeContact(id: string): void {
    this.api.deleteContact(id).subscribe({
      next: () => {
        this.contacts.update(list => list.filter(contact => contact.id !== id));
        this.message = 'Contact removed.';
        if (this.selectedContact()?.id === id) {
          this.selectContact(this.newContactTemplate());
        }
      },
      error: () => this.error = 'Unable to delete contact.'
    });
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
