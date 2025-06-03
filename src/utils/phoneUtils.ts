export const formatPhoneForWhatsApp = (phone: string): string => {
  // Primero limpiamos el número de cualquier caracter no numérico
  const cleanNumber = phone.replace(/\D/g, '');
  
  // Si el número ya tiene el código del país, lo devolvemos como está
  if (cleanNumber.startsWith('1')) {
    return `+${cleanNumber}`;
  }
  
  // Si no tiene el código del país, lo agregamos
  return `+1${cleanNumber}`;
};

export const formatPhoneForDisplay = (phone: string): string => {
  const cleanNumber = phone.replace(/\D/g, '');
  const matches = cleanNumber.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

  if (!matches) return '';

  const [, first, second, third] = matches;
  if (!second) return first;
  if (!third) return `${first}-${second}`;
  return `${first}-${second}-${third}`;
};