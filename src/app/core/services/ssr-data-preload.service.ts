import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { environment } from '../../../environments/environment';
import { SessionStoreService } from './session-store.service';
import { PocketBaseClientService } from './pocketbase-client.service';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataPreloadService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionStore = inject(SessionStoreService);
  private readonly client = inject(PocketBaseClientService);
  private readonly authService = inject(AuthService);
  private cache: Record<string, unknown[]> = {};
  private loginPromise: Promise<string | null> | null = null;

  async preloadCollections(keys: Array<keyof typeof environment.pocketbaseCollections>): Promise<void> {
    if (!isPlatformServer(this.platformId)) {
      return;
    }

    const token = await this.ensureAdminToken();
    if (!token) {
      console.warn('No admin token available for SSR preload.');
      return;
    }

    await Promise.all(keys.map((key) => this.fetchCollection(key, token)));
  }

  getCached<T>(collection: keyof typeof environment.pocketbaseCollections): T[] | undefined {
    const key = environment.pocketbaseCollections[collection];
    return this.cache[key] as T[] | undefined;
  }

  private async fetchCollection(collectionKey: keyof typeof environment.pocketbaseCollections, token: string): Promise<void> {
    const collection = environment.pocketbaseCollections[collectionKey];
    try {
      const response = await firstValueFrom(this.client.get<{ items: unknown[] }>(collection, undefined, { token }));
      this.cache[collection] = response.items;
    } catch (error) {
      console.warn(`SSR preload failed for ${collection}`, error);
    }
  }

  private async ensureAdminToken(): Promise<string | null> {
    const existing = this.sessionStore.adminToken();
    if (existing) {
      return existing;
    }

    if (!this.loginPromise) {
      this.loginPromise = firstValueFrom(this.authService.loginAsAdmin())
        .catch((error) => {
          console.error('Unable to login as admin for SSR preload', error);
          return null;
        })
        .finally(() => {
          this.loginPromise = null;
        });
    }

    const pending = this.loginPromise;
    return pending ?? Promise.resolve(null);
  }
}
