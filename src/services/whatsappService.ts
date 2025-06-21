// Define who initiated the cancellation for message customization
type CancellationInitiator = 'business' | 'client'; // 'business' means admin or barber

interface WhatsAppMessageData {
  clientPhone: string; // Always needed for context
  clientName: string;
  date: string;
  time: string;
  service: string;
  barberName?: string;
  recipientPhone: string; // The actual phone number to send the message to
  cancellationInitiator: CancellationInitiator; // Who cancelled
  businessName?: string; // Optional: Name of the business
}

// Función para abrir WhatsApp Web con mensaje pre-escrito
export const openWhatsAppWithMessage = (phone: string, message: string) => {
  // Limpiar el número de teléfono
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Codificar el mensaje para URL
  const encodedMessage = encodeURIComponent(message);
  
  // Crear la URL de WhatsApp Web
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  
  // Abrir en una nueva ventana/pestaña
  window.open(whatsappUrl, '_blank');
};

export const notifyAppointmentCreated = async (data: WhatsAppMessageData) => {
  const barberMessage = `🔔 *NUEVA CITA REGISTRADA* 🔔

✂️ *D' Gastón Stylo Barbería*

👤 *Cliente:* ${data.clientName}
📱 *Teléfono:* ${data.clientPhone}
📅 *Fecha:* ${data.date}
🕒 *Hora:* ${data.time}
💼 *Servicio:* ${data.service}
👨‍💼 *Barbero:* ${data.barberName || 'No especificado'}

¡Nueva cita confirmada en el sistema!`;

  try {
    // Enviar mensaje al barbero asignado o al número por defecto
    const targetPhone = data.barberPhone || '+18092033894';
    openWhatsAppWithMessage(targetPhone, barberMessage);
    
    return { success: true };
  } catch (error) {
    console.error('Error abriendo WhatsApp:', error);
    throw error;
  }
};

export const notifyAppointmentCancelled = async (data: WhatsAppMessageData) => {
  let messageBody = '';
  const businessDisplayName = data.businessName || "D' Gastón Stylo Barbería";

  if (data.cancellationInitiator === 'business') {
    // Mensaje para el CLIENTE cuando el negocio/barbero cancela
    messageBody = `😥 *CITA CANCELADA* 😥

Estimado/a ${data.clientName},

Te informamos que tu cita en *${businessDisplayName}* ha sido cancelada:

📅 *Fecha:* ${data.date}
🕒 *Hora:* ${data.time}
💼 *Servicio:* ${data.service}
👨‍💼 *Con:* ${data.barberName || businessDisplayName}

Lamentamos cualquier inconveniente. Por favor, contáctanos si deseas reprogramar o tienes alguna consulta.`;
  } else { // Asumimos 'client' o un futuro tipo de cancelación por cliente
    // Mensaje para el BARBERO cuando el cliente cancela (lógica original adaptada)
    messageBody = `❌ *CITA CANCELADA POR CLIENTE* ❌

✂️ *${businessDisplayName}*

👤 *Cliente:* ${data.clientName}
📱 *Teléfono:* ${data.clientPhone}
📅 *Fecha:* ${data.date}
🕒 *Hora:* ${data.time}
💼 *Servicio:* ${data.service}
👨‍💼 *Barbero Asignado:* ${data.barberName || 'No especificado'}

⚠️ *El horario está ahora disponible para nuevas citas.*`;
  }

  try {
    openWhatsAppWithMessage(data.recipientPhone, messageBody);
    return { success: true };
  } catch (error) {
    console.error('Error abriendo WhatsApp para notificación de cancelación:', error);
    throw error;
  }
};