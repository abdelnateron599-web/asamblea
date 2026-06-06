import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ActiveQuestion {
  id: string;
  enunciado: string;
  opciones: any[];
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService implements OnDestroy {
  private supabase = inject(SupabaseService).client;
  private channel: RealtimeChannel | null = null;

  // Señales reactivas que la UI consumirá
  public activeQuestion = signal<ActiveQuestion | null>(null);
  public results = signal<any[]>([]);
  public totalVotes = signal<number>(0);
  public totalParticipants = signal<number>(0);
  
  // Presence: Quórum en tiempo real
  public activeAttendees = signal<number>(0);
  public onlineTokens = signal<string[]>([]);

  // Escuchar a una asamblea en particular
  subscribeToAssembly(assemblyId: string, tokenId?: string) {
    this.unsubscribe(); // Limpiar previa suscripción

    this.channel = this.supabase.channel(`assembly-${assemblyId}`)
      // Escuchar cambios en la pregunta activa
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'survey_questions', filter: `assembly_id=eq.${assemblyId}` },
        (payload) => {
          this.handleQuestionChange(payload);
        }
      )
      // Escuchar nuevos votos anónimos en vivo
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          this.handleNewVote(payload);
        }
      )
      // Escuchar nuevos tokens (participantes) en vivo
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tokens', filter: `assembly_id=eq.${assemblyId}` },
        (payload) => {
          this.totalParticipants.update(v => v + 1);
        }
      )
      // Escuchar Presence (Usuarios conectados)
      .on('presence', { event: 'sync' }, () => {
        if (!this.channel) return;
        const state = this.channel.presenceState();
        const users = new Set<string>();
        for (const id in state) {
          state[id].forEach((pres: any) => {
            if (pres.user_id) users.add(pres.user_id);
          });
        }
        this.activeAttendees.set(users.size);
        this.onlineTokens.set(Array.from(users));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && tokenId && this.channel) {
          await this.channel.track({ user_id: tokenId });
        }
      });
      
    // Carga inicial
    this.loadInitialData(assemblyId);
  }

  private async loadInitialData(assemblyId: string) {
    // Buscar total de participantes iniciales
    const { count: participantsCount } = await this.supabase
      .from('tokens')
      .select('*', { count: 'exact', head: true })
      .eq('assembly_id', assemblyId);
    
    this.totalParticipants.set(participantsCount || 0);

    // Buscar la última pregunta activa o cerrada
    const { data: qData } = await this.supabase
      .from('survey_questions')
      .select('*, survey_options(*)')
      .eq('assembly_id', assemblyId)
      .in('estado', ['activa', 'cerrada'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (qData) {
      this.activeQuestion.set({
        id: qData.id,
        enunciado: qData.enunciado,
        opciones: qData.survey_options,
        estado: qData.estado
      });
      await this.loadResults(qData.id);
    } else {
      this.activeQuestion.set(null);
      this.results.set([]);
      this.totalVotes.set(0);
    }
  }

  private async handleQuestionChange(payload: any) {
    // Si la pregunta pasa a ser activa o cerrada, mostrarla/actualizarla
    if (payload.new && (payload.new.estado === 'activa' || payload.new.estado === 'cerrada')) {
      const { data: opts } = await this.supabase
        .from('survey_options')
        .select('*')
        .eq('question_id', payload.new.id);
        
      this.activeQuestion.set({
        id: payload.new.id,
        enunciado: payload.new.enunciado,
        opciones: opts || [],
        estado: payload.new.estado
      });
      await this.loadResults(payload.new.id);
    } 
    // Si la pregunta se borra o vuelve a "creada" (por error), la quitamos si era la actual
    else if (payload.new && payload.new.estado === 'creada') {
      if (this.activeQuestion()?.id === payload.new.id) {
        this.activeQuestion.set(null);
      }
    }
    // Para el caso de evento DELETE
    else if (payload.eventType === 'DELETE' && payload.old) {
      if (this.activeQuestion()?.id === payload.old.id) {
        this.activeQuestion.set(null);
      }
    }
  }

  private async loadResults(questionId: string) {
    const { data: votes } = await this.supabase
      .from('votes')
      .select('option_id')
      .eq('question_id', questionId);

    if (votes) {
      this.calculateResults(votes);
    }
  }

  private handleNewVote(payload: any) {
    const newVote = payload.new;
    // Solo actualizar si el voto es para la pregunta activa actual
    if (this.activeQuestion() && newVote.question_id === this.activeQuestion()?.id) {
      this.totalVotes.update(v => v + 1);
      
      // Actualizar el conteo por opción
      const currentResults = this.results();
      const updatedResults = currentResults.map(r => {
        if (r.optionId === newVote.option_id) {
          return { ...r, count: r.count + 1 };
        }
        return r;
      });
      
      // Si la opción no estaba en los resultados aún (ej. primer voto)
      if (!updatedResults.find(r => r.optionId === newVote.option_id)) {
        updatedResults.push({ optionId: newVote.option_id, count: 1 });
      }
      
      this.results.set(updatedResults);
    }
  }

  private calculateResults(votes: any[]) {
    this.totalVotes.set(votes.length);
    const counts = votes.reduce((acc, vote) => {
      acc[vote.option_id] = (acc[vote.option_id] || 0) + 1;
      return acc;
    }, {});

    const resultsArray = Object.keys(counts).map(key => ({
      optionId: key,
      count: counts[key]
    }));
    
    this.results.set(resultsArray);
  }

  unsubscribe() {
    if (this.channel) {
      if (this.channel.state === 'joined') {
        this.channel.untrack();
      }
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  ngOnDestroy() {
    this.unsubscribe();
  }
}
