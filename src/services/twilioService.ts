import { TwilioMessageData } from '../types';

const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01/Accounts';

const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters and any existing '+' prefix
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Remove any leading zeros
  cleanPhone = cleanPhone.replace(/^0+/, '');
  
  // For Dominican Republic numbers, add 1 prefix if not present
  if (!cleanPhone.startsWith('1')) {
    cleanPhone = '1' + cleanPhone;
  }
  
  return '+' + cleanPhone;
};

export const sendSMSMessage = async (data: TwilioMessageData) => {
  try {
    const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
    const fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER; // Make sure this is just the number
    const url = `${TWILIO_API_URL}/${accountSid}/Messages.json`;

    if (!data?.clientPhone) {
      throw new Error('Número de teléfono no proporcionado');
    }

    const toNumber = formatPhoneNumber(data.clientPhone);
    
    console.log('Enviando SMS:', {
      to: toNumber,
      from: fromNumber,
      body: data.body
    });

    const formData = new URLSearchParams();
    formData.append('To', toNumber);
    formData.append('From', fromNumber);
    formData.append('Body', data.body);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`)
      },
      body: formData
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Twilio API Error:', responseData);
      throw new Error(responseData.message || 'Error al enviar SMS');
    }

    return responseData;
  } catch (error) {
    console.error('Error en Twilio:', error);
    throw error;
  }
};