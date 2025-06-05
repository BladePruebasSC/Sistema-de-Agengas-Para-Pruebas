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

    // Check if number is from DR
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
      // Don't throw error, just log it
      console.warn('SMS sending failed:', responseData);
      return null;
    }

    return responseData;
  } catch (error) {
    // Don't throw error, just log it
    console.warn('Error sending SMS:', error);
    return null;
  }
};