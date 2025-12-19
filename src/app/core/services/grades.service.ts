import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, switchMap, catchError } from 'rxjs';
import { PocketBaseClientService } from './pocketbase-client.service';
import { environment } from '../../../environments/environment';
import { SessionStoreService } from './session-store.service';
import { AuthService } from './auth.service';

export interface GradeDto {
  id: string;
  student_id: string;
  course_id: string;
  note1: number;
  note2: number;
  note3: number;
  average?: number;
  status?: 'Aprobado' | 'Reprobado';
  created?: string;
  updated?: string;
}

@Injectable({ providedIn: 'root' })
export class GradesService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly client = inject(PocketBaseClientService);
  private readonly sessionStore = inject(SessionStoreService);
  private readonly authService = inject(AuthService);
  private readonly collection = environment.pocketbaseCollections.grades;

  list(courseId?: string): Observable<{ items: GradeDto[] }> {
    if (!this.isBrowser) {
      return of({ items: [] });
    }
    const filter = courseId ? `course_id="${courseId}"` : '';
    return this.client.get<{ items: GradeDto[] }>(this.collection, filter ? { filter } : undefined);
  }

  getByStudentAndCourse(studentId: string, courseId: string): Observable<{ items: GradeDto[] }> {
    if (!this.isBrowser) {
      return of({ items: [] });
    }
    const filter = `student_id="${studentId}" && course_id="${courseId}"`;
    return this.client.get<{ items: GradeDto[] }>(this.collection, { filter });
  }

  create(payload: Partial<GradeDto>): Observable<GradeDto> {
    return this.withAdminToken((token) =>
      this.client.create<GradeDto>(this.collection, payload, 'records', token ? { token } : undefined)
    );
  }

  update(id: string, payload: Partial<GradeDto>): Observable<GradeDto> {
    return this.withAdminToken((token) =>
      this.client.update<GradeDto>(this.collection, id, payload, token ? { token } : undefined)
    );
  }

  delete(id: string): Observable<void> {
    return this.withAdminToken((token) =>
      this.client.delete(this.collection, id, token ? { token } : undefined)
    );
  }

  private withAdminToken<T>(fn: (token: string | null) => Observable<T>): Observable<T> {
    if (!this.isBrowser) {
      return of(null as any);
    }
    const sessionToken = this.sessionStore.adminToken();
    if (sessionToken) {
      return fn(sessionToken);
    }
    return this.authService.loginAsAdmin().pipe(
      switchMap(() => {
        const token = this.sessionStore.adminToken();
        return fn(token);
      }),
      catchError((error) => {
        console.error('Error en autenticación admin:', error);
        throw error;
      })
    );
  }
}

