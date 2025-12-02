import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { exportToCsv } from '../../utils/csv-export';

interface Course {
  id: string;
  title: string;
  level: string;
  credits: number;
}

@Component({
  selector: 'app-courses-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css', '../shared/crud.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoursesComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly filter = signal('');
  protected readonly courses = signal<Course[]>([
    { id: uuid(), title: 'Programación I', level: 'Básico', credits: 4 },
    { id: uuid(), title: 'Física moderna', level: 'Avanzado', credits: 5 }
  ]);
  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    level: ['', Validators.required],
    credits: [3, [Validators.required, Validators.min(1)]]
  });

  protected readonly filteredCourses = computed(() => {
    const term = this.filter().toLowerCase();
    return this.courses().filter((course) =>
      course.title.toLowerCase().includes(term) || course.level.toLowerCase().includes(term)
    );
  });

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ title: '', level: '', credits: 3 });
  }

  protected startEdit(course: Course): void {
    this.editingId.set(course.id);
    this.form.setValue({ title: course.title, level: course.level, credits: course.credits });
  }

  protected deleteCourse(id: string): void {
    this.courses.update((list) => list.filter((course) => course.id !== id));
    if (this.editingId() === id) {
      this.startCreate();
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = { ...this.form.getRawValue(), id: this.editingId() ?? uuid() } as Course;

    this.courses.update((list) => {
      if (this.editingId()) {
        return list.map((item) => (item.id === payload.id ? payload : item));
      }
      return [...list, payload];
    });

    this.startCreate();
  }

  protected exportCourses(): void {
    const header = ['Curso', 'Nivel', 'Créditos'];
    const rows = this.courses().map((course) => [course.title, course.level, course.credits]);
    exportToCsv(header, rows, 'cursos.csv');
  }
}
