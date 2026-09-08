import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ContactPhone } from '../../../models/contact-detail.model';

@Component({
  standalone: true,
  selector: 'app-phone-display',
  imports: [MatIconModule],
  templateUrl: './phone-display.component.html',
  styleUrls: ['./phone-display.component.css']
})
export class PhoneDisplayComponent {
  @Input({ required: true }) phone!: ContactPhone;
  @Input() showActions = false;

  @Output() editPhone = new EventEmitter<void>();
  @Output() deletePhone = new EventEmitter<void>();

  onEdit(): void {
    this.editPhone.emit();
  }

  onDelete(): void {
    this.deletePhone.emit();
  }
}
