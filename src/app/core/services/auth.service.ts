import { Injectable, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).client;
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  // Exponemos el usuario desde el SupabaseService
  public user = this.supabaseService.user;
  
  // Computed signal para saber si hay alguien autenticado
  public isAuthenticated = computed(() => !!this.user());

  // Iniciar sesión como administrador (Email/Password)
  async signInAdmin(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  // Cerrar sesión
  async signOut() {
    await this.supabase.auth.signOut();
    this.router.navigate(['/']);
  }

  // Iniciar sesión como Asistente (Anónimo) usando Token
  // El token real de la asamblea se validará contra la base de datos
  async signInAttendee(accessCode: string) {
    // 1. Iniciar sesión anónima en Supabase
    const { data: authData, error: authError } = await this.supabase.auth.signInAnonymously();
    if (authError) throw authError;

    // 2. Validar que el código de acceso existe
    const { data: tokenData, error: tokenError } = await this.supabase
      .from('tokens')
      .select('*, assemblies(*)')
      .eq('access_code', accessCode)
      .single();

    if (tokenError || !tokenData) {
      await this.signOut();
      throw new Error('Código de acceso inválido');
    }

    // Retornamos la info del token y asamblea para el store
    return tokenData;
  }
}
