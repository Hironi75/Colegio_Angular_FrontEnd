import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { SessionStoreService } from './core/services/session-store.service';
import { DataPreloadService } from './core/services/ssr-data-preload.service';

function hydrateSessionFactory() {
  const sessionStore = inject(SessionStoreService);
  return () => sessionStore.hydrateFromStorage();
}

function preloadCollectionsFactory() {
  const preloadService = inject(DataPreloadService);
  return () => preloadService.preloadCollections(['students', 'teachers', 'courses']);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: hydrateSessionFactory
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: preloadCollectionsFactory
    }
  ]
};
