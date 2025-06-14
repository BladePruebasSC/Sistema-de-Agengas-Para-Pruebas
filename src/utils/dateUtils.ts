export const formatDateForSupabase = (date: Date): string => {
  // Crear una nueva fecha para evitar mutaciones
  const localDate = new Date(date);
  
  // Asegurar que estamos trabajando con la fecha local sin conversión de zona horaria
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const parseSupabaseDate = (dateStr: string): Date => {
  // Crear una fecha a partir del string YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Crear fecha en la zona horaria local (Santo Domingo)
  // Usar el constructor de Date que no hace conversión de zona horaria
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  
  return date;
};

// Función para comparar fechas sin considerar la hora
export const isSameDate = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Función para verificar si una fecha es anterior a otra (solo fecha, no hora)
export const isDateBefore = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return d1.getTime() < d2.getTime();
};

// Función para verificar si una fecha es hoy
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDate(date, today);
};

// Función para verificar si una fecha es futura (después de hoy)
export const isFutureDate = (date: Date): boolean => {
  const today = new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return dateOnly.getTime() > todayOnly.getTime();
};