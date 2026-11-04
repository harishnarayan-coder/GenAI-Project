import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qgrdzssdrhxyidhvecmo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncmR6c3Nkcmh4eWlkaHZlY21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTc5OTQsImV4cCI6MjEwOTM3Mzk5NH0.v83Yc0y7m1iazUKoVKSPn3YSaEKpIt9P5-RFE87DyDw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
