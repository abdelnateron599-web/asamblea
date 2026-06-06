import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private supabase = inject(SupabaseService).client;

  // Emitir un voto anónimamente llamando al RPC
  async castVote(tokenId: string, questionId: string, optionId: string) {
    const { data, error } = await this.supabase.rpc('cast_anonymous_vote', {
      p_token_id: tokenId,
      p_question_id: questionId,
      p_option_id: optionId
    });
    
    if (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
    return data;
  }

  // Verificar si un token ya votó en una pregunta (usa RPC para evitar bloqueos por RLS)
  async hasVoted(tokenId: string, questionId: string) {
    const { data, error } = await this.supabase.rpc('check_if_voted', {
      p_token_id: tokenId,
      p_question_id: questionId
    });
      
    if (error) {
      // Si el RPC no existe (por ejemplo si no lo ha creado aún), fallback al método anterior
      console.warn('RPC check_if_voted falló, usando select directo...', error);
      const res = await this.supabase
        .from('responses')
        .select('id')
        .eq('token_id', tokenId)
        .eq('question_id', questionId)
        .maybeSingle();
      return !!res.data;
    }
    
    return !!data;
  }
}
