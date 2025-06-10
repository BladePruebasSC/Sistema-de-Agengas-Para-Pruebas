interface WhatsAppMessageData {
  clientPhone: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
}

const ADMIN_PHONE = '+18092033894';

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
    // Abrir WhatsApp para enviar mensaje al cliente
    openWhatsAppWithMessage(data.clientPhone, clientMessage);
    
    // Pequeña pausa para evitar que se abran las ventanas al mismo tiempo
    setTimeout(() => {
      // Abrir WhatsApp para enviar mensaje al admin
      openWhatsAppWithMessage(ADMIN_PHONE, adminMessage);
    }, 1000);
    
    return { success: true };
  } catch (error) {
    console.error('Error abriendo WhatsApp:', error);
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
    // Abrir WhatsApp para enviar mensaje al cliente
    openWhatsAppWithMessage(data.clientPhone, clientMessage);
    
    // Pequeña pausa para evitar que se abran las ventanas al mismo tiempo
    setTimeout(() => {
      // Abrir WhatsApp para enviar mensaje al admin
      openWhatsAppWithMessage(ADMIN_PHONE, adminMessage);
    }, 1000);
    
    return { success: true };
  } catch (error) {
    console.error('Error abriendo WhatsApp:', error);
    throw error;
  }
};