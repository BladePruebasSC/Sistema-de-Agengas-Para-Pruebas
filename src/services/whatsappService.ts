interface WhatsAppMessageData {
  clientPhone: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
}

const ADMIN_PHONE = '+18092033894';

export const sendWhatsAppMessage = async (to: string, message: string) => {
  try {
    const response = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        message
      })
    });

    if (!response.ok) {
      throw new Error('Error enviando mensaje de WhatsApp');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en WhatsApp service:', error);
    throw error;
  }
};

export const notifyAppointmentCreated = async (data: WhatsAppMessageData) => {
  const clientMessage = `¡Hola ${data.clientName}! 

Tu cita ha sido confirmada:
📅 Fecha: ${data.date}
🕒 Hora: ${data.time}
✂️ Servicio: ${data.service}

Te esperamos en D' Gastón Stylo.
¡Gracias por elegirnos!`;

  const adminMessage = `Nueva cita registrada:

👤 Cliente: ${data.clientName}
📱 Teléfono: ${data.clientPhone}
📅 Fecha: ${data.date}
🕒 Hora: ${data.time}
✂️ Servicio: ${data.service}`;

  try {
    // Enviar mensaje al cliente
    await sendWhatsAppMessage(data.clientPhone, clientMessage);
    
    // Enviar mensaje al admin
    await sendWhatsAppMessage(ADMIN_PHONE, adminMessage);
    
    return { success: true };
  } catch (error) {
    console.error('Error enviando notificaciones WhatsApp:', error);
    throw error;
  }
};

export const notifyAppointmentCancelled = async (data: WhatsAppMessageData) => {
  const clientMessage = `Hola ${data.clientName},

Tu cita ha sido cancelada:
📅 Fecha: ${data.date}
🕒 Hora: ${data.time}

Si necesitas reagendar, puedes hacerlo en nuestra página web.

Gracias por tu comprensión.`;

  const adminMessage = `Cita cancelada:

👤 Cliente: ${data.clientName}
📱 Teléfono: ${data.clientPhone}
📅 Fecha: ${data.date}
🕒 Hora: ${data.time}
✂️ Servicio: ${data.service}

El horario está ahora disponible.`;

  try {
    // Enviar mensaje al cliente
    await sendWhatsAppMessage(data.clientPhone, clientMessage);
    
    // Enviar mensaje al admin
    await sendWhatsAppMessage(ADMIN_PHONE, adminMessage);
    
    return { success: true };
  } catch (error) {
    console.error('Error enviando notificaciones de cancelación:', error);
    throw error;
  }
};