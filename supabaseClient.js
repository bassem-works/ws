import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loginEmployee(matricule, password) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('matricule', matricule)
    .eq('password', password)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Matricule ou mot de passe incorrect');
  }

  return data;
}

export async function registerEmployee(matricule, password, nom, prenom) {
  const { data, error } = await supabase
    .from('employees')
    .insert([{ matricule, password, nom, prenom }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ce matricule existe déjà');
    }
    throw error;
  }

  return data;
}

export async function getTimeEntries(employeeId, month, year) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDateStr)
    .order('date', { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function saveTimeEntry(employeeId, date, hoursWorked) {
  const { data, error } = await supabase
    .from('time_entries')
    .upsert(
      { employee_id: employeeId, date, hours_worked: hoursWorked },
      { onConflict: 'employee_id,date' }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteTimeEntry(employeeId, date) {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('employee_id', employeeId)
    .eq('date', date);

  if (error) throw error;
}
