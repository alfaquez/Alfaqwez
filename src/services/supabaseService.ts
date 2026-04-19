import { createClient } from '@supabase/supabase-js';

// These would normally come from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

/* 
Database Schema Mapping for Al-Kameen:

1. users (id, name, employee_id, role, total_score, last_score, badges)
2. exams (id, month, year, status, is_active, created_at)
3. questions (id, exam_id, text, type, options, correct_answer, category)
4. user_attempts (id, user_id, exam_id, score, answers, ai_insights, completed_at)
*/

export const dbService = {
  // Realtime Leaderboard Subscription
  subscribeLeaderboard: (callback: (data: any) => void) => {
    return supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, callback)
      .subscribe();
  },

  // Auth: Mock simulation for current environment, but ready for Supabase Auth
  signIn: async (employeeId: string) => {
    // In a real Supabase setup:
    // return await supabase.auth.signInWithPassword({ email: `${employeeId}@corp.com`, password });
    return { user: { id: 'u1', employeeId, role: employeeId === 'ADMIN' ? 'admin' : 'user' } };
  }
};
