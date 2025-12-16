import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  protected readonly submitting = signal(false);
  protected readonly feedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false]
  });

  protected readonly emailErrors = computed(() => {
    const control = this.loginForm.controls.email;
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return 'El correo es obligatorio.';
    }

    if (control.hasError('email')) {
      return 'Introduce un correo válido.';
    }

    return '';
  });

  protected readonly passwordErrors = computed(() => {
    const control = this.loginForm.controls.password;
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return 'La contraseña es obligatoria.';
    }

    if (control.hasError('minlength')) {
      return 'Debe tener al menos 6 caracteres.';
    }

    return '';
  });

  protected async submit(): Promise<void> {
    if (this.submitting()) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.feedback.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.authService
      .login(email, password)
      .pipe()
      .subscribe({
        next: async () => {
          this.feedback.set({ type: 'success', message: 'Inicio de sesión exitoso. ¡Bienvenido!' });
          await new Promise((resolve) => setTimeout(resolve, 400));
          await this.router.navigate(['/portal/dashboard']);
        },
        error: () => {
          this.feedback.set({ type: 'error', message: 'Credenciales inválidas o acceso denegado.' });
          this.submitting.set(false);
        }
      });
  }
}
