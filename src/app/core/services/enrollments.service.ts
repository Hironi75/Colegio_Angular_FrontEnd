import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, switchMap, catchError } from 'rxjs';
import { PocketBaseClientService } from './pocketbase-client.service';
import { environment } from '../../../environments/environment';
import { SessionStoreService } from './session-store.service';
import { AuthService } from './auth.service';

export interface EnrollmentDto {
  id: string;
  student_id: string;
  course_id: string;
  enrollment_date?: string;
  status?: 'Activo' | 'Inactivo';
}

@Injectable({ providedIn: 'root' })
export class EnrollmentsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly client = inject(PocketBaseClientService);
  private readonly sessionStore = inject(SessionStoreService);
  private readonly authService = inject(AuthService);
  private readonly collection = environment.pocketbaseCollections.enrollments;

  list(): Observable<{ items: EnrollmentDto[] }> {
    if (!this.isBrowser) {
      return of({ items: [] });
    }
    return this.client.get<{ items: EnrollmentDto[] }>(this.collection);
  }

  getEnrollmentsByCourse(courseId: string): Observable<{ items: EnrollmentDto[] }> {
    if (!this.isBrowser) {
      return of({ items: [] });
    }
    return this.client.get<{ items: EnrollmentDto[] }>(
      `${this.collection}?filter=(course_id='${courseId}')`
    );
  }

  getEnrollmentsByStudent(studentId: string): Observable<{ items: EnrollmentDto[] }> {
    if (!this.isBrowser) {
      return of({ items: [] });
    }
    return this.client.get<{ items: EnrollmentDto[] }>(
      `${this.collection}?filter=(student_id='${studentId}')`
    );
  }

  create(payload: Partial<EnrollmentDto>): Observable<EnrollmentDto> {
    return this.withAdminToken((token) =>
      this.client.create<EnrollmentDto>(this.collection, payload, 'records', token ? { token } : undefined)
    );
  }

  update(id: string, payload: Partial<EnrollmentDto>): Observable<EnrollmentDto> {
    return this.withAdminToken((token) =>
      this.client.update<EnrollmentDto>(this.collection, id, payload, token ? { token } : undefined)
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

