export const formatDateForSupabase = (date: Date): string => {
    // Crear una nueva fecha ajustando la zona horaria a UTC-4 (Santo Domingo)
    const offset = -4; // UTC-4
    const localDate = new Date(date);
    const utcDate = new Date(
        localDate.getUTCFullYear(),
        localDate.getUTCMonth(),
        localDate.getUTCDate(),
        localDate.getUTCHours() - offset
    );
    
    // Formatear como YYYY-MM-DD
    return utcDate.toISOString().split('T')[0];
};

export const parseSupabaseDate = (dateStr: string): Date => {
    // Crear una fecha a partir del string YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Crear fecha en la zona horaria local (Santo Domingo)
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    
    return date;
};