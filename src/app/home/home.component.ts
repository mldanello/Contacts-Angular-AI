import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  private api = inject(ApiService);

  checkingApi = signal(false);
  apiStatus = signal<'idle' | 'success' | 'error'>('idle');
  apiStatusMessage = signal('');

  async checkApiConnection(): Promise<void> {
    this.checkingApi.set(true);
    this.apiStatus.set('idle');
    this.apiStatusMessage.set('Checking API connectivity...');

    try {
      const reachable = await this.api.checkApiReachability();
      if (reachable) {
        this.apiStatus.set('success');
        this.apiStatusMessage.set('API connection successful.');
      } else {
        this.apiStatus.set('error');
        this.apiStatusMessage.set('API connection failed.');
      }
    } catch {
      this.apiStatus.set('error');
      this.apiStatusMessage.set('API connection failed.');
    } finally {
      this.checkingApi.set(false);
    }
  }
}
