import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { exportToCsv } from '../../utils/csv-export';

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

  protected readonly filter = signal('');
  protected readonly roles: Student['role'][] = ['Estudiante', 'Prefecto', 'Administrador'];
  protected readonly students = signal<Student[]>([
    { id: uuid(), name: 'Ana Torres', grade: '5°A', status: 'Activo', role: 'Estudiante' },
    { id: uuid(), name: 'Luis Pérez', grade: '4°B', status: 'Activo', role: 'Prefecto' },
    { id: uuid(), name: 'María López', grade: '3°C', status: 'Inactivo', role: 'Administrador' }
  ]);
  protected readonly editingId = signal<string | null>(null);
  protected readonly selectedStudent = signal<Student | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    grade: ['', Validators.required],
    status: ['Activo' as Student['status'], Validators.required],
    role: ['Estudiante' as Student['role'], Validators.required]
  });

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
    this.students.update((list) => list.filter((student) => student.id !== id));
    if (this.editingId() === id || this.selectedStudent()?.id === id) {
      this.startCreate();
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = { ...this.form.getRawValue(), id: this.editingId() ?? uuid() } as Student;

    this.students.update((list) => {
      if (this.editingId()) {
        return list.map((item) => (item.id === payload.id ? payload : item));
      }
      return [...list, payload];
    });

    if (this.selectedStudent()?.id === payload.id) {
      this.selectedStudent.set(payload);
      this.startCreate({ keepSelected: true });
    } else {
      this.startCreate();
    }
  }

  protected exportStudents(): void {
    const header = ['Nombre', 'Grado', 'Estado', 'Rol'];
    const rows = this.students().map((student) => [student.name, student.grade, student.status, student.role]);
    exportToCsv(header, rows, 'estudiantes.csv');
  }
}
