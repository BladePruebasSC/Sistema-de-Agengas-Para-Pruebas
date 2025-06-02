const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
const BARBERSHOP_PHONE = '8092033894';

export const sendWhatsAppMessage = async (to: string, message: string) => {
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send WhatsApp message');
    }

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
};

export const notifyAppointmentCreated = async (appointment: any) => {
  const message = `Nueva cita agendada:\n
Fecha: ${appointment.date}\n
Hora: ${appointment.time}\n
Cliente: ${appointment.clientName}\n
Teléfono: ${appointment.clientPhone}\n
Servicio: ${appointment.service}`;

  // Send to client
  await sendWhatsAppMessage(appointment.clientPhone, `Tu cita ha sido confirmada:\n${message}`);
  
  // Send to barbershop
  await sendWhatsAppMessage(BARBERSHOP_PHONE, message);
};

export const notifyAppointmentCancelled = async (appointment: any, allAppointments: any[]) => {
  const message = `Cita cancelada:\n
Fecha: ${appointment.date}\n
Hora: ${appointment.time}\n
Este horario está ahora disponible.`;

  // Notify barbershop
  await sendWhatsAppMessage(BARBERSHOP_PHONE, message);

  // Notify all clients with future appointments
  const uniquePhones = new Set(
    allAppointments
      .filter(app => new Date(app.date) >= new Date())
      .map(app => app.clientPhone)
  );

  for (const phone of uniquePhones) {
    await sendWhatsAppMessage(phone, message);
  }
};