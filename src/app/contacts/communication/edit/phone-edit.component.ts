import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactPhone } from '../../../models/contact-detail.model';

export type DialogMode = 'add' | 'edit';

@Component({
  standalone: true,
  selector: 'app-phone-edit',
  imports: [FormsModule],
  templateUrl: './phone-edit.component.html',
  styleUrls: ['./phone-edit.component.css']
})
export class PhoneEditComponent {
  @Input() open = false;
  @Input() mode: DialogMode = 'add';
  @Input({ required: true }) phone!: ContactPhone;

  @Output() closeDialog = new EventEmitter<void>();
  @Output() saveDialog = new EventEmitter<void>();
  @Output() fieldChange = new EventEmitter<{ field: keyof ContactPhone; value: ContactPhone[keyof ContactPhone] }>();

  setField<K extends keyof ContactPhone>(field: K, value: ContactPhone[K]): void {
    this.fieldChange.emit({ field, value });
  }

  onClose(): void {
    this.closeDialog.emit();
  }

  onSave(): void {
    this.saveDialog.emit();
  }
}
