import { Route } from '@angular/router';
import { HomeComponent } from './home.component';
import { ContactsComponent } from './contacts/contacts.component';
import { LoginComponent } from './login.component';
import { authGuard } from './core/auth.guard';

export const appRoutes: Route[] = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'contacts', component: ContactsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
