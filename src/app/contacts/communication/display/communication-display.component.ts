import { Component, Input } from '@angular/core';
import { ContactAddress, ContactPhone } from '../../../models/contact-detail.model';
import { AddressDisplayComponent } from './address-display.component';
import { PhoneDisplayComponent } from './phone-display.component';

@Component({
  standalone: true,
  selector: 'app-communication-display',
  imports: [AddressDisplayComponent, PhoneDisplayComponent],
  templateUrl: './communication-display.component.html',
  styleUrls: ['./communication-display.component.css']
})
export class CommunicationDisplayComponent {
  @Input() addresses: ContactAddress[] = [];
  @Input() phones: ContactPhone[] = [];
}
