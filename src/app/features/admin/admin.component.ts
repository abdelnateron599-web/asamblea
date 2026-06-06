import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bg-background text-on-background font-body-md text-body-md flex min-h-screen w-full">
      
      <!-- Main Content -->
      <div class="flex-1 relative min-h-screen flex flex-col">
        <!-- Top Navigation -->
        <header *ngIf="auth.isAuthenticated()" class="bg-white border-b border-gray-200 sticky top-0 z-40" data-purpose="main-header">
          <div class="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <!-- Logo -->
            <div class="flex items-center gap-2 text-primary font-bold text-xl">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path>
              </svg>
              AsambleaApp
            </div>
            <!-- User Actions -->
            <div class="flex items-center gap-4">
              <span class="text-sm font-label-md text-gray-500 hidden md:block">{{ auth.user()?.email }}</span>
              <button (click)="logout()" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                </svg>
                <span class="hidden md:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Router Outlet Content -->
        <main class="flex-1 w-full p-container-margin">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AdminComponent {
  public auth = inject(AuthService);

  async logout() {
    await this.auth.signOut();
  }
}
