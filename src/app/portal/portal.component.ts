import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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
  private readonly router = inject(Router);

  protected readonly roles: PortalUser['role'][] = ['Administrador', 'Coordinador', 'Docente'];
  protected readonly user = signal<PortalUser>({
    name: 'Gabriela Silva',
    email: 'gabriela.silva@colegio.edu',
    role: 'Administrador'
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

    this.user.set(this.accountForm.getRawValue() as PortalUser);
    this.accountOpen.set(false);
  }

  protected cancelAccount(): void {
    this.accountForm.setValue(this.user());
    this.accountOpen.set(false);
  }

  protected logout(): void {
    this.accountOpen.set(false);
    void this.router.navigate(['/login']);
  }
}
