import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { PortalComponent } from './portal/portal.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: 'portal',
    canActivate: [authGuard],
    component: PortalComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', loadComponent: () => import('./sections/home/home.component').then(m => m.HomeComponent) },
      { path: 'students', loadComponent: () => import('./sections/students/students.component').then(m => m.StudentsComponent) },
      { path: 'teachers', loadComponent: () => import('./sections/teachers/teachers.component').then(m => m.TeachersComponent) },
      { path: 'courses', loadComponent: () => import('./sections/courses/courses.component').then(m => m.CoursesComponent) },
      { path: 'grades', loadComponent: () => import('./sections/grades/grades.component').then(m => m.GradesComponent) },
      { path: 'dashboard', component: DashboardComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
