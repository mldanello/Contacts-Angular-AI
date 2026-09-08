import { Component, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly authDebugEnabled = localStorage.getItem('md-auth-debug') === 'true';
  username = '';
  password = '';
  authError = signal('');
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {
    if (this.authDebugEnabled) {
      console.log('[LoginComponent] init', {
        isAuthenticated: this.authService.isAuthenticated(),
        hasAccessToken: !!this.authService.tokenValue?.accessToken
      });
    }

    if (this.authService.isAuthenticated()) {
      if (this.authDebugEnabled) {
        console.log('[LoginComponent] already authenticated, navigating to /contacts');
      }
      this.router.navigate(['/contacts']);
    }
  }

  async login(): Promise<void> {
    this.authError.set('');
    this.loading.set(true);
    if (this.authDebugEnabled) {
      console.log('[LoginComponent] login:submit', { username: this.username });
    }

    try {
      await this.authService.login(this.username, this.password);
      if (this.authDebugEnabled) {
        console.log('[LoginComponent] login:success, navigating to /contacts');
      }
      this.router.navigate(['/contacts']);
    } catch {
      if (this.authDebugEnabled) {
        console.log('[LoginComponent] login:error');
      }
      this.authError.set('Unable to sign in. Please check your username and password.');
    } finally {
      this.loading.set(false);
    }
  }

  async demoLogin(): Promise<void> {
    this.username = 'testuser';
    this.password = 'R7!vN3@qL9#tX2$kM877h';
    await this.login();
  }
}
