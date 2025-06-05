import { format, parseISO } from 'date-fns';

export const formatDateForSupabase = (date: Date): string => {
  // Ensure we're working with a Date object
  const dateObj = new Date(date);
  
  // Format as YYYY-MM-DD
  return format(dateObj, 'yyyy-MM-dd');
};

export const parseSupabaseDate = (dateString: string): Date => {
  return parseISO(dateString);
};