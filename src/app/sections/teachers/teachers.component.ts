import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { exportToCsv } from '../../utils/csv-export';

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

  protected readonly filter = signal('');
  protected readonly teachers = signal<Teacher[]>([
    { id: uuid(), name: 'Carmen Díaz', subject: 'Matemática', availability: 'Tiempo completo' },
    { id: uuid(), name: 'Hugo Ríos', subject: 'Historia', availability: 'Medio tiempo' }
  ]);
  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    subject: ['', Validators.required],
    availability: ['Tiempo completo' as Teacher['availability'], Validators.required]
  });

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
    this.teachers.update((list) => list.filter((teacher) => teacher.id !== id));
    if (this.editingId() === id) {
      this.startCreate();
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = { ...this.form.getRawValue(), id: this.editingId() ?? uuid() } as Teacher;

    this.teachers.update((list) => {
      if (this.editingId()) {
        return list.map((item) => (item.id === payload.id ? payload : item));
      }
      return [...list, payload];
    });

    this.startCreate();
  }

  protected exportTeachers(): void {
    const header = ['Nombre', 'Materia', 'Disponibilidad'];
    const rows = this.teachers().map((teacher) => [teacher.name, teacher.subject, teacher.availability]);
    exportToCsv(header, rows, 'docentes.csv');
  }
}
