import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ContactList } from '../../models/contact-list.model';

@Component({
  standalone: true,
  selector: 'app-contact-list-component',
  imports: [FormsModule, MatIconModule],
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.css']
})
export class ContactListComponent implements OnChanges {
  private readonly listTagDisplayLimit = 4;

  @Input() contacts: ContactList[] = [];
  @Input() selectedContactId: number | null = null;

  @Output() selectContact = new EventEmitter<ContactList>();
  @Output() editContact = new EventEmitter<ContactList>();
  @Output() deleteContact = new EventEmitter<ContactList>();
  @Output() createContact = new EventEmitter<void>();
  @Output() clearSelection = new EventEmitter<void>();

  showListSearchTags = false;
  listFilterDraft = '';
  listFilterApplied = '';

  get filteredContacts(): ContactList[] {
    const filterValue = this.listFilterApplied.trim().toLowerCase();
    if (!filterValue) {
      return this.contacts;
    }

    return this.contacts.filter(contact => {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const tagText = (contact.searchTags ?? []).join(' ').toLowerCase();
      return fullName.includes(filterValue) || tagText.includes(filterValue);
    });
  }

  ngOnChanges(): void {
    this.ensureSelectionMatchesFilter();
  }

  toggleListSearchTags(): void {
    this.showListSearchTags = !this.showListSearchTags;
  }

  setListFilterDraft(value: string): void {
    this.listFilterDraft = value ?? '';
  }

  clearListFilterDraft(): void {
    this.listFilterDraft = '';
    this.applyListFilter();
  }

  applyListFilter(): void {
    this.listFilterApplied = this.listFilterDraft.trim();
    this.ensureSelectionMatchesFilter(true);
  }

  requestSelect(contact: ContactList): void {
    this.selectContact.emit(contact);
  }

  requestEdit(contact: ContactList, event: MouseEvent): void {
    event.stopPropagation();
    this.editContact.emit(contact);
  }

  requestDelete(contact: ContactList, event: MouseEvent): void {
    event.stopPropagation();
    this.deleteContact.emit(contact);
  }

  requestCreate(): void {
    this.createContact.emit();
  }

  getVisibleListTags(contact: ContactList): string[] {
    return contact.searchTags.slice(0, this.listTagDisplayLimit);
  }

  getHiddenListTagCount(contact: ContactList): number {
    return Math.max(contact.searchTags.length - this.listTagDisplayLimit, 0);
  }

  private ensureSelectionMatchesFilter(forceSelectionWhenListPresent = false): void {
    const filtered = this.filteredContacts;

    if (filtered.length === 0) {
      if (this.listFilterApplied.length > 0 || forceSelectionWhenListPresent) {
        this.clearSelection.emit();
      }
      return;
    }

    const selectedIsVisible = this.selectedContactId !== null
      && filtered.some(contact => contact.id === this.selectedContactId);

    if (!selectedIsVisible && (this.listFilterApplied.length > 0 || forceSelectionWhenListPresent)) {
      this.selectContact.emit(filtered[0]);
    }
  }
}
