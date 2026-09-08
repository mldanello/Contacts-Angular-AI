import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactAddress } from '../../../models/contact-detail.model';

export type DialogMode = 'add' | 'edit';

@Component({
  standalone: true,
  selector: 'app-address-edit',
  imports: [FormsModule],
  templateUrl: './address-edit.component.html',
  styleUrls: ['./address-edit.component.css']
})
export class AddressEditComponent {
  @Input() open = false;
  @Input() mode: DialogMode = 'add';
  @Input({ required: true }) address!: ContactAddress;

  @Output() closeDialog = new EventEmitter<void>();
  @Output() saveDialog = new EventEmitter<void>();
  @Output() fieldChange = new EventEmitter<{ field: keyof ContactAddress; value: ContactAddress[keyof ContactAddress] }>();

  setField<K extends keyof ContactAddress>(field: K, value: ContactAddress[K]): void {
    this.fieldChange.emit({ field, value });
  }

  onClose(): void {
    this.closeDialog.emit();
  }

  onSave(): void {
    this.saveDialog.emit();
  }
}
