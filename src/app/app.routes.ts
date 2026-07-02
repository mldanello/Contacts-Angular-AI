import { Route } from '@angular/router';
import { HomeComponent } from './home.component';
import { ContactsComponent } from './contacts/contacts.component';

export const appRoutes: Route[] = [
  { path: '', component: HomeComponent },
  { path: 'contacts', component: ContactsComponent },
  { path: '**', redirectTo: '' }
];
