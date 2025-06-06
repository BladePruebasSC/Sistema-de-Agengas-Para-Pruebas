import { TwilioMessageData } from '../types';

const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01/Accounts';
const ADMIN_PHONE = '+18092033894';

// Helper to check if number is from Dominican Republic (accepts with or without 1 country code)
const isDRNumber = (phone: string): boolean => {
  const drAreaCodes = ['809', '829', '849'];
  const cleanPhone = phone.replace(/\D/g, '');
  const phoneToCheck =
    cleanPhone.length === 11 && cleanPhone.startsWith('1')
      ? cleanPhone.slice(1)
      : cleanPhone;
  return drAreaCodes.some(code => phoneToCheck.startsWith(code));
};

const formatPhoneNumber = (phone: string): string => {
  if (!phone) {
    throw new Error('Número de teléfono no proporcionado');
  }
  let cleanPhone = phone.replace(/\D/g, '');
  cleanPhone = cleanPhone.replace(/^0+/, '');
  if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
    return '+' + cleanPhone;
  }
  if (isDRNumber(cleanPhone)) {
    return '+1' + cleanPhone;
  }
  throw new Error('Número inválido: Debe ser un número válido de República Dominicana (809, 829, o 849)');
};

export interface TwilioMessageDataWithAdmin extends TwilioMessageData {
  adminBody?: string;
}

export const sendSMSMessage = async (data: TwilioMessageData) => {
  try {
    if (!data?.clientPhone) {
      console.log('No phone number provided for SMS, skipping...');
      return null;
    }

    const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
    const fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.log('Missing Twilio credentials, skipping SMS...');
      return null;
    }

    if (!isDRNumber(data.clientPhone)) {
      console.log('Not a DR number, skipping SMS...');
      return null;
    }

    const toNumber = formatPhoneNumber(data.clientPhone);

    const formData = new URLSearchParams();
    formData.append('To', toNumber);
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

    if (!response.ok) {
      console.warn('SMS sending failed:', responseData);
      return null;
    }

    return responseData;
  } catch (error) {
    console.warn('Error sending SMS:', error);
    return null;
  }
};

// Envía al cliente y al admin (si no es el mismo número), con mensaje personalizado al admin
export const sendSMSBoth = async (data: TwilioMessageDataWithAdmin) => {
  const results = [];
  // Envía al cliente
  results.push(await sendSMSMessage(data));
  // Si el cliente no es el admin, envía también al admin con mensaje personalizado si existe
  const formattedClient = formatPhoneNumber(data.clientPhone);
  if (formattedClient !== ADMIN_PHONE) {
    results.push(
      await sendSMSMessage({
        ...data,
        clientPhone: ADMIN_PHONE,
        body: data.adminBody || data.body, // Usa adminBody si existe, si no usa body normal
      })
    );
  }
  return results;
};