import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { tap } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToCsv } from '../../utils/csv-export';
import { StudentsService, StudentDto } from '../../core/services/students.service';
import { CoursesService, CourseDto } from '../../core/services/courses.service';

interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'Activo' | 'Inactivo';
  role: 'Estudiante' | 'Prefecto' | 'Administrador';
}

@Component({
  selector: 'app-students-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css', '../shared/crud.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly studentsService = inject(StudentsService);
  private readonly coursesService = inject(CoursesService);

  protected readonly filter = signal('');
  protected readonly roles: Student['role'][] = ['Estudiante', 'Prefecto', 'Administrador'];
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly students = signal<Student[]>([]);
  protected readonly courses = signal<CourseDto[]>([]);
  protected readonly editingId = signal<string | null>(null);
  protected readonly selectedStudent = signal<Student | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    grade: ['', Validators.required],
    status: ['Activo' as Student['status'], Validators.required],
    role: ['Estudiante' as Student['role'], Validators.required]
  });

  constructor() {
    this.loadStudents();
    this.loadCourses();
  }

  private loadCourses(): void {
    this.coursesService.list().subscribe({
      next: ({ items }) => {
        this.courses.set(items);
      },
      error: () => {
        console.error('No se pudieron cargar los cursos.');
      }
    });
  }

  private loadStudents(): void {
    this.loading.set(true);
    this.error.set(null);
    this.studentsService
      .list()
      .pipe(
        tap(() => this.loading.set(true))
      )
      .subscribe({
        next: ({ items }) => {
          this.students.set(items.map(this.mapDtoToStudent));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No pudimos obtener la lista de estudiantes.');
          this.loading.set(false);
        }
      });
  }

  private mapDtoToStudent(dto: StudentDto): Student {
    return {
      id: dto.id,
      name: dto.full_name,
      grade: dto.grade,
      status: dto.status,
      role: (dto.role as Student['role']) ?? 'Estudiante'
    } satisfies Student;
  }

  protected readonly filteredStudents = computed(() => {
    const term = this.filter().toLowerCase();
    return this.students().filter((student) =>
      student.name.toLowerCase().includes(term) || student.grade.toLowerCase().includes(term)
    );
  });

  protected startCreate(options?: { keepSelected?: boolean }): void {
    this.editingId.set(null);
    if (!options?.keepSelected) {
      this.selectedStudent.set(null);
    }
    this.form.reset({ name: '', grade: '', status: 'Activo', role: 'Estudiante' });
  }

  protected startEdit(student: Student): void {
    this.editingId.set(student.id);
    this.form.setValue({ name: student.name, grade: student.grade, status: student.status, role: student.role });
  }

  protected openProfile(student: Student): void {
    this.selectedStudent.set(student);
    this.startEdit(student);
  }

  protected closeProfile(): void {
    this.startCreate();
  }

  protected deleteStudent(id: string): void {
    this.loading.set(true);
    this.studentsService.delete(id).subscribe({
      next: () => {
        this.students.update((list) => list.filter((student) => student.id !== id));
        this.loading.set(false);
        if (this.editingId() === id || this.selectedStudent()?.id === id) {
          this.startCreate();
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo eliminar al estudiante.');
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
      ? this.studentsService.update(this.editingId()!, this.mapFormToDto(payload))
      : this.studentsService.create(this.mapFormToDto(payload));

    request.subscribe({
      next: (dto) => {
        const student = this.mapDtoToStudent(dto as StudentDto);
        this.students.update((list) => {
          if (this.editingId()) {
            return list.map((item) => (item.id === student.id ? student : item));
          }
          return [...list, student];
        });

        if (this.selectedStudent()?.id === student.id) {
          this.selectedStudent.set(student);
          this.startCreate({ keepSelected: true });
        } else {
          this.startCreate();
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo guardar al estudiante.');
        this.loading.set(false);
      }
    });
  }

  private mapFormToDto(form: { name: string; grade: string; status: Student['status']; role: Student['role'] }): Partial<StudentDto> {
    return {
      full_name: form.name,
      grade: form.grade,
      status: form.status,
      role: form.role
    } satisfies Partial<StudentDto>;
  }

  protected exportStudents(): void {
    const header = ['Nombre', 'Grado', 'Estado', 'Rol'];
    const rows = this.students().map((student) => [student.name, student.grade, student.status, student.role]);
    exportToCsv(header, rows, 'estudiantes.csv');
  }

  protected exportToPdf(): void {
    const students = this.filteredStudents();

    if (students.length === 0) {
      alert('No hay estudiantes para exportar.');
      return;
    }

    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Estudiantes', 14, 22);

    // Información general
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 32);
    doc.text(`Total de estudiantes: ${students.length}`, 14, 38);

    // Tabla de estudiantes
    const tableData = students.map(student => [
      student.name,
      student.grade,
      student.status,
      student.role
    ]);

    autoTable(doc, {
      head: [['Nombre', 'Grado', 'Estado', 'Rol']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawCell: (data) => {
        // Colorear la columna de estado
        if (data.column.index === 2 && data.section === 'body') {
          const status = tableData[data.row.index][2];
          if (status === 'Activo') {
            doc.setTextColor(0, 128, 0);
          } else {
            doc.setTextColor(255, 0, 0);
          }
        }
      }
    });

    // Estadísticas
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    const activos = students.filter(s => s.status === 'Activo').length;
    const inactivos = students.filter(s => s.status === 'Inactivo').length;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Activos: ${activos}`, 14, finalY + 10);
    doc.text(`Inactivos: ${inactivos}`, 14, finalY + 16);

    // Guardar el PDF
    const fileName = `estudiantes_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  }
}
