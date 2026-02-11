import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = `https://jaonriwecvyvnmyktuys.supabase.co`;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphb25yaXdlY3Z5dm5teWt0dXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTc5MzIsImV4cCI6MjA4NjA3MzkzMn0.V-A1xzbjubjJBg7z6076WpVyRodYLBKgI90LwiqW4PY';
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

export async function saveTimeEntry(employeeId, date, startTime, endTime, shiftType = 'custom') {
  const hours = calculateHours(startTime, endTime);

  const { data, error } = await supabase
    .from('time_entries')
    .upsert(
      {
        employee_id: employeeId,
        date,
        start_time: startTime,
        end_time: endTime,
        shift_type: shiftType,
        hours_worked: hours
      },
      { onConflict: 'employee_id,date' }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}

export function calculateHours(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  let diffMinutes = endMinutes - startMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }

  return parseFloat((diffMinutes / 60).toFixed(2));
}

export async function deleteTimeEntry(employeeId, date) {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('employee_id', employeeId)
    .eq('date', date);

  if (error) throw error;
}
