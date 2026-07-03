import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { authInterceptorProvider } from './app/interceptors/auth.interceptor';
import { mockBackendProvider } from './app/interceptors/mock-backend.interceptor';
import { appRoutes } from './app/app.routes';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    authInterceptorProvider,
    ...(environment.useMockBackend ? [mockBackendProvider] : [])
  ]
}).catch(err => console.error(err));
