import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { SessionStoreService } from '../services/session-store.service';

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const sessionStore = inject(SessionStoreService);
  sessionStore.hydrateFromStorage();
  const router = inject(Router);

  if (sessionStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
