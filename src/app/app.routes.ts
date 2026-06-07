import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'attendee',
    pathMatch: 'full'
  },
  {
    path: 'attendee',
    loadComponent: () => import('./features/attendee/attendee.component').then(m => m.AttendeeComponent)
  },
  {
    path: 'display',
    loadComponent: () => import('./features/display/display.component').then(m => m.DisplayComponent)
  },
  {
    path: 'qr',
    loadComponent: () => import('./features/qr-view/qr-view.component').then(m => m.QrViewComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'assembly/:id',
        loadComponent: () => import('./features/admin/assembly-detail.component').then(m => m.AssemblyDetailComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'attendee'
  }
];
