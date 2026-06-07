import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { DataService } from '../../core/services/data.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-attendee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-surface flex flex-col items-center justify-center">
      
      <!-- LOBBY / LOGIN -->
      <div *ngIf="!tokenData()" class="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-lg p-8 mx-4">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-headline-md font-bold text-on-surface">Bienvenido</h1>
          <p class="text-on-surface-variant font-body-md mt-2">Ingresa tu código de acceso para participar</p>
        </div>
        
        <form (ngSubmit)="login()" class="space-y-6">
          <div>
            <label for="accessCode" class="block text-sm font-label-md text-on-surface-variant">Código de Acceso</label>
            <input 
              id="accessCode" 
              name="accessCode"
              type="text" 
              [(ngModel)]="accessCode"
              required 
              class="mt-1 block w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-primary focus:border-primary uppercase tracking-widest text-center text-xl text-on-surface"
              placeholder="- - -">
          </div>
          
          <div *ngIf="errorMsg()" class="text-error text-sm text-center font-medium bg-error-container p-3 rounded-lg">
            {{ errorMsg() }}
          </div>
          
          <button 
            type="submit" 
            [disabled]="isLoading()"
            class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-label-md text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors">
            {{ isLoading() ? 'Verificando...' : 'Entrar' }}
          </button>
        </form>
        
        <hr class="mt-8 border-t border-gray-200">
      </div>

      <!-- WAITING SCREEN -->
      <div *ngIf="tokenData() && (!realtime.activeQuestion() || realtime.activeQuestion()?.estado !== 'activa')" class="flex-1 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <h3 class="text-headline-lg font-bold text-on-surface">Esperando Pregunta</h3>
        <p class="text-body-lg text-on-surface-variant mt-4 max-w-md">La votación comenzará en breve.<br>Por favor, mantén esta pantalla abierta.</p>
        <button (click)="logout()" class="mt-8 text-primary font-label-md hover:underline">Cerrar Sesión</button>
      </div>

      <!-- SUCCESS SCREEN (AFTER VOTING) -->
      <div *ngIf="tokenData() && realtime.activeQuestion()?.estado === 'activa' && hasVoted()" class="flex-1 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <h3 class="text-display-lg font-bold text-on-surface">¡Voto Enviado!</h3>
        <p class="text-body-lg text-on-surface-variant mt-4 max-w-md">Ya has realizado tu voto en esta pregunta.<br>Por favor, espera la siguiente.</p>
      </div>

      <!-- VOTATION VIEW (MAIN CANVAS) -->
      <main *ngIf="tokenData() && realtime.activeQuestion()?.estado === 'activa' && !hasVoted()" class="flex-1 flex flex-col items-center justify-center p-container-margin md:p-section-gap max-w-[1200px] mx-auto w-full relative animate-fade-in">
        
        <div class="w-full max-w-[600px] mx-auto flex flex-col gap-section-gap mt-12 md:mt-0">
          <!-- Question Section -->
          <div class="text-center flex flex-col gap-stack-md">
            <span class="font-label-md text-label-md text-primary uppercase tracking-widest">Pregunta de Votación</span>
            <h1 class="font-headline-lg text-headline-lg text-on-surface md:text-[36px] text-[28px] leading-tight">
              {{ realtime.activeQuestion()?.enunciado }}
            </h1>
            <p class="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto">
              Por favor, seleccione una de las opciones a continuación y luego pulse Enviar.
            </p>
          </div>

          <!-- Voting Buttons -->
          <div class="flex flex-col gap-stack-md w-full">
            <button 
              *ngFor="let opcion of realtime.activeQuestion()?.opciones; let i = index"
              (click)="selectOption(opcion.id)"
              [disabled]="isVoting()"
              [ngClass]="getButtonClass(i, opcion.id)"
              class="w-full min-h-[80px] rounded-[15px] p-4 flex items-center justify-center border-2 outline-none transition-all duration-200">
              <span class="font-headline-md text-[24px] md:text-headline-md font-bold" [ngClass]="getTextClass(i, opcion.id)">{{ opcion.texto_opcion }}</span>
            </button>
          </div>

          <!-- Botón de Confirmación -->
          <div *ngIf="!hasVoted()" class="mt-8 flex justify-center w-full">
            <button 
              (click)="submitVote()"
              [disabled]="!selectedOptionId() || isVoting()"
              class="w-full bg-primary text-on-primary px-6 py-4 rounded-2xl font-headline-md text-[20px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-container hover:text-on-primary-container shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2">
              {{ isVoting() ? 'Enviando...' : 'Enviar Voto' }}
            </button>
          </div>
        </div>
      </main>

    </div>
  `
})
export class AttendeeComponent {
  private auth = inject(AuthService);
  public realtime = inject(RealtimeService);
  private data = inject(DataService);
  private supabase = inject(SupabaseService);

  accessCode = '';
  tokenData = signal<any>(null);
  isLoading = signal(false);
  errorMsg = signal('');

  hasVoted = signal(false);
  isVoting = signal(false);
  selectedOptionId = signal<string | null>(null);

  constructor() {
    // Intentar restaurar sesión persistente del asistente
    const savedToken = localStorage.getItem('attendee_token');
    if (savedToken) {
      try {
        const token = JSON.parse(savedToken);
        this.tokenData.set(token);
        this.realtime.subscribeToAssembly(token.assembly_id, token.id, false);
        
        // Verificar si hay una pregunta activa para comprobar si ya votó
        this.checkIfActiveQuestionVoted(token);
      } catch (e) {
        console.error('Error al restaurar token de localStorage:', e);
        localStorage.removeItem('attendee_token');
      }
    }

    // Escucha reactivamente los cambios en la pregunta activa
    effect(() => {
      const question = this.realtime.activeQuestion();
      if (question && question.estado === 'activa') {
        // Limpiamos selecciones
        this.selectedOptionId.set(null);
        // Asumimos temporalmente falso hasta verificar en la BD
        this.hasVoted.set(false);
        this.checkIfVoted(question.id);
      } else {
        // Si no hay pregunta o se cerró, limpiamos el estado
        this.hasVoted.set(false);
        this.selectedOptionId.set(null);
      }
    }, { allowSignalWrites: true });
  }

  private async checkIfActiveQuestionVoted(token: any) {
    try {
      const { data: qData } = await this.supabase.client
        .from('survey_questions')
        .select('id')
        .eq('assembly_id', token.assembly_id)
        .eq('estado', 'activa')
        .single();

      if (qData) {
        this.checkIfVoted(qData.id);
      }
    } catch (e) {
      // Ignorar si no hay pregunta activa o falla la consulta
    }
  }

  async login() {
    if (!this.accessCode.trim()) return;
    this.isLoading.set(true);
    this.errorMsg.set('');

    try {
      const token = await this.auth.signInAttendee(this.accessCode.trim().toUpperCase());

      // Validación estricta: verificar si hay una pregunta activa y si ya votó en ella ANTES de dejarlo entrar
      const { data: qData } = await this.supabase.client
        .from('survey_questions')
        .select('id')
        .eq('assembly_id', token.assembly_id)
        .eq('estado', 'activa')
        .single();

      if (qData) {
        const voted = await this.data.hasVoted(token.id, qData.id);
        if (voted) {
          throw new Error('Ya has realizado tu voto en esta pregunta, espera la siguiente.');
        }
      }

      this.tokenData.set(token);
      localStorage.setItem('attendee_token', JSON.stringify(token));
      this.realtime.subscribeToAssembly(token.assembly_id, token.id, false);

      if (qData) {
        this.checkIfVoted(qData.id);
      }

    } catch (e: any) {
      this.errorMsg.set(e.message || 'Error al validar el código');
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout() {
    await this.auth.signOut();
    this.tokenData.set(null);
    localStorage.removeItem('attendee_token');
    this.realtime.unsubscribe();
  }

  selectOption(optionId: string) {
    if (this.hasVoted() || this.isVoting()) return;
    this.selectedOptionId.set(optionId);
  }

  async submitVote() {
    if (this.hasVoted() || this.isVoting() || !this.selectedOptionId()) return;

    const question = this.realtime.activeQuestion();
    if (!question || !this.tokenData()) return;

    this.isVoting.set(true);

    try {
      await this.data.castVote(this.tokenData().id, question.id, this.selectedOptionId()!);
      this.hasVoted.set(true);
    } catch (e: any) {
      console.error(e);

      if (e.message?.includes('responses_pkey')) {
        this.hasVoted.set(true); // Ya había votado
        this.errorMsg.set('Ya has votado en esta pregunta.');
      } else {
        this.errorMsg.set('Error al registrar el voto. Intenta de nuevo.');
      }
    } finally {
      this.isVoting.set(false);
    }
  }

  private async checkIfVoted(questionId: string) {
    if (!this.tokenData()) return;
    try {
      const voted = await this.data.hasVoted(this.tokenData().id, questionId);
      this.hasVoted.set(voted);
    } catch (e) {
      console.error(e);
    }
  }

  // Helpers para clases dinámicas según la opción (0: A favor, 1: En Contra, 2+: Abstención/Otros)
  getButtonClass(index: number, optionId: string): string {
    const isSelected = this.selectedOptionId() === optionId;
    const voted = this.hasVoted();
    const hasSelection = this.selectedOptionId() !== null;

    let base = '';
    if (index === 0) base = 'bg-blue-800 border-transparent';
    else if (index === 1) base = 'bg-blue-600 border-transparent';
    else base = 'bg-blue-200 border-transparent';

    if (voted) {
      if (isSelected) {
        return `${base} ring-4 ring-primary-container opacity-100`;
      } else {
        return `${base} opacity-30 cursor-not-allowed`;
      }
    }

    if (hasSelection) {
      if (isSelected) {
        return `${base} ring-4 ring-primary-container opacity-100`;
      } else {
        return `${base} opacity-30 grayscale`;
      }
    }

    return base;
  }

  getTextClass(index: number, optionId: string): string {
    if (index === 0 || index === 1) return 'text-white';
    return 'text-blue-900';
  }
}
