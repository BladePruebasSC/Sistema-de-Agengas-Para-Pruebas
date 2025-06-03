const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01/Accounts';

const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return `whatsapp:+1${cleanPhone}`;
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
    return `whatsapp:+${cleanPhone}`;
  } else {
    throw new Error(`Número de teléfono inválido: ${phone}`);
  }
};

const createMessage = (type: string, data: {
  clientName?: string;
  date?: string;
  time?: string;
  service?: string;
}): string => {
  switch (type) {
    case 'appointment_created':
      return `¡Hola ${data.clientName}! Tu cita ha sido confirmada para el ${data.date} a las ${data.time}. ¡Te esperamos!`;
    
    case 'appointment_cancelled':
      return `Hola ${data.clientName}, tu cita para el ${data.date} a las ${data.time} ha sido cancelada.`;
    
    case 'holiday_added':
      return `Aviso: El día ${data.date} no estará disponible para citas.`;
    
    case 'holiday_removed':
      return `Aviso: El día ${data.date} ya está disponible para citas.`;
    
    case 'time_blocked':
      return `Aviso: El horario de ${data.time} del día ${data.date} no estará disponible.`;
    
    case 'time_unblocked':
      return `Aviso: El horario de ${data.time} del día ${data.date} ya está disponible.`;
    
    default:
      throw new Error(`Tipo de mensaje no soportado: ${type}`);
  }
};

export const sendWhatsAppMessage = async (
    to: string,
    type: string,
    data: {
        clientName?: string;
        date?: string;
        time?: string;
        service?: string;
    }
) => {
    try {
        const formattedPhone = formatPhoneNumber(to);
        const message = createMessage(type, data);

        const twilioData = new URLSearchParams();
        twilioData.append('To', formattedPhone);
        twilioData.append('From', `whatsapp:${import.meta.env.VITE_TWILIO_PHONE_NUMBER}`);
        twilioData.append('Body', message);

        const response = await fetch(
            `${TWILIO_API_URL}/${import.meta.env.VITE_TWILIO_ACCOUNT_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${import.meta.env.VITE_TWILIO_ACCOUNT_SID}:${import.meta.env.VITE_TWILIO_AUTH_TOKEN}`)
                },
                body: twilioData
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        const result = await response.json();
        console.log('Mensaje enviado a:', to);
        return result;
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        throw error;
    }
};

export const sendMassNotification = async (
    phones: string[],
    type: string,
    data: {
        date?: string;
        time?: string;
    }
) => {
    const uniquePhones = [...new Set(phones)];
    console.log(`Enviando notificación masiva a ${uniquePhones.length} números`);
    
    for (const phone of uniquePhones) {
        try {
            await sendWhatsAppMessage(phone, type, data);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Error sending message to ${phone}:`, error);
        }
    }
};