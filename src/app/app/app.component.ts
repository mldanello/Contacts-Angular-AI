import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public authService = inject(AuthService);
  showLayoutDebug = signal(false);
  allowLayoutDebug = !environment.production;

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const value = params.get('debugLayout');
      const normalized = value ? value.trim().toLowerCase() : '';
      this.showLayoutDebug.set(normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on');
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleLayoutDebug(): void {
    if (!this.allowLayoutDebug) {
      return;
    }

    const enable = !this.showLayoutDebug();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        debugLayout: enable ? '1' : null
      },
      queryParamsHandling: 'merge'
    });
  }
}
