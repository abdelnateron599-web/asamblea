import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-surface flex flex-col items-center justify-center p-6 font-body-md text-on-surface">
      <div class="bg-surface-container-lowest rounded-[32px] p-10 w-full max-w-md shadow-2xl border border-outline-variant/30 text-center flex flex-col items-center">
        
        <h1 class="font-headline-lg text-[28px] text-on-background mb-8 font-bold">Únete a la Votación</h1>
        
        <div class="bg-white p-6 rounded-3xl inline-block shadow-sm mb-8 border border-outline-variant/20">
          <img *ngIf="qrDataUrl()" [src]="qrDataUrl()" alt="QR Code" class="w-72 h-72 object-contain">
          <div *ngIf="!qrDataUrl()" class="w-72 h-72 flex items-center justify-center text-on-surface-variant skeleton-shimmer rounded-2xl">
            Cargando QR...
          </div>
        </div>
        
        <p class="text-base font-body-md text-on-surface-variant max-w-[300px] leading-relaxed mb-4">
          Abre la cámara de tu celular y escanea este código para ingresar directamente a la sala de votación.
        </p>
      </div>
      
    </div>
  `
})
export class QrViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  qrDataUrl = signal<string>('');
  assemblyId = '';

  async ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      this.assemblyId = params['assembly'];
      if (this.assemblyId) {
        await this.generateQR();
      }
    });
  }

  async generateQR() {
    const url = window.location.origin + '/login?assembly=' + this.assemblyId;
    try {
      this.qrDataUrl.set(await QRCode.toDataURL(url, {
        width: 500,
        margin: 2,
        color: {
          dark: '#001A41',
          light: '#FFFFFF'
        }
      }));
    } catch(e) {
      console.error(e);
    }
  }
}
