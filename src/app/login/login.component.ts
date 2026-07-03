import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  authError = signal('');
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/contacts']);
    }
  }

  async login(): Promise<void> {
    this.authError.set('');
    this.loading.set(true);

    try {
      await this.authService.login(this.username, this.password);
      this.router.navigate(['/contacts']);
    } catch {
      this.authError.set('Unable to sign in. Please check your username and password.');
    } finally {
      this.loading.set(false);
    }
  }
}
