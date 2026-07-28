import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ContactAddress, ContactDetail, ContactPhone, ContactSearchTag } from '../../models/contact-detail.model';
import { ContactSearchTagAddComponent } from '../search-tags/contact-seach-tag-add.component';
import { CommunicationEditComponent } from '../communication/edit/communication-edit.component';
import { DialogMode as AddressDialogMode } from '../communication/edit/address-edit.component';
import { DialogMode as PhoneDialogMode } from '../communication/edit/phone-edit.component';

export type EditTab = 'profile' | 'communication';

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

  @Input() addresses: ContactAddress[] = [];
  @Input() phones: ContactPhone[] = [];

  @Input() addressDialogOpen = false;
  @Input() addressDialogMode: AddressDialogMode = 'add';
  @Input({ required: true }) addressDialogForm!: ContactAddress;

  @Input() phoneDialogOpen = false;
  @Input() phoneDialogMode: PhoneDialogMode = 'add';
  @Input({ required: true }) phoneDialogForm!: ContactPhone;

  @Output() saveContact = new EventEmitter<void>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() resetContact = new EventEmitter<void>();
  @Output() deleteContact = new EventEmitter<void>();

  @Output() activeTabChange = new EventEmitter<EditTab>();
  @Output() contactChange = new EventEmitter<ContactDetail>();
  @Output() tagsChange = new EventEmitter<ContactSearchTag[]>();

  @Output() addAddress = new EventEmitter<void>();
  @Output() editAddress = new EventEmitter<number>();
  @Output() deleteAddress = new EventEmitter<number>();
  @Output() closeAddressDialog = new EventEmitter<void>();
  @Output() saveAddressDialog = new EventEmitter<void>();
  @Output() addressFieldChange = new EventEmitter<{ field: keyof ContactAddress; value: ContactAddress[keyof ContactAddress] }>();

  @Output() addPhone = new EventEmitter<void>();
  @Output() editPhone = new EventEmitter<number>();
  @Output() deletePhone = new EventEmitter<number>();
  @Output() closePhoneDialog = new EventEmitter<void>();
  @Output() savePhoneDialog = new EventEmitter<void>();
  @Output() phoneFieldChange = new EventEmitter<{ field: keyof ContactPhone; value: ContactPhone[keyof ContactPhone] }>();

  setField<K extends keyof Omit<ContactDetail, 'id' | 'tenantId' | 'isActive' | 'createdAt' | 'modifiedAt'>>(field: K, value: ContactDetail[K]): void {
    this.contactChange.emit({ ...this.contact, [field]: value });
  }

  setIsActive(value: boolean): void {
    this.contactChange.emit({ ...this.contact, isActive: value });
  }

  setTags(tags: ContactSearchTag[]): void {
    this.tagsChange.emit(tags);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.saveContact.emit();
  }
}
