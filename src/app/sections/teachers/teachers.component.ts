import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { exportToCsv } from '../../utils/csv-export';
import { TeachersService, TeacherDto } from '../../core/services/teachers.service';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  availability: 'Tiempo completo' | 'Medio tiempo';
}

@Component({
  selector: 'app-teachers-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teachers.component.html',
  styleUrls: ['./teachers.component.css', '../shared/crud.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeachersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teachersService = inject(TeachersService);

  protected readonly filter = signal('');
  protected readonly teachers = signal<Teacher[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    subject: ['', Validators.required],
    availability: ['Tiempo completo' as Teacher['availability'], Validators.required]
  });

  constructor() {
    this.loadTeachers();
  }

  private loadTeachers(): void {
    this.loading.set(true);
    this.teachersService.list().subscribe({
      next: ({ items }) => {
        this.teachers.set(items.map(this.mapDtoToTeacher));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos obtener a los docentes.');
        this.loading.set(false);
      }
    });
  }

  private mapDtoToTeacher(dto: TeacherDto): Teacher {
    return {
      id: dto.id,
      name: dto.full_name,
      subject: dto.subject,
      availability: dto.availability
    } satisfies Teacher;
  }

  protected readonly filteredTeachers = computed(() => {
    const term = this.filter().toLowerCase();
    return this.teachers().filter((teacher) =>
      teacher.name.toLowerCase().includes(term) || teacher.subject.toLowerCase().includes(term)
    );
  });

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', subject: '', availability: 'Tiempo completo' });
  }

  protected startEdit(teacher: Teacher): void {
    this.editingId.set(teacher.id);
    this.form.setValue({ name: teacher.name, subject: teacher.subject, availability: teacher.availability });
  }

  protected deleteTeacher(id: string): void {
    this.loading.set(true);
    this.teachersService.delete(id).subscribe({
      next: () => {
        this.teachers.update((list) => list.filter((teacher) => teacher.id !== id));
        this.loading.set(false);
        if (this.editingId() === id) {
          this.startCreate();
        }
      },
      error: () => {
        this.error.set('No se pudo eliminar al docente.');
        this.loading.set(false);
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.form.getRawValue();
    const dtoPayload = {
      full_name: payload.name,
      subject: payload.subject,
      availability: payload.availability
    } as Partial<TeacherDto>;

    const request = this.editingId()
      ? this.teachersService.update(this.editingId()!, dtoPayload)
      : this.teachersService.create(dtoPayload);

    request.subscribe({
      next: (dto) => {
        const teacher = this.mapDtoToTeacher(dto);
        this.teachers.update((list) => {
          if (this.editingId()) {
            return list.map((item) => (item.id === teacher.id ? teacher : item));
          }
          return [...list, teacher];
        });

        this.startCreate();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo guardar al docente.');
        this.loading.set(false);
      }
    });
  }

  protected exportTeachers(): void {
    const header = ['Nombre', 'Materia', 'Disponibilidad'];
    const rows = this.teachers().map((teacher) => [teacher.name, teacher.subject, teacher.availability]);
    exportToCsv(header, rows, 'docentes.csv');
  }
}
