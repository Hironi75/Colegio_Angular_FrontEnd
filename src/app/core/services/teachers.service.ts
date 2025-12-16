import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, switchMap, catchError } from 'rxjs';
import { PocketBaseClientService } from './pocketbase-client.service';
import { environment } from '../../../environments/environment';
import { DataPreloadService } from './ssr-data-preload.service';
import { SessionStoreService } from './session-store.service';
import { AuthService } from './auth.service';

export interface TeacherDto {
  id: string;
  full_name: string;
  subject: string;
  availability: 'Tiempo completo' | 'Medio tiempo';
  email?: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class TeachersService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly client = inject(PocketBaseClientService);
  private readonly dataPreload = inject(DataPreloadService);
  private readonly sessionStore = inject(SessionStoreService);
  private readonly authService = inject(AuthService);
  private readonly collection = environment.pocketbaseCollections.teachers;

  list(): Observable<{ items: TeacherDto[] }> {
    if (!this.isBrowser) {
      const cached = this.dataPreload.getCached<TeacherDto>('teachers');
      return of({ items: cached ?? [] });
    }
    const cached = this.dataPreload.getCached<TeacherDto>('teachers');
    if (cached) {
      return of({ items: cached });
    }
    return this.client.get<{ items: TeacherDto[] }>(this.collection);
  }

  create(payload: Partial<TeacherDto>): Observable<TeacherDto> {
    return this.withAdminToken((token) =>
      this.client.create<TeacherDto>(this.collection, payload, 'records', token ? { token } : undefined)
    );
  }

  update(id: string, payload: Partial<TeacherDto>): Observable<TeacherDto> {
    return this.withAdminToken((token) =>
      this.client.update<TeacherDto>(this.collection, id, payload, token ? { token } : undefined)
    );
  }

  delete(id: string): Observable<void> {
    return this.withAdminToken((token) =>
      this.client.delete(this.collection, id, token ? { token } : undefined)
    );
  }

  private withAdminToken<T>(fn: (token: string | null) => Observable<T>): Observable<T> {
    const existingToken = this.sessionStore.token() ?? this.sessionStore.adminToken();

    if (existingToken) {
      return fn(existingToken);
    }

    // Si no hay token, intentamos autenticar como admin
    return this.authService.loginAsAdmin().pipe(
      switchMap((adminToken) => fn(adminToken)),
      catchError((error) => {
        console.error('Failed to authenticate as admin for CRUD operation', error);
        throw error;
      })
    );
  }
}
