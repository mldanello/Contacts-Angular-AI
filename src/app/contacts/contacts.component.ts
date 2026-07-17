import { Component, computed, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { environment } from '../../environments/environment';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ContactList } from '../models/contact-list.model';
import { ContactAddress, ContactDetail, ContactPhone, ContactSearchTag } from '../models/contact-detail.model';

type EditTab = 'profile' | 'communication';
type CommunicationStoreKey = number | 'new';

interface CommunicationData {
  addresses: ContactAddress[];
  phones: ContactPhone[];
}

type DialogMode = 'add' | 'edit';

@Component({
  standalone: true,
  selector: 'app-contacts',
  imports: [FormsModule, MatIconModule],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private matIconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  message = signal('');
  error = signal('');
  loading = signal(false);
  loadingDetail = signal(false);
  showResponsiveDebug = signal(false);
  allowResponsiveDebug = !environment.production;

  contacts = signal<ContactList[]>([]);
  selectedContactId = signal<number | null>(null);
  selectedContact = signal<ContactDetail>(this.newContactTemplate());
  editing = signal(false);
  originalContact = signal<ContactDetail | null>(null);
  profileBaseline = signal<ContactDetail>(this.newContactTemplate());

  activeEditTab = signal<EditTab>('profile');
  communicationDraft = signal<CommunicationData>(this.emptyCommunicationData());
  communicationBaseline = signal<CommunicationData>(this.emptyCommunicationData());

  profileDirty = computed(() => {
    return JSON.stringify(this.toProfileComparable(this.selectedContact())) !== JSON.stringify(this.toProfileComparable(this.profileBaseline()));
  });

  communicationDirty = computed(() => {
    return JSON.stringify(this.communicationDraft()) !== JSON.stringify(this.communicationBaseline());
  });

  displaySearchTags = computed(() => {
    const tags = this.selectedContact().contactSearchTags ?? [];
    return tags
      .filter(tag => tag.isActive)
      .map(tag => (tag.tagText ?? '').trim())
      .filter(tagText => tagText.length > 0);
  });

  editSearchTagPills = computed(() => {
    const tags = this.selectedContact().contactSearchTags ?? [];
    return tags
      .map((tag, index) => ({
        index,
        isActive: tag.isActive,
        text: (tag.tagText ?? '').trim()
      }))
      .filter(tag => tag.isActive && tag.text.length > 0);
  });

  addressDialogOpen = signal(false);
  addressDialogMode = signal<DialogMode>('add');
  addressDialogIndex = signal<number>(-1);
  addressDialogForm = signal<ContactAddress>(this.emptyAddress());

  phoneDialogOpen = signal(false);
  phoneDialogMode = signal<DialogMode>('add');
  phoneDialogIndex = signal<number>(-1);
  phoneDialogForm = signal<ContactPhone>(this.emptyPhone());

  private readonly communicationByKey = new Map<CommunicationStoreKey, CommunicationData>();

  constructor() {
    this.registerIcons();
    this.route.queryParamMap.subscribe(params => {
      this.showResponsiveDebug.set(this.allowResponsiveDebug && this.isTruthyQueryFlag(params.get('debugLayout')));
    });

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
    this.profileBaseline.set({ ...this.selectedContact() });
    this.loadCommunicationDraftForKey(contact.id);
    this.activeEditTab.set('profile');
    this.editing.set(edit);
  }

  createNewContact(): void {
    this.selectedContactId.set(null);
    this.selectedContact.set(this.newContactTemplate());
    this.originalContact.set(null);
    this.profileBaseline.set({ ...this.selectedContact() });
    this.loadCommunicationDraftForKey('new');
    this.activeEditTab.set('profile');
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
    this.profileBaseline.set({ ...selected });
    this.loadCommunicationDraftForKey(this.getCommunicationKeyForSelectedContact());
    this.activeEditTab.set('profile');
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
    this.addressDialogOpen.set(false);
    this.phoneDialogOpen.set(false);
    this.profileBaseline.set({ ...this.selectedContact() });
    this.loadCommunicationDraftForKey(this.getCommunicationKeyForSelectedContact());
    this.activeEditTab.set('profile');
    this.message.set('');
    this.error.set('');
  }

  setActiveEditTab(tab: EditTab): void {
    this.activeEditTab.set(tab);
  }

  setSelectedContactField<K extends keyof Omit<ContactDetail, 'id' | 'tenantId' | 'isActive' | 'createdAt' | 'modifiedAt'>>(
    field: K,
    value: ContactDetail[K]
  ): void {
    this.selectedContact.update(contact => ({ ...contact, [field]: value }));
  }

  setSelectedContactIsActive(value: boolean): void {
    this.selectedContact.update(contact => ({ ...contact, isActive: value }));
  }

  removeSearchTagAt(index: number): void {
    this.selectedContact.update(contact => {
      const tags = contact.contactSearchTags ?? [];
      if (index < 0 || index >= tags.length) {
        return contact;
      }

      const now = new Date().toISOString();
      const updatedTags = tags.map((tag, tagIndex) => {
        if (tagIndex !== index) {
          return tag;
        }

        return {
          ...tag,
          isActive: false,
          modifiedAt: now
        };
      });

      return {
        ...contact,
        contactSearchTags: updatedTags
      };
    });
  }

  async saveContact(): Promise<void> {
    this.error.set('');
    this.message.set('');
    this.loading.set(true);

    const contact = this.selectedContact();
    const communicationSnapshot = this.cloneCommunication(this.communicationDraft());
    const payload: ContactDetail = {
      ...contact,
      contactAddresses: communicationSnapshot.addresses,
      contactPhones: communicationSnapshot.phones
    };

    try {
      if (contact.id > 0) {
        await this.api.updateContact(payload);
        this.saveCommunicationForKey(contact.id, communicationSnapshot);
        this.message.set('Contact saved successfully.');
        this.editing.set(false);
        await this.selectContact(this.toListItem(contact));
        this.updateLocalList(this.selectedContact());
      } else {
        const saved = await this.api.addContact(payload);
        this.saveCommunicationForKey(saved.id, communicationSnapshot);
        this.communicationByKey.delete('new');
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

  confirmDelete(id: number, displayName?: string): void {
    const trimmedName = (displayName ?? '').trim();
    const message = trimmedName
      ? `Are you sure you want to delete ${trimmedName}?`
      : 'Are you sure you want to delete this contact?';

    const confirmed = window.confirm(message);
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
      this.communicationByKey.delete(id);
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

  openAddAddressDialog(): void {
    this.addressDialogMode.set('add');
    this.addressDialogIndex.set(-1);
    this.addressDialogForm.set(this.emptyAddress());
    this.addressDialogOpen.set(true);
  }

  openEditAddressDialog(index: number): void {
    const addresses = this.communicationDraft().addresses;
    if (index < 0 || index >= addresses.length) {
      return;
    }

    this.addressDialogMode.set('edit');
    this.addressDialogIndex.set(index);
    this.addressDialogForm.set({ ...addresses[index] });
    this.addressDialogOpen.set(true);
  }

  closeAddressDialog(): void {
    this.addressDialogOpen.set(false);
    this.addressDialogIndex.set(-1);
    this.addressDialogForm.set(this.emptyAddress());
  }

  setAddressDialogField<K extends keyof ContactAddress>(field: K, value: ContactAddress[K]): void {
    this.addressDialogForm.update(address => ({ ...address, [field]: value }));
  }

  saveAddressDialog(): void {
    const draft = this.addressDialogForm();
    if (!draft.street1.trim()) {
      return;
    }

    const now = new Date().toISOString();
    const normalized: ContactAddress = {
      ...draft,
      contactId: this.selectedContact().id > 0 ? this.selectedContact().id : 0,
      street1: draft.street1.trim(),
      street2: draft.street2.trim(),
      city: draft.city.trim(),
      county: draft.county.trim(),
      state: draft.state.trim(),
      zip: draft.zip.trim(),
      modifiedAt: now,
      createdAt: draft.createdAt || now
    };

    this.communicationDraft.update(communication => {
      const addresses = [...communication.addresses];
      if (this.addressDialogMode() === 'edit' && this.addressDialogIndex() >= 0) {
        addresses[this.addressDialogIndex()] = normalized;
      } else {
        addresses.push(normalized);
      }

      return { ...communication, addresses };
    });

    this.closeAddressDialog();
  }

  removeAddress(index: number): void {
    this.communicationDraft.update(communication => {
      const addresses = communication.addresses.filter((_, itemIndex) => itemIndex !== index);
      return { ...communication, addresses };
    });
  }

  openAddPhoneDialog(): void {
    this.phoneDialogMode.set('add');
    this.phoneDialogIndex.set(-1);
    this.phoneDialogForm.set(this.emptyPhone());
    this.phoneDialogOpen.set(true);
  }

  openEditPhoneDialog(index: number): void {
    const phones = this.communicationDraft().phones;
    if (index < 0 || index >= phones.length) {
      return;
    }

    this.phoneDialogMode.set('edit');
    this.phoneDialogIndex.set(index);
    this.phoneDialogForm.set({ ...phones[index] });
    this.phoneDialogOpen.set(true);
  }

  closePhoneDialog(): void {
    this.phoneDialogOpen.set(false);
    this.phoneDialogIndex.set(-1);
    this.phoneDialogForm.set(this.emptyPhone());
  }

  setPhoneDialogField<K extends keyof ContactPhone>(field: K, value: ContactPhone[K]): void {
    this.phoneDialogForm.update(phone => ({ ...phone, [field]: value }));
  }

  savePhoneDialog(): void {
    const draft = this.phoneDialogForm();
    if (!draft.number.trim()) {
      return;
    }

    const now = new Date().toISOString();
    const normalized: ContactPhone = {
      ...draft,
      contactId: this.selectedContact().id > 0 ? this.selectedContact().id : 0,
      number: draft.number.trim(),
      type: draft.type.trim(),
      modifiedAt: now,
      createdAt: draft.createdAt || now
    };

    this.communicationDraft.update(communication => {
      const phones = [...communication.phones];
      if (this.phoneDialogMode() === 'edit' && this.phoneDialogIndex() >= 0) {
        phones[this.phoneDialogIndex()] = normalized;
      } else {
        phones.push(normalized);
      }

      return { ...communication, phones };
    });

    this.closePhoneDialog();
  }

  removePhone(index: number): void {
    this.communicationDraft.update(communication => {
      const phones = communication.phones.filter((_, itemIndex) => itemIndex !== index);
      return { ...communication, phones };
    });
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
      modifiedAt: now,
      contactAddresses: [],
      contactPhones: [],
      contactSearchTags: []
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

  private registerIcons(): void {
    this.matIconRegistry.addSvgIcon(
      'contact-edit',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/pencil.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'contact-delete',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/trash.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'contact-cancel',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cancel.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'contact-reset',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/reset.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'contact-new',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/plus.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'contact-save',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/save.svg')
    );
  }

  private isTruthyQueryFlag(value: string | null): boolean {
    if (value === null) {
      return false;
    }

    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
  }

  private emptyCommunicationData(): CommunicationData {
    return {
      addresses: [],
      phones: []
    };
  }

  private emptyAddress(): ContactAddress {
    const now = new Date().toISOString();
    return {
      id: 0,
      contactId: 0,
      street1: '',
      street2: '',
      city: '',
      county: '',
      state: '',
      zip: '',
      isActive: true,
      createdAt: now,
      modifiedAt: now
    };
  }

  private emptyPhone(): ContactPhone {
    const now = new Date().toISOString();
    return {
      id: 0,
      contactId: 0,
      number: '',
      type: '',
      isPrimary: false,
      isActive: true,
      createdAt: now,
      modifiedAt: now
    };
  }

  private cloneCommunication(source: CommunicationData): CommunicationData {
    return {
      addresses: source.addresses.map(address => ({ ...address })),
      phones: source.phones.map(phone => ({ ...phone }))
    };
  }

  private getCommunicationKeyForSelectedContact(): CommunicationStoreKey {
    const contactId = this.selectedContact().id;
    return contactId > 0 ? contactId : 'new';
  }

  private loadCommunicationDraftForKey(key: CommunicationStoreKey): void {
    const saved = this.communicationByKey.get(key);
    if (saved) {
      const snapshot = this.cloneCommunication(saved);
      this.communicationDraft.set(snapshot);
      this.communicationBaseline.set(this.cloneCommunication(snapshot));
      return;
    }

    const current = this.selectedContact();
    const snapshot: CommunicationData = {
      addresses: current.contactAddresses?.map(address => ({ ...address })) ?? [],
      phones: current.contactPhones?.map(phone => ({ ...phone })) ?? []
    };
    this.communicationDraft.set(snapshot);
    this.communicationBaseline.set(this.cloneCommunication(snapshot));
  }

  private saveCommunicationForKey(key: CommunicationStoreKey, data: CommunicationData): void {
    this.communicationByKey.set(key, this.cloneCommunication(data));
  }

  private toProfileComparable(contact: ContactDetail) {
    return {
      id: contact.id,
      firstName: contact.firstName,
      middleName: contact.middleName,
      lastName: contact.lastName,
      companyName: contact.companyName,
      email: contact.email,
      web: contact.web,
      notes: contact.notes,
      isActive: contact.isActive,
      contactSearchTags: this.toComparableSearchTags(contact.contactSearchTags ?? [])
    };
  }

  private toComparableSearchTags(tags: ContactSearchTag[]) {
    return tags.map(tag => ({
      id: tag.id,
      contactId: tag.contactId,
      tagText: tag.tagText,
      isActive: tag.isActive
    }));
  }
}
