import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { SessionStoreService } from '../core/services/session-store.service';

interface PortalUser {
  name: string;
  email: string;
  role: 'Administrador' | 'Coordinador' | 'Docente';
}

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal.component.html',
  styleUrl: './portal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly sessionStore = inject(SessionStoreService);

  protected readonly roles: PortalUser['role'][] = ['Administrador', 'Coordinador', 'Docente'];
  protected readonly user = computed(() => {
    const sessionUser = this.sessionStore.user();
    return {
      name: sessionUser?.fullName ?? 'Usuario Portal',
      email: sessionUser?.email ?? 'sin-correo@colegio.edu',
      role: (sessionUser?.role as PortalUser['role']) ?? 'Administrador'
    } satisfies PortalUser;
  });
  protected readonly accountOpen = signal(false);

  protected readonly accountForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['Administrador' as PortalUser['role'], Validators.required]
  });

  protected toggleAccountPanel(): void {
    if (!this.accountOpen()) {
      this.accountForm.setValue(this.user());
      this.accountOpen.set(true);
      return;
    }
    this.accountOpen.set(false);
  }

  protected saveAccount(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const updated = this.accountForm.getRawValue() as PortalUser;
    this.sessionStore.updateUser({
      id: this.sessionStore.user()?.id ?? crypto.randomUUID(),
      fullName: updated.name,
      email: updated.email,
      role: updated.role
    });
    this.accountOpen.set(false);
  }

  protected cancelAccount(): void {
    this.accountForm.setValue(this.user());
    this.accountOpen.set(false);
  }

  protected logout(): void {
    this.accountOpen.set(false);
    this.authService.logout();
  }
}
