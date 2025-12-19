import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { tap } from 'rxjs/operators';
import { exportToCsv } from '../../utils/csv-export';
import { CoursesService, CourseDto } from '../../core/services/courses.service';
import { TeachersService, TeacherDto } from '../../core/services/teachers.service';

interface Course {
  id: string;
  title: string;
  level: string;
  credits: number;
  teacherId?: string;
  teacherName?: string;
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
  private readonly coursesService = inject(CoursesService);
  private readonly teachersService = inject(TeachersService);

  protected readonly filter = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly courses = signal<Course[]>([]);
  protected readonly teachers = signal<TeacherDto[]>([]);
  protected readonly editingId = signal<string | null>(null);

  // Filtros avanzados
  protected readonly filtros = signal({
    nombre: '',
    nivel: '',
    creditos: '',
    docente: ''
  });

  setFiltro(key: 'nombre' | 'nivel' | 'creditos' | 'docente', value: string): void {
    this.filtros.set({ ...this.filtros(), [key]: value });
  }

  filteredCourses(): Course[] {
    const { nombre, nivel, creditos, docente } = this.filtros();
    return this.courses().filter(course =>
      (!nombre || course.title.toLowerCase().includes(nombre.toLowerCase())) &&
      (!nivel || course.level.toLowerCase().includes(nivel.toLowerCase())) &&
      (!creditos || course.credits === +creditos) &&
      (!docente || (course.teacherName || '').toLowerCase().includes(docente.toLowerCase()))
    );
  }

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    level: ['', Validators.required],
    credits: [3, [Validators.required, Validators.min(1)]],
    teacherId: ['']
  });

  constructor() {
    this.loadCourses();
    this.loadTeachers();
  }

  private loadTeachers(): void {
    this.teachersService.list().subscribe({
      next: ({ items }) => {
        console.log('Docentes cargados:', items);
        this.teachers.set(items);
      },
      error: (err) => {
        console.error('No se pudieron cargar los docentes.', err);
        this.teachers.set([]);
      }
    });
  }

  private loadCourses(): void {
    this.loading.set(true);
    this.error.set(null);
    this.coursesService
      .list()
      .pipe(
        tap(() => this.loading.set(true))
      )
      .subscribe({
        next: ({ items }) => {
          this.courses.set(items.map(dto => this.mapDtoToCourse(dto)));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No pudimos obtener la lista de cursos.');
          this.loading.set(false);
        }
      });
  }

  private mapDtoToCourse(dto: CourseDto): Course {
    const teacher = dto.teacher_id
      ? this.teachers().find(t => t.id === dto.teacher_id)
      : undefined;

    return {
      id: dto.id,
      title: dto.title,
      level: dto.level,
      credits: dto.credits,
      teacherId: dto.teacher_id,
      teacherName: teacher?.full_name
    };
  }

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ title: '', level: '', credits: 3, teacherId: '' });
  }

  protected startEdit(course: Course): void {
    this.editingId.set(course.id);
    this.form.setValue({
      title: course.title,
      level: course.level,
      credits: course.credits,
      teacherId: course.teacherId || ''
    });
  }

  protected deleteCourse(id: string): void {
    this.loading.set(true);
    this.coursesService.delete(id).subscribe({
      next: () => {
        this.courses.update((list) => list.filter((course) => course.id !== id));
        this.loading.set(false);
        if (this.editingId() === id) {
          this.startCreate();
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo eliminar el curso.');
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();

    this.loading.set(true);
    const request = this.editingId()
      ? this.coursesService.update(this.editingId()!, this.mapFormToDto(payload))
      : this.coursesService.create(this.mapFormToDto(payload));

    request.subscribe({
      next: (dto) => {
        const course = this.mapDtoToCourse(dto);
        this.courses.update((list) => {
          if (this.editingId()) {
            return list.map((item) => (item.id === course.id ? course : item));
          }
          return [...list, course];
        });

        this.startCreate();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo guardar el curso.');
        this.loading.set(false);
      }
    });
  }

  private mapFormToDto(form: { title: string; level: string; credits: number; teacherId: string }): Partial<CourseDto> {
    const dto: Partial<CourseDto> = {
      title: form.title,
      level: form.level,
      credits: form.credits
    };

    // Solo agregar teacher_id si hay un docente seleccionado
    if (form.teacherId) {
      dto.teacher_id = form.teacherId;
    }

    return dto;
  }

  protected exportCourses(): void {
    const header = ['Curso', 'Nivel', 'Créditos', 'Docente'];
    const rows = this.courses().map((course) => [
      course.title,
      course.level,
      course.credits.toString(),
      course.teacherName || 'Sin asignar'
    ]);
    exportToCsv(header, rows, 'cursos.csv');
  }
}
