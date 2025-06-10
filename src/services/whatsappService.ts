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
  const adminMessage = `🔔 *NUEVA CITA REGISTRADA* 🔔

✂️ *D' Gastón Stylo Barbería*

👤 *Cliente:* ${data.clientName}
📱 *Teléfono:* ${data.clientPhone}
📅 *Fecha:* ${data.date}
🕒 *Hora:* ${data.time}
💼 *Servicio:* ${data.service}

¡Nueva cita confirmada en el sistema!`;

  try {
    // Solo enviar mensaje al admin/dueño
    openWhatsAppWithMessage(ADMIN_PHONE, adminMessage);
    
    return { success: true };
  } catch (error) {
    console.error('Error abriendo WhatsApp:', error);
    throw error;
  }
};

export const notifyAppointmentCancelled = async (data: WhatsAppMessageData) => {
  const adminMessage = `❌ *CITA CANCELADA* ❌

✂️ *D' Gastón Stylo Barbería*

👤 *Cliente:* ${data.clientName}
📱 *Teléfono:* ${data.clientPhone}
📅 *Fecha:* ${data.date}
🕒 *Hora:* ${data.time}
💼 *Servicio:* ${data.service}

⚠️ *El horario está ahora disponible para nuevas citas.*`;

  try {
    // Solo enviar mensaje al admin/dueño
    openWhatsAppWithMessage(ADMIN_PHONE, adminMessage);
    
    return { success: true };
  } catch (error) {
    console.error('Error abriendo WhatsApp:', error);
    throw error;
  }
};