import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ContactDetail } from '../../models/contact-detail.model';

@Component({
  standalone: true,
  selector: 'app-contact-detail',
  imports: [MatIconModule],
  templateUrl: './contact-detail.component.html',
  styleUrls: ['./contact-detail.component.css']
})
export class ContactDetailComponent {
  @Input({ required: true }) contact!: ContactDetail;
  @Input() displaySearchTags: string[] = [];

  @Output() editContact = new EventEmitter<void>();
  @Output() deleteContact = new EventEmitter<void>();

  onEdit(): void {
    this.editContact.emit();
  }

  onDelete(): void {
    this.deleteContact.emit();
  }
}
