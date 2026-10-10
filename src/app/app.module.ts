import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MockBackendInterceptor } from './core/api/mock-backend.interceptor';
import { MockDataStorageService } from './core/api/mock-data-storage.service';
import { AuthService } from './core/auth/auth.service';

export function initializeMockData(
  storage: MockDataStorageService,
): () => void {
  return () => storage.initialize();
}

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule],
  providers: [
    AuthService,
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
