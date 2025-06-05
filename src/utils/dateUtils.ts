export const formatDateForSupabase = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseSupabaseDate = (dateStr: string): Date => {
    // Crear una fecha a partir del string YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Crear fecha en la zona horaria local (Santo Domingo)
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    
    return date;
};