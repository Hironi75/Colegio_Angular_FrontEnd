import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface SessionState {
  token: string | null;
  adminToken: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

const STORAGE_KEY = 'colegio-angular.session';

@Injectable({ providedIn: 'root' })
export class SessionStoreService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly state = signal<SessionState>({ token: null, adminToken: null, user: null });
  private hydrated = false;

  readonly token = computed(() => this.state().token);
  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => Boolean(this.state().token));
  readonly adminToken = computed(() => this.state().adminToken);

  hydrateFromStorage(): void {
    if (this.hydrated) {
      return;
    }

    if (!this.isBrowser) {
      return;
    }

    this.state.set(this.readPersisted());
    this.hydrated = true;
  }

  setSession(session: SessionState): void {
    this.state.set(session);
    this.persist(session);
    this.hydrated = true;
  }

  clearSession(): void {
    this.state.set({ token: null, adminToken: null, user: null });
    if (this.isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.hydrated = true;
  }

  updateUser(user: SessionState['user']): void {
    const next = { ...this.state(), user } satisfies SessionState;
    this.state.set(next);
    this.persist(next);
  }

  setAdminToken(adminToken: string | null): void {
    const next = { ...this.state(), adminToken } satisfies SessionState;
    this.state.set(next);
    this.persist(next);
  }

  private readPersisted(): SessionState {
    if (!this.isBrowser) {
      return { token: null, adminToken: null, user: null };
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { token: null, adminToken: null, user: null };
    }

    try {
      return JSON.parse(raw) as SessionState;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return { token: null, adminToken: null, user: null };
    }
  }

  private persist(state: SessionState): void {
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }
}
