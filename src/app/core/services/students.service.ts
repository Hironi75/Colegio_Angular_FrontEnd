import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, switchMap, catchError } from 'rxjs';
import { PocketBaseClientService } from './pocketbase-client.service';
import { environment } from '../../../environments/environment';
import { DataPreloadService } from './ssr-data-preload.service';
import { SessionStoreService } from './session-store.service';
import { AuthService } from './auth.service';

export interface StudentDto {
  id: string;
  full_name: string;
  grade: string;
  status: 'Activo' | 'Inactivo';
  role: string;
  guardian_contact?: string;
}

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly client = inject(PocketBaseClientService);
  private readonly dataPreload = inject(DataPreloadService);
  private readonly sessionStore = inject(SessionStoreService);
  private readonly authService = inject(AuthService);
  private readonly collection = environment.pocketbaseCollections.students;

  list(): Observable<{ items: StudentDto[] }> {
    if (!this.isBrowser) {
      const cached = this.dataPreload.getCached<StudentDto>('students');
      return of({ items: cached ?? [] });
    }
    const cached = this.dataPreload.getCached<StudentDto>('students');
    if (cached) {
      return of({ items: cached });
    }
    return this.client.get<{ items: StudentDto[] }>(this.collection);
  }

  create(payload: Partial<StudentDto>): Observable<StudentDto> {
    return this.withAdminToken((token) =>
      this.client.create<StudentDto>(this.collection, payload, 'records', token ? { token } : undefined)
    );
  }

  update(id: string, payload: Partial<StudentDto>): Observable<StudentDto> {
    return this.withAdminToken((token) =>
      this.client.update<StudentDto>(this.collection, id, payload, token ? { token } : undefined)
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
