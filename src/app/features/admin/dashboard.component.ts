import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full animate-fade-in relative">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-section-gap gap-4">
        <div>
          <h1 class="font-headline-lg text-headline-lg text-on-background mb-2">Encuestas Recientes</h1>
          <p class="font-body-md text-body-md text-on-surface-variant">Gestiona y monitorea tus sesiones de asamblea activas y pasadas.</p>
        </div>
        <button (click)="createNew()" class="bg-primary text-on-primary px-6 py-3 rounded-full font-label-md text-label-md font-bold flex items-center gap-2 hover:bg-on-primary-fixed-variant transition-colors shadow-lg hover:shadow-xl active:scale-95 duration-200">
          <span class="material-symbols-outlined">add</span>
          Crear Encuesta
        </button>
      </div>

      <div *ngIf="isLoading()" class="flex justify-center py-12">
        <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div *ngIf="!isLoading() && assemblies().length === 0" class="text-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
        <span class="material-symbols-outlined text-6xl text-outline-variant mb-4">inbox</span>
        <h3 class="font-headline-md text-on-background mb-2">No hay asambleas</h3>
        <p class="text-on-surface-variant mb-6">Comienza creando tu primera asamblea o encuesta.</p>
        <button (click)="createNew()" class="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md transition-colors hover:bg-primary-container">
          Crear Asamblea
        </button>
      </div>

      <div *ngIf="!isLoading() && assemblies().length > 0">
        
        <!-- Bento Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-section-gap">
          <!-- Active Poll Control Card (Spans 2 cols on desktop) -->
          <div class="md:col-span-2 bg-surface-container-lowest rounded-[24px] p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0px_12px_32px_rgba(29,78,216,0.12)] transition-shadow duration-300 border border-transparent hover:border-primary border-opacity-50 cursor-pointer" (click)="goToAssembly(assemblies()[0].id)">
            <div class="flex justify-between items-start mb-6">
              <div>
                <span class="inline-block bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-md text-label-md mb-3 flex items-center gap-2 w-max">
                  <span class="material-symbols-outlined text-[16px] animate-pulse">sensors</span>
                  ÚLTIMA ASAMBLEA
                </span>
                <h2 class="font-headline-md text-headline-md text-on-background">{{ assemblies()[0].name }}</h2>
              </div>
              <button class="bg-primary-fixed text-primary px-4 py-2 rounded-lg font-label-md flex items-center gap-2 hover:bg-primary-fixed-dim transition-colors">
                Gestionar <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
            
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="bg-surface-container-low p-4 rounded-xl flex flex-col items-center justify-center">
                <span class="font-body-md text-body-md text-on-surface-variant">A Favor</span>
                <span class="font-voting-number text-voting-number text-secondary">--%</span>
              </div>
              <div class="bg-surface-container-low p-4 rounded-xl flex flex-col items-center justify-center">
                <span class="font-body-md text-body-md text-on-surface-variant">En Contra</span>
                <span class="font-voting-number text-voting-number text-error">--%</span>
              </div>
              <div class="bg-surface-container-low p-4 rounded-xl flex flex-col items-center justify-center">
                <span class="font-body-md text-body-md text-on-surface-variant">Abstención</span>
                <span class="font-voting-number text-voting-number text-outline">--%</span>
              </div>
            </div>
            <div class="w-full bg-surface-container-high rounded-full h-3 mb-2 overflow-hidden flex">
              <div class="bg-secondary h-3 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style="width: 33%"></div>
              <div class="bg-error h-3 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style="width: 33%"></div>
              <div class="bg-outline h-3 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style="width: 34%"></div>
            </div>
            <div class="flex justify-between font-label-md text-label-md text-on-surface-variant">
              <span>Creada: {{ assemblies()[0].date | date }}</span>
              <span>Clic para abrir detalles</span>
            </div>
          </div>

          <!-- Participation Chart Placeholder -->
          <div class="bg-surface-container-lowest rounded-[24px] p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col">
            <h3 class="font-label-md text-label-md text-on-surface-variant mb-4 uppercase tracking-wider">Tendencia de Participación</h3>
            <div class="flex-1 w-full bg-surface-container-low rounded-xl relative overflow-hidden flex items-end p-4 gap-2">
              <div class="w-full flex items-end justify-between gap-1 h-full pt-8">
                <div class="w-1/6 bg-primary-fixed-dim rounded-t-sm h-[30%]"></div>
                <div class="w-1/6 bg-primary-fixed-dim rounded-t-sm h-[50%]"></div>
                <div class="w-1/6 bg-primary-fixed-dim rounded-t-sm h-[40%]"></div>
                <div class="w-1/6 bg-primary-fixed-dim rounded-t-sm h-[70%]"></div>
                <div class="w-1/6 bg-primary-fixed-dim rounded-t-sm h-[60%]"></div>
                <div class="w-1/6 bg-primary rounded-t-sm h-[90%]"></div>
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between">
              <span class="font-voting-number text-voting-number text-on-background">Historial</span>
              <span class="font-label-md text-label-md text-secondary flex items-center"><span class="material-symbols-outlined text-[16px]">trending_up</span> Activo</span>
            </div>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-[24px] p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-headline-md text-headline-md text-on-background">Lista de Asambleas</h3>
            <div class="flex gap-2">
              <button (click)="exportCSV()" class="px-4 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2" title="Descargar como CSV">
                <span class="material-symbols-outlined text-[18px]">download</span> CSV
              </button>
              <button (click)="exportExcel()" class="px-4 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2" title="Descargar como Excel">
                <span class="material-symbols-outlined text-[18px]">table_chart</span> Excel
              </button>
              <button (click)="exportPDF()" class="px-4 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2" title="Descargar como PDF">
                <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span> PDF
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low border-b border-surface-variant">
                  <th class="py-3 px-4 font-label-md text-label-md text-on-surface-variant rounded-tl-lg">Nombre</th>
                  <th class="py-3 px-4 font-label-md text-label-md text-on-surface-variant">Fecha</th>
                  <th class="py-3 px-4 font-label-md text-label-md text-on-surface-variant">Estado</th>
                  <th class="py-3 px-4 font-label-md text-label-md text-on-surface-variant rounded-tr-lg">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let asm of assemblies()" class="border-b border-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer" (click)="goToAssembly(asm.id)">
                  <td class="py-4 px-4 font-body-md text-body-md text-on-background font-medium">{{ asm.name }}</td>
                  <td class="py-4 px-4 font-body-md text-body-md text-on-surface-variant">{{ asm.date | date }}</td>
                  <td class="py-4 px-4">
                    <span class="inline-block bg-surface-variant text-on-surface-variant px-2 py-1 rounded-md font-label-md text-[12px]">Registrada</span>
                  </td>
                  <td class="py-4 px-4 flex items-center justify-between gap-4">
                    <span class="font-body-md text-body-md text-primary font-medium hover:underline">Ver detalles</span>
                    <button (click)="$event.stopPropagation(); deleteAssembly(asm.id)" class="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error-container" title="Eliminar Asamblea">
                      <span class="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Modal Crear Asamblea -->
      <div *ngIf="isCreating()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/50 backdrop-blur-sm animate-fade-in">
        <div class="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-lg border border-outline-variant">
          <h3 class="font-headline-md text-headline-md text-on-background mb-2">Nueva Asamblea</h3>
          <p class="font-body-md text-on-surface-variant mb-4">Ingresa un nombre para identificar la nueva asamblea o sesión de encuestas.</p>
          
          <input type="text" [(ngModel)]="newAssemblyName" class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 mb-6 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Ej: Asamblea Ordinaria 2024" (keyup.enter)="confirmCreate()">
          
          <div class="flex justify-end gap-3">
            <button (click)="cancelCreate()" class="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
              Cancelar
            </button>
            <button (click)="confirmCreate()" class="px-4 py-2 font-label-md bg-primary text-on-primary hover:bg-primary-container rounded-lg shadow-sm transition-colors flex items-center gap-2" [disabled]="isSaving()">
              <span class="material-symbols-outlined text-[18px]">add</span>
              {{ isSaving() ? 'Creando...' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Alerta -->
      <div *ngIf="alertMsg()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/50 backdrop-blur-sm animate-fade-in">
        <div class="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-lg border border-outline-variant">
          <h3 class="font-headline-md text-headline-md text-on-background mb-2">Aviso</h3>
          <p class="font-body-md text-on-surface-variant mb-6">{{ alertMsg() }}</p>
          <div class="flex justify-end">
            <button (click)="alertMsg.set('')" class="px-4 py-2 font-label-md bg-primary text-on-primary hover:bg-primary-container rounded-lg shadow-sm transition-colors">
              Aceptar
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  private router = inject(Router);

  assemblies = signal<any[]>([]);
  isLoading = signal(true);

  // Estados del modal
  isCreating = signal(false);
  isSaving = signal(false);
  newAssemblyName = '';
  alertMsg = signal('');

  async exportCSV() {
    if (this.assemblies().length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Nombre,Fecha,Estado\n";
    
    this.assemblies().forEach(asm => {
      const id = asm.id;
      const name = asm.name.replace(/,/g, ''); 
      const date = new Date(asm.date).toLocaleDateString();
      const status = 'Registrada';
      csvContent += `${id},${name},${date},${status}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "asambleas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async exportExcel() {
    if (this.assemblies().length === 0) return;
    
    // Importación dinámica para el paquete de excel
    const XLSX = await import('xlsx');
    
    // Preparamos los datos
    const data = this.assemblies().map(asm => ({
      ID: asm.id,
      Nombre: asm.name,
      Fecha: new Date(asm.date).toLocaleDateString(),
      Estado: 'Registrada'
    }));
    
    // Creamos la hoja de cálculo y el libro
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asambleas');
    
    // Generamos y descargamos el archivo .xlsx
    XLSX.writeFile(workbook, 'asambleas.xlsx');
  }

  async exportPDF() {
    if (this.assemblies().length === 0) return;
    
    // Importación dinámica para evitar errores de SSR o carga inicial
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    doc.text('Lista de Asambleas - AsambleaApp', 14, 15);
    
    const tableData = this.assemblies().map(asm => [
      asm.name,
      new Date(asm.date).toLocaleDateString(),
      'Registrada',
      asm.id.substring(0, 8) + '...'
    ]);
    
    autoTable(doc, {
      head: [['Nombre', 'Fecha', 'Estado', 'ID Corto']],
      body: tableData,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [29, 78, 216] } // Color primario azul
    });
    
    doc.save('asambleas.pdf');
  }

  ngOnInit() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/admin/login']);
      return;
    }
    this.loadAssemblies();
  }

  async loadAssemblies() {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('assemblies')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      this.assemblies.set(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }
  }

  createNew() {
    this.newAssemblyName = '';
    this.isCreating.set(true);
  }

  cancelCreate() {
    this.isCreating.set(false);
    this.newAssemblyName = '';
  }

  async confirmCreate() {
    const name = this.newAssemblyName.trim();
    if (!name) {
      this.alertMsg.set('El nombre de la asamblea no puede estar vacío.');
      return;
    }
    
    this.isSaving.set(true);
    // Formato YYYY-MM-DD
    const date = new Date().toISOString().split('T')[0];

    try {
      const { error } = await this.supabase
        .from('assemblies')
        .insert([{ name, date, created_by: this.auth.user()?.id }]);
        
      if (error) throw error;
      this.loadAssemblies();
      this.isCreating.set(false);
    } catch (e) {
      console.error(e);
      this.alertMsg.set('Hubo un error creando la asamblea. Inténtalo de nuevo.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteAssembly(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta asamblea? Se eliminarán también todas sus preguntas y votos.')) {
      return;
    }
    this.isLoading.set(true);
    try {
      // Cascada manual para evitar errores de Foreign Key en Supabase
      // 1. Borrar preguntas, opciones y responses atadas a preguntas
      const { data: questions } = await this.supabase.from('survey_questions').select('id').eq('assembly_id', id);
      const questionIds = questions?.map(q => q.id) || [];

      if (questionIds.length > 0) {
        await this.supabase.from('responses').delete().in('question_id', questionIds);
        await this.supabase.from('votes').delete().in('question_id', questionIds);
        await this.supabase.from('survey_options').delete().in('question_id', questionIds);
        await this.supabase.from('survey_questions').delete().eq('assembly_id', id);
      }

      // 2. Borrar responses atadas a tokens por si quedó alguna
      const { data: tokensData } = await this.supabase.from('tokens').select('id').eq('assembly_id', id);
      const tokenIds = tokensData?.map(t => t.id) || [];
      if (tokenIds.length > 0) {
        await this.supabase.from('responses').delete().in('token_id', tokenIds);
        await this.supabase.from('votes').delete().in('token_id', tokenIds);
      }

      await this.supabase.from('tokens').delete().eq('assembly_id', id);

      const { error } = await this.supabase
        .from('assemblies')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      this.loadAssemblies();
    } catch (e) {
      console.error(e);
      this.alertMsg.set('Hubo un error eliminando la asamblea. Por favor verifica las dependencias.');
    } finally {
      this.isLoading.set(false);
    }
  }

  goToAssembly(id: string) {
    this.router.navigate(['/admin/assembly', id]);
  }
}
