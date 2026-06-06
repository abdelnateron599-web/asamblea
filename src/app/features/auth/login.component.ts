import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-surface flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-surface-container-lowest p-10 rounded-2xl shadow-lg border border-outline-variant">
        <div class="text-center">
          <div class="w-16 h-16 bg-primary-fixed text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>
          <h2 class="mt-2 text-3xl font-headline-md font-bold text-on-surface">
            Panel de Administración
          </h2>
          <p class="mt-2 text-sm text-on-surface-variant font-body-md">
            Inicia sesión con tu cuenta autorizada
          </p>
        </div>
        
        <form class="mt-8 space-y-6" (ngSubmit)="login()">
          <div class="space-y-4">
            <div>
              <label for="email-address" class="block text-sm font-label-md text-on-surface-variant mb-1">Correo electrónico</label>
              <input 
                id="email-address" 
                name="email" 
                type="email" 
                autocomplete="email" 
                required 
                [(ngModel)]="email"
                class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-outline-variant bg-surface text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors" 
                placeholder="ejemplo@asamblea.com">
            </div>
            <div>
              <label for="password" class="block text-sm font-label-md text-on-surface-variant mb-1">Contraseña</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                autocomplete="current-password" 
                required 
                [(ngModel)]="password"
                class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-outline-variant bg-surface text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors" 
                placeholder="••••••••">
            </div>
          </div>

          <div *ngIf="errorMsg()" class="text-error text-sm text-center font-medium bg-error-container p-3 rounded-lg">
            {{ errorMsg() }}
          </div>

          <div>
            <button 
              type="submit" 
              [disabled]="isLoading()"
              class="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-label-md rounded-lg text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors shadow-md">
              {{ isLoading() ? 'Iniciando sesión...' : 'Entrar al Panel' }}
              <span *ngIf="!isLoading()" class="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);
  errorMsg = signal('');

  async login() {
    if (!this.email || !this.password) return;
    
    this.isLoading.set(true);
    this.errorMsg.set('');

    try {
      await this.auth.signInAdmin(this.email, this.password);
      this.router.navigate(['/admin/dashboard']);
    } catch (e: any) {
      this.errorMsg.set(e.message || 'Error al iniciar sesión');
    } finally {
      this.isLoading.set(false);
    }
  }
}
