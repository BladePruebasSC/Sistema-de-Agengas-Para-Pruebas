interface WhatsAppMessageData {
  clientPhone: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  barberName?: string;
  barberPhone?: string;
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
  const barberMessage = `❌ *CITA CANCELADA* ❌

✂️ *D' Gastón Stylo Barbería*

👤 *Cliente:* ${data.clientName}
📱 *Teléfono:* ${data.clientPhone}
📅 *Fecha:* ${data.date}
🕒 *Hora:* ${data.time}
💼 *Servicio:* ${data.service}
👨‍💼 *Barbero:* ${data.barberName || 'No especificado'}

⚠️ *El horario está ahora disponible para nuevas citas.*`;

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