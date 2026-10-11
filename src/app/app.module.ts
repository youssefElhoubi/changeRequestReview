import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MockBackendInterceptor } from './core/api/mock-backend.interceptor';
import { MockDataStorageService } from './core/api/mock-data-storage.service';
import { AuthService } from './core/auth/auth.service';
import { AuthenticationProvider } from './core/auth/authentication-provider';
import { MockAuthenticationProvider } from './core/auth/mock-authentication.provider';
import { UserCreationComponent } from './core/auth/user-creation.component';
import { UserManagementService } from './core/auth/user-management.service';
import { ReactiveFormsModule } from '@angular/forms';

export function initializeMockData(
  storage: MockDataStorageService,
): () => void {
  return () => storage.initialize();
}

@NgModule({
  declarations: [AppComponent, UserCreationComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
  ],
  providers: [
    AuthService,
    UserManagementService,
    {
      provide: AuthenticationProvider,
      useClass: MockAuthenticationProvider,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MockBackendInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMockData,
      deps: [MockDataStorageService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
