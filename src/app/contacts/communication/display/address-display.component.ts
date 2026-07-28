import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ContactAddress } from '../../../models/contact-detail.model';

@Component({
  standalone: true,
  selector: 'app-address-display',
  imports: [MatIconModule],
  templateUrl: './address-display.component.html',
  styleUrls: ['./address-display.component.css']
})
export class AddressDisplayComponent {
  @Input({ required: true }) address!: ContactAddress;
  @Input() showActions = false;

  @Output() editAddress = new EventEmitter<void>();
  @Output() deleteAddress = new EventEmitter<void>();

  onEdit(): void {
    this.editAddress.emit();
  }

  onDelete(): void {
    this.deleteAddress.emit();
  }
}
