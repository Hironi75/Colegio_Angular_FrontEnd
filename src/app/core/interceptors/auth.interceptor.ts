import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStoreService } from '../services/session-store.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionStore = inject(SessionStoreService);
  const token = sessionStore.token();

  if (!token) {
    return next(req);
  }

  const clone = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clone);
};
