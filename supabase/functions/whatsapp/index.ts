import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import twilio from 'npm:twilio@4.22.0';

const twilioClient = twilio(
  Deno.env.get('TWILIO_ACCOUNT_SID'),
  Deno.env.get('TWILIO_AUTH_TOKEN')
);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

const BARBERSHOP_PHONE = '+18092033894';
const WHATSAPP_PREFIX = 'whatsapp:';

const sendWhatsAppMessage = async (to: string, message: string) => {
  try {
    await twilioClient.messages.create({
      body: message,
      from: `${WHATSAPP_PREFIX}${BARBERSHOP_PHONE}`,
      to: `${WHATSAPP_PREFIX}+1${to}`
    });
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        status: 204,
      });
    }

    const { type, data } = await req.json();

    switch (type) {
      case 'appointment_created': {
        const { appointment } = data;
        const formattedDate = formatDate(appointment.date);
        
        // Mensaje para el cliente
        const clientMessage = `¡Tu cita ha sido confirmada!\n\n` +
          `📅 Fecha: ${formattedDate}\n` +
          `🕒 Hora: ${appointment.time}\n` +
          `✂️ Servicio: ${appointment.service}\n\n` +
          `Te esperamos en Gastón Stylo Barber Shop.\n` +
          `Te enviaremos un recordatorio una hora antes.`;

        // Mensaje para la barbería
        const barberMessage = `Nueva cita agendada:\n\n` +
          `👤 Cliente: ${appointment.clientName}\n` +
          `📱 Teléfono: ${appointment.clientPhone}\n` +
          `📅 Fecha: ${formattedDate}\n` +
          `🕒 Hora: ${appointment.time}\n` +
          `✂️ Servicio: ${appointment.service}`;

        await Promise.all([
          sendWhatsAppMessage(appointment.clientPhone, clientMessage),
          sendWhatsAppMessage(BARBERSHOP_PHONE, barberMessage)
        ]);

        break;
      }

      case 'appointment_cancelled': {
        const { appointment, availableSlot } = data;
        const formattedDate = formatDate(appointment.date);

        // Mensaje para todos los clientes
        const message = `¡Horario disponible!\n\n` +
          `Se ha liberado el siguiente horario:\n` +
          `📅 Fecha: ${formattedDate}\n` +
          `🕒 Hora: ${appointment.time}\n\n` +
          `Puedes agendar tu cita ahora en nuestra página web.`;

        // Obtener todos los números de teléfono únicos
        const { data: phones } = await supabase
          .from('appointments')
          .select('clientPhone')
          .gt('date', new Date().toISOString());

        const uniquePhones = [...new Set(phones?.map(p => p.clientPhone))];

        // Enviar mensaje a todos los números únicos
        await Promise.all([
          ...uniquePhones.map(phone => sendWhatsAppMessage(phone, message)),
          sendWhatsAppMessage(BARBERSHOP_PHONE, message)
        ]);

        break;
      }

      case 'holiday_created': {
        const { holiday } = data;
        const formattedDate = formatDate(holiday.date);

        const message = `❗ Aviso importante ❗\n\n` +
          `El día ${formattedDate} será feriado:\n` +
          `📝 Motivo: ${holiday.description}\n\n` +
          `No se atenderán citas este día.`;

        // Notificar a todos los clientes con citas futuras
        const { data: phones } = await supabase
          .from('appointments')
          .select('clientPhone')
          .gt('date', new Date().toISOString());

        const uniquePhones = [...new Set(phones?.map(p => p.clientPhone))];

        await Promise.all([
          ...uniquePhones.map(phone => sendWhatsAppMessage(phone, message)),
          sendWhatsAppMessage(BARBERSHOP_PHONE, message)
        ]);

        break;
      }

      case 'time_blocked': {
        const { blockedTime } = data;
        const formattedDate = formatDate(blockedTime.date);

        const message = `❗ Aviso importante ❗\n\n` +
          `Se han bloqueado los siguientes horarios para el ${formattedDate}:\n` +
          `🕒 Horas: ${blockedTime.timeSlots.join(', ')}\n` +
          `📝 Motivo: ${blockedTime.reason}\n\n` +
          `Estos horarios no estarán disponibles para citas.`;

        // Notificar a todos los clientes con citas futuras
        const { data: phones } = await supabase
          .from('appointments')
          .select('clientPhone')
          .gt('date', new Date().toISOString());

        const uniquePhones = [...new Set(phones?.map(p => p.clientPhone))];

        await Promise.all([
          ...uniquePhones.map(phone => sendWhatsAppMessage(phone, message)),
          sendWhatsAppMessage(BARBERSHOP_PHONE, message)
        ]);

        break;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});