import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { tap, map } from 'rxjs/operators';
import { PocketBaseClientService } from './pocketbase-client.service';
import { SessionStoreService } from './session-store.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

interface PocketBaseAuthResponse {
  token: string;
  record: {
    id: string;
    name?: string;
    full_name?: string;
    email: string;
    role?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client = inject(PocketBaseClientService);
  private readonly sessionStore = inject(SessionStoreService);
  private readonly router = inject(Router);

  login(email: string, password: string) {
    return this.authenticate(email, password).pipe(
      tap(({ response, displayName, role }) => {
        this.sessionStore.setSession({
          token: response.token,
          adminToken: null,
          user: {
            id: response.record.id,
            fullName: displayName,
            email: response.record.email,
            role
          }
        });
      })
    );
  }

  private authenticate(email: string, password: string) {
    return this.client.create<PocketBaseAuthResponse>(environment.pocketbaseCollections.users, {
      identity: email,
      password
    }, 'auth-with-password').pipe(
      map((response) => ({
        response,
        displayName: response.record.full_name ?? response.record.name ?? 'Usuario Portal',
        role: response.record.role ?? 'Administrador'
      }))
    );
  }

  loginAsAdmin(): Observable<string> {
    const { identity, password } = environment.adminAuth;
    return this.authenticate(identity, password).pipe(
      tap(({ response }) => this.sessionStore.setAdminToken(response.token)),
      map(({ response }) => response.token)
    );
  }

  logout(): void {
    this.sessionStore.clearSession();
    void this.router.navigate(['/login']);
  }

  get token(): string | null {
    return this.sessionStore.token();
  }
}
