import { TwilioMessageData } from '../types';

const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01/Accounts';

// Helper to check if number is from Dominican Republic
const isDRNumber = (phone: string): boolean => {
  const drAreaCodes = ['809', '829', '849'];
  const cleanPhone = phone.replace(/\D/g, '');
  return drAreaCodes.some(code => cleanPhone.startsWith(code));
};

const formatPhoneNumber = (phone: string): string => {
  if (!phone) {
    throw new Error('Número de teléfono no proporcionado');
  }

  // Remove all non-digit characters
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Remove any leading zeros
  cleanPhone = cleanPhone.replace(/^0+/, '');

  // Add country code for DR numbers
  if (isDRNumber(cleanPhone)) {
    return '+1' + cleanPhone;
  }
  
  throw new Error('Número inválido: Debe ser un número válido de República Dominicana (809, 829, o 849)');
};

export const sendSMSMessage = async (data: TwilioMessageData) => {
  try {
    if (!data?.clientPhone) {
      console.log('No se proporcionó número de teléfono');
      return null;
    }

    const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
    const fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Faltan credenciales de Twilio:', { accountSid, authToken, fromNumber });
      return null;
    }

    console.log('Enviando SMS a:', data.clientPhone); // Debug log

    const formData = new URLSearchParams();
    formData.append('To', formatPhoneNumber(data.clientPhone));
    formData.append('From', fromNumber);
    formData.append('Body', data.body);

    const response = await fetch(`${TWILIO_API_URL}/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`)
      },
      body: formData
    });

    const responseData = await response.json();
    console.log('Respuesta de Twilio:', responseData); // Debug log

    if (!response.ok) {
      throw new Error(responseData.message || 'Error al enviar SMS');
    }

    return responseData;
  } catch (error) {
    console.error('Error al enviar SMS:', error);
    return null;
  }
};