import { Component, inject, OnInit, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RealtimeService } from '../../core/services/realtime.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-surface-bright mesh-bg flex flex-col font-body-md text-body-md text-on-surface antialiased overflow-hidden">
      
      <!-- Entrada de Assembly ID si no está en la URL -->
      <div *ngIf="!assemblyId()" class="flex-1 flex flex-col items-center justify-center p-8">
        <div class="bg-surface-container-lowest p-8 rounded-xl w-full max-w-md border border-outline-variant shadow-lg text-center">
          <div class="w-20 h-20 bg-primary-fixed text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="material-symbols-outlined text-4xl">cast</span>
          </div>
          <h2 class="text-2xl font-headline-md font-bold text-on-surface mb-2">Proyector de Asamblea</h2>
          <p class="text-on-surface-variant font-body-md mb-6">Ingresa el ID de la asamblea para transmitir los resultados en vivo.</p>
          <input #idInput type="text" class="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:ring-primary focus:border-primary mb-4 text-center uppercase tracking-widest" placeholder="UUID de la asamblea">
          <button (click)="loadAssembly(idInput.value)" class="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-lg font-label-md font-medium transition-colors">Conectar Display</button>
        </div>
      </div>

      <!-- Pantalla Principal -->
      <div *ngIf="assemblyId()" class="flex-1 flex flex-col h-full w-full">
        


        <!-- Estado de Espera -->
        <div *ngIf="!realtime.activeQuestion()" class="flex-1 flex flex-col items-center justify-center text-center px-section-gap slide-up-fade">
           <img *ngIf="qrCodeDataUrl()" [src]="qrCodeDataUrl()" alt="Código QR para unirse" class="w-48 h-48 md:w-64 md:h-64 rounded-2xl shadow-xl mb-8 p-4 bg-white">
           <span *ngIf="!qrCodeDataUrl()" class="material-symbols-outlined text-8xl text-outline-variant mb-8 animate-pulse">hourglass_top</span>
           <h1 class="font-display-md text-[32px] md:text-[48px] font-bold text-on-surface leading-tight">Esperando votación...</h1>
           <p class="font-body-md md:font-body-lg text-on-surface-variant mt-4 max-w-lg mx-auto">La asamblea está activa. Escanea el código para unirte o espera a que el administrador lance la siguiente pregunta.</p>
        </div>

        <!-- Pregunta Activa (Main Canvas) -->
        <main *ngIf="realtime.activeQuestion()" class="flex-1 flex flex-col justify-start items-center px-section-gap w-full max-w-[1400px] mx-auto pb-section-gap pt-12 md:pt-16 slide-up-fade">
          
          <!-- High-Contrast Question Header -->
          <div class="w-full max-w-5xl text-center mb-8">
            <span class="font-label-md text-label-md text-primary uppercase tracking-widest mb-stack-md block">Pregunta de Votación</span>
            <h1 class="font-display-lg text-display-lg text-on-surface leading-tight text-balance">
              {{ realtime.activeQuestion()?.enunciado }}
            </h1>
          </div>

          <!-- Vista durante votación activa (Centrada y masiva) -->
          <div *ngIf="realtime.activeQuestion()?.estado === 'activa'" class="w-full flex flex-col items-center justify-center animate-fade-in my-8">
            <span class="font-label-md text-[18px] text-on-surface-variant uppercase tracking-[0.2em] mb-4">Votos Emitidos</span>
            <span class="font-display-lg text-[180px] md:text-[240px] text-on-surface leading-none font-bold mb-4" style="text-shadow: 0 0 40px rgba(29, 78, 216, 0.15);">{{ displayVotes() }}</span>
            
            <div class="flex items-center gap-3">
               <span class="w-3 h-3 rounded-full bg-error pulse-indicator shadow-[0_0_8px_rgba(186,26,26,0.6)]"></span>
               <span class="font-body-lg text-body-lg text-on-surface-variant">La votación está en curso</span>
            </div>
          </div>

          <!-- Real-time Stats Box (Solo al cerrar) -->
          <div *ngIf="realtime.activeQuestion()?.estado === 'cerrada'" class="flex justify-center w-full max-w-md mx-auto mb-section-gap animate-fade-in">
            <div class="w-full bg-surface-container-lowest rounded-2xl p-stack-lg flex flex-col items-center justify-center shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-container-low relative overflow-hidden">
              <div class="absolute top-0 w-full h-1 bg-primary"></div>
              <span class="font-label-md text-label-md text-on-surface-variant mb-base">Total de Votos Registrados</span>
              <span class="font-display-lg text-display-lg text-primary">{{ displayVotes() }}</span>
            </div>
          </div>

          <!-- Massive Animated Results Visualization (Solo se muestra cuando se cierra la votación) -->
          <div *ngIf="realtime.activeQuestion()?.estado === 'cerrada'" class="w-full max-w-5xl flex flex-col gap-stack-lg animate-fade-in">
            
            <div *ngFor="let opcion of realtime.activeQuestion()?.opciones; let i = index" class="w-full group mt-stack-md">
              <div class="flex justify-between items-end mb-stack-sm px-2">
                <h2 class="font-headline-lg text-headline-lg text-on-surface flex items-center gap-stack-sm">
                  <span class="material-symbols-outlined" [ngClass]="getIconColor(i)" style="font-variation-settings: 'FILL' 1;">{{ getIconName(i) }}</span>
                  {{ opcion.texto_opcion }}
                </h2>
                <div class="text-right">
                  <span class="font-headline-lg text-headline-lg text-on-surface">{{ getOptionCount(opcion.id) }} Votos</span>
                  <span class="font-headline-md text-headline-md text-on-surface-variant ml-2">{{ getOptionPercentage(opcion.id) | number:'1.0-1' }}%</span>
                </div>
              </div>
              <div class="h-16 w-full bg-surface-variant rounded-full overflow-hidden shadow-inner">
                <div class="h-full bg-primary rounded-full progress-bar-fill" [style.width.%]="getOptionPercentage(opcion.id) || 0" [ngClass]="getOpacityClass(i)"></div>
              </div>
            </div>

          </div>
        </main>

      </div>
    </div>
  `
})
export class DisplayComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public realtime = inject(RealtimeService);

  assemblyId = signal<string | null>(null);
  displayVotes = signal<number>(0);
  qrCodeDataUrl = signal<string>('');

  constructor() {
    effect(() => {
      const target = this.realtime.totalVotes();
      untracked(() => {
        this.animateVotes(target);
      });
    });
  }

  animateVotes(target: number) {
    const start = this.displayVotes();
    const difference = target - start;
    if (difference === 0) return;

    const duration = 800; // ms
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo for a nice "rolling" deceleration
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      this.displayVotes.set(Math.floor(start + difference * easeOut));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.displayVotes.set(target); // ensure exact final value
      }
    };
    requestAnimationFrame(step);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['assembly']) {
        this.loadAssembly(params['assembly']);
      }
    });
  }

  loadAssembly(id: string) {
    if (!id.trim()) return;
    this.assemblyId.set(id.trim());
    this.realtime.subscribeToAssembly(id.trim());
    this.generateQR(id.trim());
  }

  async generateQR(id: string) {
    try {
      // Usamos el origin para asegurarnos que apunte a la misma red donde se abre el display
      const url = `${window.location.origin}/`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#001b3d', // primary color
          light: '#ffffff'
        }
      });
      this.qrCodeDataUrl.set(qrDataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  }

  getParticipationPercentage(): number {
    const totalVotes = this.realtime.totalVotes();
    const quorum = this.realtime.totalParticipants() || 1;
    if (this.realtime.totalParticipants() === 0 && totalVotes === 0) return 0;
    const perc = (totalVotes / quorum) * 100;
    return perc > 100 ? 100 : perc;
  }

  getOptionCount(optionId: string): number {
    const res = this.realtime.results().find(r => r.optionId === optionId);
    return res ? res.count : 0;
  }

  getOptionPercentage(optionId: string): number {
    const total = this.realtime.totalVotes();
    if (total === 0) return 0;
    return (this.getOptionCount(optionId) / total) * 100;
  }

  getIconName(index: number): string {
    if (index === 0) return 'check_circle';
    if (index === 1) return 'cancel';
    return 'do_not_disturb_on';
  }

  getIconColor(index: number): string {
    if (index === 0) return 'text-secondary';
    if (index === 1) return 'text-error';
    return 'text-outline';
  }

  getOpacityClass(index: number): string {
    if (index === 0 || index === 1) return '';
    return 'opacity-60';
  }
}
