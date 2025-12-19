import { ChangeDetectionStrategy, Component, signal, inject, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { StudentsService } from '../core/services/students.service';
import { TeachersService } from '../core/services/teachers.service';
import { CoursesService } from '../core/services/courses.service';
import { Chart, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  studentsByStatus: { activos: number; inactivos: number };
  coursesByLevel: { [key: string]: number };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly studentsService = inject(StudentsService);
  private readonly teachersService = inject(TeachersService);
  private readonly coursesService = inject(CoursesService);

  @ViewChild('studentsChart') studentsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('coursesChart') coursesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('overviewChart') overviewChartRef!: ElementRef<HTMLCanvasElement>;

  protected readonly loading = signal(true);
  protected readonly stats = signal<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    studentsByStatus: { activos: 0, inactivos: 0 },
    coursesByLevel: {}
  });

  private studentsChart?: Chart;
  private coursesChart?: Chart;
  private overviewChart?: Chart;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAllData();
    }
  }

  private loadAllData(): void {
    let studentsData: any[] = [];
    let teachersData: any[] = [];
    let coursesData: any[] = [];

    // Cargar estudiantes
    this.studentsService.list().subscribe({
      next: ({ items }) => {
        studentsData = items;
        this.updateStats(studentsData, teachersData, coursesData);
      }
    });

    // Cargar docentes
    this.teachersService.list().subscribe({
      next: ({ items }) => {
        teachersData = items;
        this.updateStats(studentsData, teachersData, coursesData);
      }
    });

    // Cargar cursos
    this.coursesService.list().subscribe({
      next: ({ items }) => {
        coursesData = items;
        this.updateStats(studentsData, teachersData, coursesData);
      }
    });
  }

  private updateStats(students: any[], teachers: any[], courses: any[]): void {
    const activos = students.filter(s => s.status === 'Activo').length;
    const inactivos = students.filter(s => s.status === 'Inactivo').length;

    const coursesByLevel: { [key: string]: number } = {};
    courses.forEach(course => {
      const level = course.level || 'Sin nivel';
      coursesByLevel[level] = (coursesByLevel[level] || 0) + 1;
    });

    this.stats.set({
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalCourses: courses.length,
      studentsByStatus: { activos, inactivos },
      coursesByLevel
    });

    this.loading.set(false);

    // Crear gráficos después de actualizar stats
    setTimeout(() => this.createCharts(), 100);
  }

  private createCharts(): void {
    this.createStudentsChart();
    this.createCoursesChart();
    this.createOverviewChart();
  }

  private createStudentsChart(): void {
    if (!this.studentsChartRef?.nativeElement) return;

    // Destruir gráfico existente si hay
    if (this.studentsChart) {
      this.studentsChart.destroy();
    }

    const ctx = this.studentsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const { activos, inactivos } = this.stats().studentsByStatus;

    this.studentsChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Inactivos'],
        datasets: [{
          data: [activos, inactivos],
          backgroundColor: ['#68d3b6', '#ff6b6b'],
          borderColor: ['rgba(12, 18, 35, 0.8)', 'rgba(12, 18, 35, 0.8)'],
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#fff',
              font: { size: 12 },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: { display: false }
        }
      }
    });
  }

  private createCoursesChart(): void {
    if (!this.coursesChartRef?.nativeElement) return;

    if (this.coursesChart) {
      this.coursesChart.destroy();
    }

    const ctx = this.coursesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const levels = Object.keys(this.stats().coursesByLevel);
    const counts = Object.values(this.stats().coursesByLevel);

    this.coursesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: levels,
        datasets: [{
          label: 'Cursos',
          data: counts,
          backgroundColor: [
            'rgba(93, 156, 255, 0.8)',
            'rgba(132, 94, 252, 0.8)',
            'rgba(255, 159, 67, 0.8)',
            'rgba(104, 211, 182, 0.8)'
          ],
          borderColor: ['#5d9cff', '#845efc', '#ff9f43', '#68d3b6'],
          borderWidth: 2,
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          x: {
            ticks: { color: '#94a1c6', font: { size: 12 } },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#94a1c6',
              font: { size: 11 },
              stepSize: 1
            },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  }

  private createOverviewChart(): void {
    if (!this.overviewChartRef?.nativeElement) return;

    if (this.overviewChart) {
      this.overviewChart.destroy();
    }

    const ctx = this.overviewChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const { totalStudents, totalTeachers, totalCourses } = this.stats();

    this.overviewChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Estudiantes', 'Docentes', 'Cursos'],
        datasets: [{
          label: 'Total',
          data: [totalStudents, totalTeachers, totalCourses],
          backgroundColor: [
            'rgba(93, 156, 255, 0.8)',
            'rgba(132, 94, 252, 0.8)',
            'rgba(104, 211, 182, 0.8)'
          ],
          borderColor: ['#5d9cff', '#845efc', '#68d3b6'],
          borderWidth: 2,
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#94a1c6',
              font: { size: 11 },
              stepSize: 1
            },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: { color: '#fff', font: { size: 13 } },
            grid: { display: false }
          }
        }
      }
    });
  }
}

