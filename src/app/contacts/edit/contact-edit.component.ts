import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ContactAddress, ContactDetail, ContactPhone, ContactSearchTag } from '../../models/contact-detail.model';
import { ContactSearchTagAddComponent } from '../search-tags/contact-seach-tag-add.component';
import { CommunicationEditComponent } from '../communication/edit/communication-edit.component';
import { DialogMode as AddressDialogMode } from '../communication/edit/address-edit.component';
import { DialogMode as PhoneDialogMode } from '../communication/edit/phone-edit.component';

export type EditTab = 'profile' | 'communication';

export type ContactEditUiAction =
  | { type: 'save' }
  | { type: 'cancel' }
  | { type: 'reset' }
  | { type: 'delete' }
  | { type: 'set-tab'; tab: EditTab };

export type ContactEditAction =
  | { type: 'contact-change'; contact: ContactDetail }
  | { type: 'tags-change'; tags: ContactSearchTag[] }
  | { type: 'address-add' }
  | { type: 'address-edit'; index: number }
  | { type: 'address-delete'; index: number }
  | { type: 'address-dialog-close' }
  | { type: 'address-dialog-save' }
  | { type: 'address-field-change'; field: keyof ContactAddress; value: ContactAddress[keyof ContactAddress] }
  | { type: 'phone-add' }
  | { type: 'phone-edit'; index: number }
  | { type: 'phone-delete'; index: number }
  | { type: 'phone-dialog-close' }
  | { type: 'phone-dialog-save' }
  | { type: 'phone-field-change'; field: keyof ContactPhone; value: ContactPhone[keyof ContactPhone] };

@Component({
  standalone: true,
  selector: 'app-contact-edit',
  imports: [FormsModule, MatIconModule, ContactSearchTagAddComponent, CommunicationEditComponent],
  templateUrl: './contact-edit.component.html',
  styleUrls: ['./contact-edit.component.css']
})
export class ContactEditComponent {
  @Input({ required: true }) contact!: ContactDetail;
  @Input() activeEditTab: EditTab = 'profile';
  @Input() profileDirty = false;
  @Input() communicationDirty = false;
  @Input() saving = false;
  @Input() noFilterResults = false;

  @Input() addresses: ContactAddress[] = [];
  @Input() phones: ContactPhone[] = [];

  @Input() addressDialogOpen = false;
  @Input() addressDialogMode: AddressDialogMode = 'add';
  @Input({ required: true }) addressDialogForm!: ContactAddress;

  @Input() phoneDialogOpen = false;
  @Input() phoneDialogMode: PhoneDialogMode = 'add';
  @Input({ required: true }) phoneDialogForm!: ContactPhone;

  @Output() uiAction = new EventEmitter<ContactEditUiAction>();
  @Output() editAction = new EventEmitter<ContactEditAction>();

  setField<K extends keyof Omit<ContactDetail, 'id' | 'tenantId' | 'isActive' | 'createdAt' | 'modifiedAt'>>(field: K, value: ContactDetail[K]): void {
    this.editAction.emit({ type: 'contact-change', contact: { ...this.contact, [field]: value } });
  }

  setIsActive(value: boolean): void {
    this.editAction.emit({ type: 'contact-change', contact: { ...this.contact, isActive: value } });
  }

  setTags(tags: ContactSearchTag[]): void {
    this.editAction.emit({ type: 'tags-change', tags });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.uiAction.emit({ type: 'save' });
  }

  setActiveTab(tab: EditTab): void {
    this.uiAction.emit({ type: 'set-tab', tab });
  }

  onAddressEdit(index: number): void {
    this.editAction.emit({ type: 'address-edit', index });
  }

  onAddressDelete(index: number): void {
    this.editAction.emit({ type: 'address-delete', index });
  }

  onAddressFieldChange(event: { field: keyof ContactAddress; value: ContactAddress[keyof ContactAddress] }): void {
    this.editAction.emit({ type: 'address-field-change', field: event.field, value: event.value });
  }

  onPhoneEdit(index: number): void {
    this.editAction.emit({ type: 'phone-edit', index });
  }

  onPhoneDelete(index: number): void {
    this.editAction.emit({ type: 'phone-delete', index });
  }

  onPhoneFieldChange(event: { field: keyof ContactPhone; value: ContactPhone[keyof ContactPhone] }): void {
    this.editAction.emit({ type: 'phone-field-change', field: event.field, value: event.value });
  }

  get isActiveLabel(): string {
    if (this.noFilterResults) {
      return '';
    }

    return this.contact.isActive ? 'Yes' : 'No';
  }

  get createdAtDisplay(): string {
    return this.noFilterResults ? '' : this.contact.createdAt;
  }

  get modifiedAtDisplay(): string {
    return this.noFilterResults ? '' : this.contact.modifiedAt;
  }
}
