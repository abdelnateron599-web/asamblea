import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { AuthService } from '../../core/services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-assembly-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen text-gray-800 antialiased flex flex-col animate-fade-in">
      <!-- BEGIN: Main Content Area -->
      <main class="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8" data-purpose="main-content">
        <!-- BEGIN: Assembly Header Info -->
        <div class="mb-8" data-purpose="assembly-header">
          <a class="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-2 transition-colors cursor-pointer" (click)="goBack()">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
            </svg>
            Volver
          </a>
          
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 *ngIf="assembly(); else loadingHeader" class="text-2xl font-bold text-gray-900 mb-2">{{ assembly()?.name }}</h1>
              <ng-template #loadingHeader>
                <div class="h-8 w-64 rounded-lg bg-gray-200 animate-pulse mb-2"></div>
              </ng-template>

              <div class="flex items-center gap-6 text-sm text-gray-600">
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  Asistentes en Sala: <strong class="text-gray-900 ml-1">{{ realtime.activeAttendees() }}</strong>
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  Tokens Generados: <strong class="text-gray-900 ml-1">{{ tokensCount() }}</strong>
                </span>
              </div>
            </div>
            
            <div class="flex flex-wrap items-center gap-3">
              <!-- Tool Buttons -->
              <div class="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                <button (click)="exportFormalPDF()" class="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded transition-colors flex items-center gap-1 text-sm font-medium" title="Exportar PDF">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  <span class="hidden lg:inline">PDF</span>
                </button>
                <div class="w-px h-4 bg-gray-300"></div>
                <a [href]="'/qr?assembly=' + assemblyId" target="_blank" class="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded transition-colors flex items-center gap-1 text-sm font-medium" title="Código QR">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  <span class="hidden lg:inline">QR</span>
                </a>
                <div class="w-px h-4 bg-gray-300"></div>
                <a [href]="'/display?assembly=' + assemblyId" target="_blank" class="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded transition-colors flex items-center gap-1 text-sm font-medium" title="Modo Proyector">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  <span class="hidden lg:inline">Proyector</span>
                </a>
              </div>
              
              <button *ngIf="assembly()?.estado !== 'cerrada'" (click)="closeAssembly()" class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#5E8B7E] rounded-md hover:bg-[#4b6f65] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E8B7E] shadow-sm transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                </svg>
                Finalizar Asamblea
              </button>
            </div>
          </div>
        </div>
        <!-- END: Assembly Header Info -->

        <!-- BEGIN: Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" data-purpose="dashboard-layout">
          <!-- BEGIN: Questions Management Column (Spans 2 cols on lg screens) -->
          <div class="lg:col-span-2 flex flex-col gap-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              <!-- Header -->
              <div class="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                <h2 class="text-lg font-semibold text-gray-800">Gestión de Preguntas</h2>
                <button *ngIf="!isCreatingQuestion() && assembly()?.estado !== 'cerrada'" (click)="isCreatingQuestion.set(true)" class="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  Nueva Pregunta
                </button>
              </div>

              <!-- Formulario de Creación de Pregunta -->
              <form *ngIf="isCreatingQuestion()" class="p-6 border-b border-gray-200 bg-blue-50/30">
                <div class="mb-4">
                  <h3 class="text-sm font-bold text-gray-800 mb-1">{{ editingQuestionId() ? 'Editar Pregunta' : 'Nueva Pregunta' }}</h3>
                  <p class="text-xs text-gray-500">Configura la pregunta y las opciones de respuesta.</p>
                </div>

                <div class="mb-4">
                  <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Enunciado de la Pregunta</label>
                  <textarea [(ngModel)]="newQuestionEnunciado" name="enunciado" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-200" placeholder="Ej: ¿Aprueba usted el presupuesto 2024?" rows="2"></textarea>
                </div>

                <div class="mb-6">
                  <label class="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Opciones de Votación</label>
                  <div class="space-y-2">
                    <div *ngFor="let opt of newQuestionOptions(); let i = index; trackBy: trackByIndex" class="flex items-center gap-2 group">
                      <span class="material-symbols-outlined text-gray-400 text-sm cursor-grab">drag_indicator</span>
                      <input [ngModel]="newQuestionOptions()[i]" (ngModelChange)="updateOption(i, $event)" name="opt{{i}}" class="flex-grow bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Texto de la opción" type="text" />
                      <button (click)="removeOption(i)" class="text-gray-400 hover:text-red-500 transition-colors p-1" type="button" *ngIf="newQuestionOptions().length > 2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  </div>
                  
                  <button (click)="addOption()" class="mt-3 text-xs font-medium text-primary hover:text-blue-700 transition-colors flex items-center gap-1" type="button">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Añadir otra opción
                  </button>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button (click)="cancelCreateQuestion()" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors" type="button">
                    Cancelar
                  </button>
                  <button (click)="saveNewQuestion()" class="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2" type="button" [disabled]="isSavingQuestion()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    {{ isSavingQuestion() ? 'Guardando...' : (editingQuestionId() ? 'Guardar Cambios' : 'Publicar Pregunta') }}
                  </button>
                </div>
              </form>

              <!-- Skeleton loading -->
              <div *ngIf="!assembly()" class="p-6 space-y-4">
                 <div *ngFor="let i of skeletonItems" class="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
              </div>

              <!-- Empty state -->
              <div *ngIf="assembly() && !isCreatingQuestion() && questions().length === 0" class="text-center py-12">
                <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p class="text-sm text-gray-500">No hay preguntas creadas.</p>
              </div>

              <!-- Questions List -->
              <div class="p-6 flex flex-col gap-4">
                <div *ngFor="let q of questions()" class="group border border-gray-200 rounded-lg p-5 hover:border-gray-300 hover:shadow-md transition-all relative" [ngClass]="{'bg-white': q.estado !== 'cerrada', 'bg-gray-50 opacity-75': q.estado === 'cerrada'}">
                  <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div class="flex-grow">
                      <div class="flex items-center gap-2 mb-2">
                        
                        <!-- Badges según estado -->
                        <span *ngIf="q.estado === 'activa'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                          EN VOTACIÓN
                        </span>
                        <span *ngIf="q.estado === 'creada'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          CREADA
                        </span>
                        <span *ngIf="q.estado === 'cerrada'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          CERRADA
                        </span>

                        <span *ngIf="q.estado === 'activa'" class="relative flex h-2.5 w-2.5">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>

                        <span class="text-xs text-gray-400 ml-2">Orden: {{ q.orden }}</span>
                      </div>
                      
                      <h3 class="text-base font-semibold text-gray-900 mb-1">{{ q.enunciado }}</h3>
                      <p class="text-sm text-gray-500">{{ q.survey_options?.length || 0 }} Opciones</p>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 sm:self-center shrink-0">
                      
                      <button *ngIf="q.estado === 'creada'" (click)="activateQuestion(q.id)" class="inline-flex flex-col items-center justify-center p-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors w-20">
                        <svg class="w-4 h-4 mb-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Activar
                      </button>

                      <button *ngIf="q.estado === 'activa'" (click)="closeQuestion(q.id)" class="inline-flex flex-col items-center justify-center p-2 text-xs font-medium text-gray-700 bg-blue-50/50 hover:bg-blue-100 rounded-md border border-blue-100 transition-colors w-24">
                        <svg class="w-4 h-4 mb-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>
                        Cerrar Votación
                      </button>

                      <button *ngIf="q.estado === 'creada'" (click)="editQuestion(q)" class="inline-flex flex-col items-center justify-center p-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors w-16" title="Editar">
                        <svg class="w-4 h-4 mb-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Editar
                      </button>

                      <button *ngIf="q.estado === 'creada' || q.estado === 'cerrada'" (click)="deleteQuestion(q.id)" class="inline-flex flex-col items-center justify-center p-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-100 transition-colors w-16" title="Eliminar">
                        <svg class="w-4 h-4 mb-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Eliminar
                      </button>

                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <!-- END: Questions Management Column -->

          <!-- BEGIN: Access & Tools Column -->
          <div class="flex flex-col gap-6">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Accesos y Asistentes</h2>
              
              <div class="bg-blue-50/50 rounded-lg p-5 text-center mb-6 border border-blue-100">
                <h3 class="text-lg font-medium text-blue-900 mb-1">Panel de Control de Accesos</h3>
                <p class="text-sm text-blue-700/80">Gestiona los tokens de entrada a la asamblea.</p>
              </div>
              
              <div class="flex flex-col gap-3">
                <button *ngIf="assembly()?.estado !== 'cerrada'" (click)="generateTokens()" class="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100/80 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                  Generar Tokens
                </button>
                <button *ngIf="assembly()?.estado !== 'cerrada'" (click)="importTokens()" class="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100/80 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Importar Tokens
                </button>
                <button (click)="loadTokensList()" class="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100/80 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                  Ver Lista Completa de Tokens
                </button>
                <hr class="my-2 border-gray-100" *ngIf="tokensCount() > 0 && assembly()?.estado !== 'cerrada'"/>
                <button *ngIf="tokensCount() > 0 && assembly()?.estado !== 'cerrada'" (click)="deleteAllTokens()" class="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100">
                  <svg class="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Eliminar Todos los Tokens
                </button>
              </div>
              
              <p class="text-xs text-center text-gray-500 mt-6">
                Los asistentes usan estos códigos para acceder de forma anónima.
              </p>
            </div>
          </div>
          <!-- END: Access & Tools Column -->
        </div>
        <!-- END: Dashboard Grid -->

        <!-- Modal Genérico (Confirmaciones y Alertas) -->
        <div *ngIf="modal.isVisible()" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ modal.title() }}</h3>
            <p class="text-sm text-gray-600 mb-6">{{ modal.message() }}</p>
            <div class="flex justify-end gap-3">
              <button *ngIf="modal.type() === 'confirm'" (click)="modal.close()" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button (click)="modal.confirm()" [ngClass]="modal.isDanger() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-white hover:bg-blue-700'" class="px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors">
                {{ modal.confirmText() }}
              </button>
            </div>
          </div>
        </div>

        <!-- Modal de Tokens (Generar, Ver e Importar) -->
        <div *ngIf="tokenModal.isVisible()" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              {{ tokenModal.mode() === 'generate' ? 'Generar Tokens' : (tokenModal.mode() === 'import' ? 'Importar Tokens' : 'Lista de Tokens') }}
            </h3>
            
            <div *ngIf="tokenModal.mode() === 'generate'">
              <p class="text-sm text-gray-600 mb-4">¿Cuántos tokens de acceso únicos deseas generar automáticamente?</p>
              <input type="number" [(ngModel)]="tokenAmount" class="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-6 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Ej: 50" min="1" max="1000">
            </div>

            <div *ngIf="tokenModal.mode() === 'import'">
              <p class="text-sm text-gray-600 mb-2">Pega tu lista de tokens (uno por línea). También puedes copiar y pegar desde una columna de Excel.</p>
              <textarea [(ngModel)]="tokenImportText" rows="6" class="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-4 font-mono text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none" placeholder="TOKEN1&#10;TOKEN2&#10;TOKEN3"></textarea>
            </div>

            <div *ngIf="tokenModal.mode() === 'view'">
              <p class="text-sm text-gray-600 mb-4">Códigos generados para acceso:</p>
              <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span *ngFor="let token of tokensArray()" class="font-mono text-xs font-bold bg-white text-gray-800 px-2 py-1.5 rounded-md text-center border border-gray-300 shadow-sm">
                  {{ token }}
                </span>
              </div>
            </div>

            <div class="flex justify-end gap-3">
              <button (click)="tokenModal.close()" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cerrar
              </button>
              <button *ngIf="tokenModal.mode() === 'generate'" (click)="generateTokensConfirm()" class="px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-colors">
                Generar
              </button>
              <button *ngIf="tokenModal.mode() === 'import'" (click)="importTokensConfirm()" class="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                Guardar Tokens
              </button>
              <button *ngIf="tokenModal.mode() === 'view'" (click)="exportTokensExcel()" class="px-4 py-2 text-sm font-medium border border-gray-300 text-primary hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Excel
              </button>
              <button *ngIf="tokenModal.mode() === 'view'" (click)="copyTokens()" class="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Copiar
              </button>
            </div>
          </div>
        </div>

      </main>
      <!-- END: Main Content Area -->
    </div>
  `
})
export class AssemblyDetailComponent implements OnInit {
  private supabase = inject(SupabaseService).client;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public realtime = inject(RealtimeService);
  private auth = inject(AuthService);

  assemblyId = '';
  assembly = signal<any>(null);
  questions = signal<any[]>([]);
  tokensCount = signal<number>(0);

  ngOnInit() {
    this.assemblyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.assemblyId) {
      this.loadAssemblyDetails();
      this.loadQuestions();
      this.countTokens();
      this.realtime.subscribeToAssembly(this.assemblyId);
    }
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  async loadAssemblyDetails() {
    const { data } = await this.supabase
      .from('assemblies')
      .select('*')
      .eq('id', this.assemblyId)
      .single();
    this.assembly.set(data);
  }

  async loadQuestions() {
    const { data } = await this.supabase
      .from('survey_questions')
      .select('*, survey_options(*)')
      .eq('assembly_id', this.assemblyId)
      .order('orden', { ascending: true });
    this.questions.set(data || []);
  }

  async countTokens() {
    const { count } = await this.supabase
      .from('tokens')
      .select('*', { count: 'exact', head: true })
      .eq('assembly_id', this.assemblyId);
    this.tokensCount.set(count || 0);
  }

  isCreatingQuestion = signal<boolean>(false);
  isSavingQuestion = signal<boolean>(false);
  editingQuestionId = signal<string | null>(null);
  newQuestionEnunciado = '';
  newQuestionOptions = signal<string[]>(['A Favor', 'En Contra', 'Abstención']);

  trackByIndex(index: number): number {
    return index;
  }

  editQuestion(q: any) {
    this.editingQuestionId.set(q.id);
    this.newQuestionEnunciado = q.enunciado;
    this.newQuestionOptions.set(q.survey_options.map((opt: any) => opt.texto_opcion));
    this.isCreatingQuestion.set(true);
  }

  cancelCreateQuestion() {
    this.isCreatingQuestion.set(false);
    this.editingQuestionId.set(null);
    this.newQuestionEnunciado = '';
    this.newQuestionOptions.set(['A Favor', 'En Contra', 'Abstención']);
  }

  updateOption(index: number, value: string) {
    const opts = [...this.newQuestionOptions()];
    opts[index] = value;
    this.newQuestionOptions.set(opts);
  }

  addOption() {
    const opts = [...this.newQuestionOptions()];
    opts.push('');
    this.newQuestionOptions.set(opts);
  }

  removeOption(index: number) {
    const opts = [...this.newQuestionOptions()];
    if (opts.length > 2) {
      opts.splice(index, 1);
      this.newQuestionOptions.set(opts);
    }
  }

  // --- Sistema de Modales ---
  modal = {
    isVisible: signal(false),
    title: signal(''),
    message: signal(''),
    type: signal<'alert' | 'confirm'>('alert'),
    isDanger: signal(false),
    confirmText: signal('Aceptar'),
    onConfirm: () => {},
    
    showAlert: (title: string, message: string) => {
      this.modal.title.set(title);
      this.modal.message.set(message);
      this.modal.type.set('alert');
      this.modal.isDanger.set(false);
      this.modal.confirmText.set('Aceptar');
      this.modal.onConfirm = () => this.modal.close();
      this.modal.isVisible.set(true);
    },
    
    showConfirm: (title: string, message: string, confirmText: string, isDanger: boolean, onConfirm: () => void) => {
      this.modal.title.set(title);
      this.modal.message.set(message);
      this.modal.type.set('confirm');
      this.modal.isDanger.set(isDanger);
      this.modal.confirmText.set(confirmText);
      this.modal.onConfirm = onConfirm;
      this.modal.isVisible.set(true);
    },

    close: () => {
      this.modal.isVisible.set(false);
    },

    confirm: () => {
      this.modal.onConfirm();
      this.modal.close();
    }
  };

  tokenAmount = 50;
  tokenImportText = '';
  tokensArray = signal<string[]>([]);
  tokenList = signal<string>('');
  tokenModal = {
    isVisible: signal(false),
    mode: signal<'generate'|'view'|'import'>('generate'),
    close: () => this.tokenModal.isVisible.set(false)
  };
  skeletonItems = [1, 2];

  async saveNewQuestion() {
    if (!this.newQuestionEnunciado.trim()) {
      this.modal.showAlert('Datos incompletos', 'Debes escribir el enunciado de la pregunta');
      return;
    }
    
    const validOptions = this.newQuestionOptions().map(o => o.trim()).filter(o => o);
    if (validOptions.length < 2) {
      this.modal.showAlert('Datos incompletos', 'Debes proveer al menos 2 opciones válidas');
      return;
    }

    this.isSavingQuestion.set(true);

    try {
      if (this.editingQuestionId()) {
        // UPDATE Existing Question
        const { error: qError } = await this.supabase
          .from('survey_questions')
          .update({ enunciado: this.newQuestionEnunciado.trim() })
          .eq('id', this.editingQuestionId());
        if (qError) throw qError;

        await this.supabase.from('survey_options').delete().eq('question_id', this.editingQuestionId());
        
        const optionsToInsert = validOptions.map(opt => ({
          question_id: this.editingQuestionId(),
          texto_opcion: opt
        }));
        const { error: optError } = await this.supabase.from('survey_options').insert(optionsToInsert);
        if (optError) throw optError;
      } else {
        // INSERT New Question
        const { data: qData, error: qError } = await this.supabase
          .from('survey_questions')
          .insert([{ 
            assembly_id: this.assemblyId, 
            enunciado: this.newQuestionEnunciado.trim(), 
            orden: this.questions().length + 1 
          }])
          .select()
          .single();
        if (qError) throw qError;

        const optionsToInsert = validOptions.map(opt => ({
          question_id: qData.id,
          texto_opcion: opt
        }));
        
        const { error: optError } = await this.supabase
          .from('survey_options')
          .insert(optionsToInsert);
        if (optError) throw optError;
      }

      this.loadQuestions();
      this.cancelCreateQuestion();

    } catch(e: any) {
      console.error('Error detallado:', e);
      let errorMsg = e?.message || JSON.stringify(e);
      if (errorMsg.includes('survey_options')) {
        errorMsg = 'No tienes permisos para guardar las opciones (revisa RLS en survey_options).';
      } else if (errorMsg.includes('JSON')) {
        errorMsg = 'Error desconocido. Revisa la consola.';
      }
      this.modal.showAlert('Error', 'Detalle del error: ' + errorMsg);
    } finally {
      this.isSavingQuestion.set(false);
    }
  }

  activateQuestion(questionId: string) {
    this.modal.showConfirm(
      'Activar Votación', 
      'Esto activará la pregunta para todos los asistentes. ¿Deseas continuar?', 
      'Sí, Activar', 
      false, 
      async () => {
        try {
          const { error: err1 } = await this.supabase
            .from('survey_questions')
            .update({ estado: 'cerrada' })
            .eq('assembly_id', this.assemblyId)
            .eq('estado', 'activa');
          
          if (err1) throw err1;

          const { data, error: err2 } = await this.supabase
            .from('survey_questions')
            .update({ estado: 'activa' })
            .eq('id', questionId)
            .select();

          if (err2) throw err2;
          if (!data || data.length === 0) {
            throw new Error('La base de datos rechazó la activación (verifica los permisos RLS).');
          }

          this.loadQuestions();
        } catch(e: any) {
          console.error(e);
          this.modal.showAlert('Error', e?.message || 'No se pudo activar la pregunta.');
        }
      }
    );
  }



  closeQuestion(questionId: string) {
    this.modal.showConfirm(
      'Cerrar Votación', 
      'Esto cerrará la votación de forma definitiva y nadie más podrá votar en esta pregunta. ¿Deseas continuar?', 
      'Cerrar Votación', 
      true, 
      async () => {
        try {
          const { data, error } = await this.supabase
            .from('survey_questions')
            .update({ estado: 'cerrada' })
            .eq('id', questionId)
            .select();
            
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error('La base de datos rechazó el cambio (verifica los permisos RLS).');
          }
          
          this.loadQuestions();
        } catch(e: any) {
          console.error(e);
          this.modal.showAlert('Error', e?.message || 'No se pudo cerrar la pregunta.');
        }
      }
    );
  }

  closeAssembly() {
    this.modal.showConfirm(
      'Finalizar Asamblea',
      '¿Estás seguro de que deseas finalizar la asamblea? No se podrán abrir más preguntas ni podrán ingresar nuevos asistentes.',
      'Sí, Finalizar',
      true,
      async () => {
        try {
          const { error } = await this.supabase
            .from('assemblies')
            .update({ estado: 'cerrada' })
            .eq('id', this.assemblyId);
            
          if (error) throw error;
          this.loadAssemblyDetails();
          this.modal.showAlert('Éxito', 'La asamblea ha sido finalizada.');
        } catch(e: any) {
          console.error(e);
          this.modal.showAlert('Error', e?.message || 'No se pudo finalizar la asamblea.');
        }
      }
    );
  }

  deleteQuestion(questionId: string) {
    this.modal.showConfirm(
      'Eliminar Pregunta', 
      '¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer y eliminará las opciones y votos asociados.', 
      'Sí, Eliminar', 
      true, 
      async () => {
        try {
          // 1. Borramos las respuestas/votos primero para evitar errores de Foreign Key (Constraint)
          await this.supabase.from('responses').delete().eq('question_id', questionId);
          await this.supabase.from('votes').delete().eq('question_id', questionId);
          
          // 2. Borramos las opciones
          await this.supabase.from('survey_options').delete().eq('question_id', questionId);
          
          // 3. Finalmente borramos la pregunta
          const { error } = await this.supabase
            .from('survey_questions')
            .delete()
            .eq('id', questionId);
            
          if (error) throw error;
          
          this.loadQuestions();
          this.modal.showAlert('Éxito', 'La pregunta fue eliminada correctamente.');
        } catch(e: any) {
          console.error(e);
          this.modal.showAlert('Error', e?.message || 'No se pudo eliminar la pregunta.');
        }
      }
    );
  }

  importTokens() {
    this.tokenImportText = '';
    this.tokenModal.mode.set('import');
    this.tokenModal.isVisible.set(true);
  }

  async importTokensConfirm() {
    if (!this.tokenImportText.trim()) {
      this.modal.showAlert('Error', 'Por favor, ingresa al menos un token.');
      return;
    }

    try {
      const rawLines = this.tokenImportText.split('\n');
      const importedTokens = [...new Set(rawLines.map(t => t.trim().toUpperCase()).filter(t => t.length > 0))];

      if (importedTokens.length === 0) {
        this.modal.showAlert('Error', 'No se encontraron tokens válidos para importar.');
        return;
      }

      const generatedCodes = new Set<string>();
      
      const { data: existingTokens } = await this.supabase
        .from('tokens')
        .select('access_code')
        .eq('assembly_id', this.assemblyId);
        
      if (existingTokens) {
        existingTokens.forEach(t => generatedCodes.add(t.access_code));
      }

      const newTokens = importedTokens
        .filter(code => !generatedCodes.has(code))
        .map(code => ({
          assembly_id: this.assemblyId,
          access_code: code
        }));

      if (newTokens.length === 0) {
        this.modal.showAlert('Aviso', 'Todos los tokens ingresados ya existían en la asamblea.');
        this.tokenModal.close();
        return;
      }

      const { error } = await this.supabase.from('tokens').insert(newTokens);
      if (error) throw error;
      
      this.countTokens();
      this.tokenModal.close();
      this.modal.showAlert('Éxito', `Se importaron ${newTokens.length} tokens correctamente.`);
    } catch(e: any) {
      console.error(e);
      this.modal.showAlert('Error', 'Hubo un error importando tokens: ' + (e.message || 'Error desconocido.'));
    }
  }

  generateTokens() {
    this.tokenAmount = 50; // valor por defecto
    this.tokenModal.mode.set('generate');
    this.tokenModal.isVisible.set(true);
  }

  async generateTokensConfirm() {
    const qty = this.tokenAmount;
    if (!qty || isNaN(qty) || qty <= 0 || qty > 1000) {
      this.modal.showAlert('Cantidad Inválida', 'Ingresa un número válido entre 1 y 1000');
      return;
    }

    try {
      const newTokens = [];
      const generatedCodes = new Set<string>();
      
      // Obtenemos los tokens que ya existen para no duplicarlos
      const { data: existingTokens } = await this.supabase
        .from('tokens')
        .select('access_code')
        .eq('assembly_id', this.assemblyId);
        
      if (existingTokens) {
        existingTokens.forEach(t => generatedCodes.add(t.access_code));
      }

      // Generar códigos de 3 caracteres (números y letras)
      while (newTokens.length < qty) {
        // Cortamos a 3 caracteres
        const code = Math.random().toString(36).substring(2, 5).toUpperCase();
        if (!generatedCodes.has(code)) {
          generatedCodes.add(code);
          newTokens.push({
            assembly_id: this.assemblyId,
            access_code: code
          });
        }
      }

      const { error } = await this.supabase.from('tokens').insert(newTokens);
      if (error) throw error;
      
      this.countTokens();
      this.tokenModal.close();
      this.modal.showAlert('Éxito', `Se generaron ${qty} tokens correctamente.`);
    } catch(e: any) {
      console.error(e);
      this.modal.showAlert('Error', 'Hubo un error generando tokens: ' + (e.message || 'Error desconocido.'));
    }
  }

  async loadTokensList() {
    const { data } = await this.supabase
      .from('tokens')
      .select('access_code')
      .eq('assembly_id', this.assemblyId);
      
    if (data) {
      const arr = data.map(t => t.access_code);
      this.tokensArray.set(arr);
      this.tokenList.set(arr.join('\n'));
      this.tokenModal.mode.set('view');
      this.tokenModal.isVisible.set(true);
    }
  }

  async exportTokensExcel() {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      const tokensData = this.tokensArray().map(t => ({ 'Token de Acceso': t }));
      
      const wsTokens = XLSX.utils.json_to_sheet(tokensData.length ? tokensData : [{ Info: 'No hay tokens' }]);
      XLSX.utils.book_append_sheet(workbook, wsTokens, 'Tokens Generados');
      
      const fileName = `Tokens_${this.assembly()?.name?.replace(/[^a-z0-9]/gi, '_') || 'Asamblea'}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch(e) {
      console.error(e);
      this.modal.showAlert('Error', 'No se pudo generar el Excel de tokens.');
    }
  }
  


  async copyTokens() {
    try {
      await navigator.clipboard.writeText(this.tokenList());
      this.modal.showAlert('Copiado', 'Los tokens han sido copiados al portapapeles.');
    } catch(e) {
      this.modal.showAlert('Error', 'No se pudo copiar automáticamente. Por favor, selecciona y copia el texto manualmente.');
    }
  }

  deleteAllTokens() {
    this.modal.showConfirm(
      'Eliminar Todos los Tokens',
      '¿Estás seguro de que deseas eliminar TODOS los tokens generados para esta asamblea? Los usuarios que no hayan votado ya no podrán ingresar, y los votos registrados serán eliminados.',
      'Eliminar Tokens',
      true,
      async () => {
        try {
          // 1. Borrar todas las respuestas de esta asamblea para evitar conflictos de llave foránea
          // Primero por las preguntas
          const { data: questions } = await this.supabase.from('survey_questions').select('id').eq('assembly_id', this.assemblyId);
          const questionIds = questions?.map(q => q.id) || [];
          if (questionIds.length > 0) {
            await this.supabase.from('responses').delete().in('question_id', questionIds);
            await this.supabase.from('votes').delete().in('question_id', questionIds);
          }

          // Luego por los tokens para estar 100% seguros
          const { data: tokensData } = await this.supabase.from('tokens').select('id').eq('assembly_id', this.assemblyId);
          const tokenIds = tokensData?.map(t => t.id) || [];
          if (tokenIds.length > 0) {
            const { error: rError } = await this.supabase.from('responses').delete().in('token_id', tokenIds);
            if (rError) throw rError;
            // Los votos son anónimos, no tienen token_id, no se borran por token.
          }

          // 2. Borrar los tokens
          const { error } = await this.supabase
            .from('tokens')
            .delete()
            .eq('assembly_id', this.assemblyId);
            
          if (error) throw error;
          this.countTokens();
          this.modal.showAlert('Éxito', 'Todos los tokens han sido eliminados.');
        } catch (e) {
          console.error(e);
          this.modal.showAlert('Error', 'Hubo un error al eliminar los tokens. Verifica las dependencias.');
        }
      }
    );
  }

  async exportDetailedExcel() {
    try {
      this.modal.showAlert('Exportando', 'Generando reporte detallado...');
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      // 1. Hoja de Detalles y Resultados de Preguntas
      const questionsData: any[] = [];
      for (const q of this.questions()) {
        // Obtener votos para esta pregunta
        const { data: votes } = await this.supabase
          .from('votes')
          .select('option_id')
          .eq('question_id', q.id);
          
        const voteCounts = (votes || []).reduce((acc: any, v: any) => {
          acc[v.option_id] = (acc[v.option_id] || 0) + 1;
          return acc;
        }, {});

        const totalVotes = votes ? votes.length : 0;

        q.survey_options?.forEach((opt: any) => {
          const count = voteCounts[opt.id] || 0;
          const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) + '%' : '0%';
          
          questionsData.push({
            'ID Pregunta': q.orden,
            'Enunciado': q.enunciado,
            'Estado': q.estado,
            'Opción': opt.texto_opcion,
            'Votos': count,
            'Porcentaje': percentage
          });
        });
      }
      
      const wsQuestions = XLSX.utils.json_to_sheet(questionsData.length ? questionsData : [{ Info: 'No hay preguntas' }]);
      XLSX.utils.book_append_sheet(workbook, wsQuestions, 'Resultados Votación');

      // 2. Hoja de Tokens (Votantes)
      const { data: tokens } = await this.supabase
        .from('tokens')
        .select('access_code, created_at')
        .eq('assembly_id', this.assemblyId)
        .order('created_at', { ascending: true });

      const tokensData = (tokens || []).map(t => ({
        'Token de Acceso': t.access_code,
        'Fecha de Generación': new Date(t.created_at).toLocaleString()
      }));

      const wsTokens = XLSX.utils.json_to_sheet(tokensData.length ? tokensData : [{ Info: 'No hay tokens generados' }]);
      XLSX.utils.book_append_sheet(workbook, wsTokens, 'Tokens Generados');

      // Descargar
      const fileName = `Reporte_${this.assembly()?.name?.replace(/[^a-z0-9]/gi, '_') || 'Asamblea'}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      this.modal.close();
    } catch (e: any) {
      console.error(e);
      this.modal.showAlert('Error', 'No se pudo generar el reporte Excel: ' + (e?.message || 'Error desconocido'));
    }
  }

  async exportFormalPDF() {
    try {
      this.modal.showAlert('Exportando', 'Generando Acta en PDF...');
      const doc = new jsPDF();
      
      const assemblyName = this.assembly()?.name || 'Asamblea General';
      const dateNow = new Date();
      const dateStr = dateNow.toLocaleDateString();
      const timeStr = dateNow.toLocaleTimeString();
      const totalTokens = this.tokensCount() || 0;
      
      // Función auxiliar para texto centrado
      const centerText = (text: string, y: number) => {
        const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
        const textOffset = (doc.internal.pageSize.width - textWidth) / 2;
        doc.text(text, textOffset, y);
      };

      // 1. ENCABEZADO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      centerText('ACTA DE RESULTADOS DE VOTACIÓN', 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Organización: ${assemblyName}`, 14, 35);
      doc.text(`Lugar: Plataforma Digital (Sistema de Votación)`, 14, 42);
      doc.text(`Fecha: ${dateStr}`, 14, 49);
      doc.text(`Hora de emisión: ${timeStr}`, 14, 56);
      
      doc.line(14, 60, 196, 60);

      // 2. INFORMACIÓN GENERAL
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN GENERAL', 14, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de personas habilitadas para votar: ${totalTokens}`, 14, 78);
      doc.text(`Método de votación: Presencial mediante plataforma digital`, 14, 85);
      
      let startY = 100;
      
      for (const q of this.questions()) {
        if (startY > 230) {
          doc.addPage();
          startY = 20;
        }

        const { data: votes } = await this.supabase
          .from('votes')
          .select('option_id')
          .eq('question_id', q.id);
          
        const voteCounts = (votes || []).reduce((acc: any, v: any) => {
          acc[v.option_id] = (acc[v.option_id] || 0) + 1;
          return acc;
        }, {});
        
        const totalVotes = votes ? votes.length : 0;
        
        // 3. PROPUESTA SOMETIDA A VOTACIÓN
        doc.setFont('helvetica', 'bold');
        doc.text(`Pregunta #${q.orden}:`, 14, startY);
        doc.setFont('helvetica', 'normal');
        
        const splitTitle = doc.splitTextToSize(`"${q.enunciado}"`, 180);
        doc.text(splitTitle, 14, startY + 7);
        startY += (splitTitle.length * 7) + 8;
        
        doc.text(`Total de asistentes que votaron: ${totalVotes}`, 14, startY);
        startY += 8;

        // Determinar Resultado Oficial
        let maxVotes = -1;
        let winners: any[] = [];
        const tableBody = q.survey_options?.map((opt: any) => {
          const count = voteCounts[opt.id] || 0;
          const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) + '%' : '0%';
          
          if (count > maxVotes) {
            maxVotes = count;
            winners = [opt];
          } else if (count === maxVotes) {
            winners.push(opt);
          }

          return [opt.texto_opcion, count.toString(), percentage];
        }) || [];

        let resultadoOficial = "SIN VOTOS";
        if (totalVotes > 0) {
          if (winners.length > 1) {
            resultadoOficial = "EMPATADA";
          } else {
            const winnerText = winners[0].texto_opcion.toUpperCase();
            if (winnerText.includes('FAVOR') || winnerText.includes('SI')) {
              resultadoOficial = "APROBADA";
            } else if (winnerText.includes('CONTRA') || winnerText.includes('NO')) {
              resultadoOficial = "RECHAZADA";
            } else {
              resultadoOficial = `MAYORÍA: ${winnerText}`;
            }
          }
        }
        
        // 4. RESULTADOS DE LA VOTACIÓN (Tabla)
        autoTable(doc, {
          startY: startY,
          head: [['Opción', 'Cantidad de Votos', 'Porcentaje']],
          body: tableBody,
          theme: 'grid',
          headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 3 }
        });
        
        startY = (doc as any).lastAutoTable.finalY + 10;
        
        // 5. RESULTADO OFICIAL
        doc.setFillColor(240, 240, 240);
        doc.rect(14, startY, 182, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text(`Resultado Oficial: ${resultadoOficial}`, 18, startY + 7);
        
        startY += 25;
      }
      
      if (startY > 240) {
        doc.addPage();
        startY = 20;
      }

      // 6. CERTIFICACIÓN DE RESULTADOS
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICACIÓN DE RESULTADOS', 14, startY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const certText = "Se certifica que los resultados consignados en el presente documento corresponden a los registros obtenidos a través de la plataforma digital de votación utilizada durante la sesión presencial, reflejando fielmente la voluntad expresada por los participantes habilitados para votar.";
      const splitCert = doc.splitTextToSize(certText, 180);
      doc.text(splitCert, 14, startY + 7);
      
      startY += (splitCert.length * 6) + 15;

      // 7. INFORMACIÓN DE GENERACIÓN
      doc.setFontSize(9);
      doc.setTextColor(100);
      const uuidStr = crypto.randomUUID ? crypto.randomUUID().split('-')[0].toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase();
      doc.text(`Código único del acta: ACTA-${uuidStr}-${dateNow.getTime().toString().slice(-6)}`, 14, startY);
      doc.text(`Fecha y hora de generación: ${dateStr} ${timeStr}`, 14, startY + 5);
      doc.text(`Estado: Emitida automáticamente por el Sistema de Votación`, 14, startY + 10);
      
      doc.save(`Acta_Resultados_${assemblyName.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      this.modal.close();
    } catch (e: any) {
      console.error(e);
      this.modal.showAlert('Error', 'No se pudo generar el PDF: ' + (e?.message || 'Error desconocido'));
    }
  }
}
