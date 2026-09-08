import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ContactAddress, ContactPhone } from '../../../models/contact-detail.model';
import { AddressDisplayComponent } from '../display/address-display.component';
import { AddressEditComponent, DialogMode as AddressDialogMode } from './address-edit.component';
import { PhoneDisplayComponent } from '../display/phone-display.component';
import { PhoneEditComponent, DialogMode as PhoneDialogMode } from './phone-edit.component';

@Component({
  standalone: true,
  selector: 'app-communication-edit',
  imports: [
    MatIconModule,
    AddressDisplayComponent,
    AddressEditComponent,
    PhoneDisplayComponent,
    PhoneEditComponent
  ],
  templateUrl: './communication-edit.component.html',
  styleUrls: ['./communication-edit.component.css']
})
export class CommunicationEditComponent {
  @Input() addresses: ContactAddress[] = [];
  @Input() phones: ContactPhone[] = [];

  @Input() addressDialogOpen = false;
  @Input() addressDialogMode: AddressDialogMode = 'add';
  @Input({ required: true }) addressDialogForm!: ContactAddress;

  @Input() phoneDialogOpen = false;
  @Input() phoneDialogMode: PhoneDialogMode = 'add';
  @Input({ required: true }) phoneDialogForm!: ContactPhone;

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
}
