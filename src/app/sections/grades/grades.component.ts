import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { tap, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GradesService, GradeDto } from '../../core/services/grades.service';
import { StudentsService, StudentDto } from '../../core/services/students.service';
import { CoursesService, CourseDto } from '../../core/services/courses.service';
import { EnrollmentsService, EnrollmentDto } from '../../core/services/enrollments.service';

interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  note1: number;
  note2: number;
  note3: number;
  average: number;
  status: 'Aprobado' | 'Reprobado';
}

@Component({
  selector: 'app-grades-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.css', '../shared/crud.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GradesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly gradesService = inject(GradesService);
  private readonly studentsService = inject(StudentsService);
  private readonly coursesService = inject(CoursesService);
  private readonly enrollmentsService = inject(EnrollmentsService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly grades = signal<Grade[]>([]);
  protected readonly students = signal<StudentDto[]>([]);
  protected readonly courses = signal<CourseDto[]>([]);
  protected readonly enrollments = signal<EnrollmentDto[]>([]);
  protected readonly editingId = signal<string | null>(null);
  protected readonly selectedCourseId = signal<string>('');

  // Signal para forzar actualización del dropdown
  private readonly refreshStudentList = signal(0);

  // Computed para estudiantes matriculados en el curso seleccionado
  protected readonly enrolledStudentIds = computed(() => {
    const courseId = this.selectedCourseId();
    if (!courseId) return new Set<string>();

    return new Set(
      this.enrollments()
        .filter(e => e.course_id === courseId && e.status === 'Activo')
        .map(e => e.student_id)
    );
  });

  // Computed para detectar si no hay sistema de enrollments configurado
  protected readonly enrollmentsNotConfigured = computed(() => {
    return this.enrollments().length === 0;
  });

  protected readonly form = this.fb.nonNullable.group({
    studentId: ['', Validators.required],
    courseId: ['', Validators.required],
    note1: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    note2: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    note3: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.loading.set(true);
    forkJoin({
      students: this.studentsService.list(),
      courses: this.coursesService.list(),
      enrollments: this.enrollmentsService.list().pipe(
        catchError((error) => {
          console.warn('⚠️ La colección enrollments no existe o no se pudo cargar:', error);
          return of({ items: [] }); // Retornar array vacío si falla
        })
      )
    }).subscribe({
      next: ({ students, courses, enrollments }) => {
        this.students.set(students.items);
        this.courses.set(courses.items);
        this.enrollments.set(enrollments.items);
        this.loading.set(false);

        if (enrollments.items.length === 0) {
          console.warn('⚠️ No hay enrollments configurados. Ver GUIA_ENROLLMENTS.md');
        }
      },
      error: (error) => {
        console.error('Error cargando datos:', error);
        this.error.set('No se pudieron cargar los datos iniciales.');
        this.loading.set(false);
      }
    });
  }

  protected onCourseSelect(courseId: string): void {
    console.log('Curso seleccionado:', courseId);
    this.selectedCourseId.set(courseId);

    // Actualizar el courseId en el formulario inmediatamente
    if (courseId) {
      this.form.patchValue({ courseId: courseId });
      console.log('CourseId actualizado en el formulario:', this.form.get('courseId')?.value);
      this.loadGradesByCourse(courseId);
    } else {
      this.form.patchValue({ courseId: '' });
      this.grades.set([]);
    }
  }

  private loadGradesByCourse(courseId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.gradesService
      .list(courseId)
      .pipe(tap(() => this.loading.set(true)))
      .subscribe({
        next: ({ items }) => {
          this.grades.set(items.map(dto => this.mapDtoToGrade(dto)));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron obtener las notas del curso.');
          this.loading.set(false);
        }
      });
  }

  private mapDtoToGrade(dto: GradeDto): Grade {
    const student = this.students().find(s => s.id === dto.student_id);
    const course = this.courses().find(c => c.id === dto.course_id);
    const average = (dto.note1 + dto.note2 + dto.note3) / 3;
    const status = average >= 51 ? 'Aprobado' : 'Reprobado';

    return {
      id: dto.id,
      studentId: dto.student_id,
      studentName: student?.full_name || 'Desconocido',
      courseId: dto.course_id,
      courseName: course?.title || 'Desconocido',
      note1: dto.note1,
      note2: dto.note2,
      note3: dto.note3,
      average: Math.round(average * 100) / 100,
      status
    };
  }

  protected readonly filteredGrades = computed(() => {
    const courseId = this.selectedCourseId();
    if (!courseId) return [];
    return this.grades().filter(grade => grade.courseId === courseId);
  });

  protected readonly approvedCount = computed(() => {
    return this.filteredGrades().filter(g => g.status === 'Aprobado').length;
  });

  protected readonly failedCount = computed(() => {
    return this.filteredGrades().filter(g => g.status === 'Reprobado').length;
  });

  protected readonly generalAverage = computed(() => {
    const grades = this.filteredGrades();
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, g) => acc + g.average, 0);
    return sum / grades.length;
  });

  // Estudiantes disponibles (matriculados en el curso y sin notas registradas)
  protected getAvailableStudents(): StudentDto[] {
    const allStudents = this.students();
    const allGrades = this.grades();
    const courseId = this.selectedCourseId();
    const editingId = this.editingId();
    const enrolledIds = this.enrolledStudentIds();
    const hasEnrollments = this.enrollments().length > 0;

    // Si no hay curso seleccionado, retornar vacío
    if (!courseId) {
      return [];
    }

    // Obtener IDs de estudiantes que ya tienen notas en ESTE curso
    const gradedStudentIds = new Set<string>();
    for (const grade of allGrades) {
      if (grade.courseId === courseId) {
        gradedStudentIds.add(grade.studentId);
      }
    }

    console.log('=== ESTUDIANTES DISPONIBLES ===');
    console.log('Curso seleccionado:', courseId);
    console.log('Tiene enrollments configurados:', hasEnrollments);
    console.log('Estudiantes matriculados en este curso:', Array.from(enrolledIds));
    console.log('Estudiantes con notas en este curso:', Array.from(gradedStudentIds));

    // Si estamos editando, obtener el studentId de esa nota
    let editingStudentId: string | null = null;
    if (editingId) {
      const editingGrade = allGrades.find(g => g.id === editingId);
      editingStudentId = editingGrade?.studentId || null;
    }

    // Filtrar estudiantes según:
    // 1. Si HAY enrollments: solo estudiantes matriculados en el curso
    // 2. Si NO HAY enrollments: todos los estudiantes del mismo grado/nivel que el curso
    // 3. Excluir los que ya tienen notas (excepto si se está editando)
    const available = allStudents.filter(student => {
      // Si estamos editando, incluir el estudiante que se está editando
      if (editingStudentId && student.id === editingStudentId) {
        return true;
      }

      // Si HAY enrollments, verificar que el estudiante esté matriculado
      if (hasEnrollments && !enrolledIds.has(student.id)) {
        return false;
      }

      // Si NO HAY enrollments, filtrar por grado/nivel del estudiante
      if (!hasEnrollments) {
        const course = this.courses().find(c => c.id === courseId);
        if (course) {
          // Extraer el grado específico del título del curso
          // Ejemplo: "5to A - Secundaria" -> extraer "5to A"
          const courseTitleParts = course.title.split(' - ');
          const courseGradeFromTitle = courseTitleParts[0]?.trim() || '';

          // Normalizar para comparación
          const studentGradeNormalized = student.grade.trim().toLowerCase();
          const courseGradeNormalized = courseGradeFromTitle.toLowerCase();

          console.log(`🔍 Comparando estudiante "${student.full_name}":`, {
            studentGrade: student.grade,
            courseTitle: course.title,
            courseGradeExtracted: courseGradeFromTitle,
            studentGradeNormalized,
            courseGradeNormalized
          });

          // El grado del estudiante debe coincidir exactamente con el grado del curso
          // Ejemplo: student.grade = "5to A" debe coincidir con courseGrade = "5to A"
          // O: student.grade = "5to A - Secundaria" debe coincidir con courseGrade = "5to A"
          const matches = studentGradeNormalized === courseGradeNormalized ||
                         studentGradeNormalized.startsWith(courseGradeNormalized + ' ') ||
                         studentGradeNormalized.startsWith(courseGradeNormalized + '-');

          console.log(`✅ Resultado: ${matches ? 'INCLUIR' : 'EXCLUIR'}`);

          if (!matches) {
            return false;
          }
        }
      }

      // Excluir los que ya tienen notas en este curso
      return !gradedStudentIds.has(student.id);
    });

    console.log('Estudiantes disponibles:', available.map(s => `${s.full_name} (${s.grade})`));

    if (available.length === 0 && enrolledIds.size === 0 && hasEnrollments) {
      console.warn('⚠️ No hay estudiantes matriculados en este curso. Configura las matrículas (enrollments) primero.');
    }

    return available;
  }


  protected startCreate(): void {
    this.editingId.set(null);
    const courseId = this.selectedCourseId();
    console.log('Limpiando formulario. CourseId:', courseId);

    // Reset completo del formulario
    this.form.reset({
      studentId: '',
      courseId: courseId || '',
      note1: 0,
      note2: 0,
      note3: 0
    });

    // Marcar el formulario como pristine y untouched
    this.form.markAsPristine();
    this.form.markAsUntouched();

    // Marcar cada control individualmente
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsPristine();
      control?.markAsUntouched();
    });

    // Limpiar cualquier error
    this.error.set(null);

    console.log('✅ Formulario limpiado completamente. Valores:', this.form.value);
  }

  protected startEdit(grade: Grade): void {
    this.editingId.set(grade.id);
    this.form.setValue({
      studentId: grade.studentId,
      courseId: grade.courseId,
      note1: grade.note1,
      note2: grade.note2,
      note3: grade.note3
    });
  }

  protected saveGrade(): void {
    console.log('=== INICIANDO GUARDADO DE NOTA ===');
    console.log('Estado del formulario:', {
      valid: this.form.valid,
      value: this.form.value,
      rawValue: this.form.getRawValue(),
      errors: this.form.errors
    });

    const formValue = this.form.getRawValue();

    // Validar estudiante
    if (!formValue.studentId) {
      this.error.set('Debes seleccionar un estudiante.');
      console.error('Error: No hay estudiante seleccionado');
      return;
    }

    // Validar curso - usar el selectedCourseId como fallback
    let courseId = formValue.courseId;
    if (!courseId) {
      courseId = this.selectedCourseId();
      if (!courseId) {
        this.error.set('Debes seleccionar un curso primero.');
        console.error('Error: No hay courseId');
        return;
      }
      // Actualizar el formulario con el courseId correcto
      this.form.patchValue({ courseId: courseId });
      console.log('CourseId recuperado del selectedCourseId:', courseId);
    }

    // Validar notas
    if (formValue.note1 === null || formValue.note1 === undefined || formValue.note1 < 0 || formValue.note1 > 100) {
      this.error.set('La Nota 1 debe estar entre 0 y 100.');
      console.error('Error: Nota 1 inválida:', formValue.note1);
      return;
    }

    if (formValue.note2 === null || formValue.note2 === undefined || formValue.note2 < 0 || formValue.note2 > 100) {
      this.error.set('La Nota 2 debe estar entre 0 y 100.');
      console.error('Error: Nota 2 inválida:', formValue.note2);
      return;
    }

    if (formValue.note3 === null || formValue.note3 === undefined || formValue.note3 < 0 || formValue.note3 > 100) {
      this.error.set('La Nota 3 debe estar entre 0 y 100.');
      console.error('Error: Nota 3 inválida:', formValue.note3);
      return;
    }

    const average = (formValue.note1 + formValue.note2 + formValue.note3) / 3;
    const status = average >= 51 ? 'Aprobado' : 'Reprobado';

    const payload: Partial<GradeDto> = {
      student_id: formValue.studentId,
      course_id: courseId,
      note1: formValue.note1,
      note2: formValue.note2,
      note3: formValue.note3,
      average,
      status
    };

    console.log('✅ Formulario válido. Payload a enviar:', payload);
    console.log('Promedio calculado:', average, '| Estado:', status);

    this.loading.set(true);
    this.error.set(null);

    const operation = this.editingId()
      ? this.gradesService.update(this.editingId()!, payload)
      : this.gradesService.create(payload);

    operation.subscribe({
      next: (created) => {
        console.log('✅ Nota guardada exitosamente:', created);
        const mappedGrade = this.mapDtoToGrade(created);
        console.log('Nota mapeada:', mappedGrade);

        if (this.editingId()) {
          this.grades.update(list =>
            list.map(g => (g.id === created.id ? mappedGrade : g))
          );
        } else {
          this.grades.update(list => {
            const newList = [...list, mappedGrade];
            console.log('Nueva lista de grades:', newList);
            console.log('IDs de estudiantes con notas:', newList.map(g => g.studentId));
            return newList;
          });
        }

        // Forzar actualización del dropdown de estudiantes
        this.refreshStudentList.update(v => v + 1);
        console.log('🔄 Forzando refresh del dropdown de estudiantes');

        this.startCreate();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Error al guardar la nota:', err);
        console.error('Detalles del error:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });

        let errorMessage = 'No se pudo guardar la nota. ';

        if (err.status === 0) {
          errorMessage += 'No se puede conectar con el servidor. Verifica que PocketBase esté corriendo.';
        } else if (err.status === 400) {
          errorMessage += 'Datos inválidos. Verifica que la colección "grades" exista en PocketBase.';
        } else if (err.status === 403) {
          errorMessage += 'Sin permisos. Verifica las reglas de API en PocketBase.';
        } else if (err.status === 404) {
          errorMessage += 'Colección "grades" no encontrada en PocketBase.';
        } else {
          errorMessage += `Error del servidor: ${err.message}`;
        }

        this.error.set(errorMessage);
        this.loading.set(false);
      }
    });
  }

  protected deleteGrade(id: string): void {
    this.loading.set(true);
    this.gradesService.delete(id).subscribe({
      next: () => {
        this.grades.update(list => list.filter(g => g.id !== id));
        // Forzar actualización del dropdown de estudiantes
        this.refreshStudentList.update(v => v + 1);
        this.loading.set(false);
        if (this.editingId() === id) {
          this.startCreate();
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo eliminar la nota.');
      }
    });
  }

  protected exportToPDF(): void {
    const courseId = this.selectedCourseId();
    if (!courseId) {
      alert('Por favor, seleccione un curso primero.');
      return;
    }

    const course = this.courses().find(c => c.id === courseId);
    const grades = this.filteredGrades();

    if (grades.length === 0) {
      alert('No hay notas para exportar.');
      return;
    }

    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Notas', 14, 22);

    // Información del curso
    doc.setFontSize(12);
    doc.text(`Curso: ${course?.title || 'N/A'}`, 14, 32);
    doc.text(`Nivel: ${course?.level || 'N/A'}`, 14, 38);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 44);

    // Tabla de notas
    const tableData = grades.map(grade => [
      grade.studentName,
      grade.note1.toString(),
      grade.note2.toString(),
      grade.note3.toString(),
      grade.average.toFixed(2),
      grade.status
    ]);

    autoTable(doc, {
      head: [['Estudiante', 'Nota 1', 'Nota 2', 'Nota 3', 'Promedio', 'Estado']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawCell: (data) => {
        // Colorear la columna de estado
        if (data.column.index === 5 && data.section === 'body') {
          const status = tableData[data.row.index][5];
          if (status === 'Aprobado') {
            doc.setTextColor(0, 128, 0);
          } else {
            doc.setTextColor(255, 0, 0);
          }
        }
      }
    });

    // Estadísticas
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    const approved = grades.filter(g => g.status === 'Aprobado').length;
    const failed = grades.filter(g => g.status === 'Reprobado').length;
    const averageTotal = grades.reduce((sum, g) => sum + g.average, 0) / grades.length;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de estudiantes: ${grades.length}`, 14, finalY + 10);
    doc.text(`Aprobados: ${approved}`, 14, finalY + 16);
    doc.text(`Reprobados: ${failed}`, 14, finalY + 22);
    doc.text(`Promedio general: ${averageTotal.toFixed(2)}`, 14, finalY + 28);

    // Guardar el PDF
    const fileName = `notas_${course?.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  }

  protected get selectedCourseName(): string {
    const courseId = this.selectedCourseId();
    if (!courseId) return '';
    const course = this.courses().find(c => c.id === courseId);
    return course?.title || '';
  }
}

