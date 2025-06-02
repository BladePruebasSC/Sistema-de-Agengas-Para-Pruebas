// Since we don't have a backend API endpoint yet, we'll log messages for now
// and implement the actual WhatsApp integration later
export const sendWhatsAppMessage = async (to: string, message: string) => {
  // For now, just log the message that would be sent
  console.log('Would send WhatsApp message:', { to, message });
  return true;
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
  await sendWhatsAppMessage('8092033894', message);
};

export const notifyAppointmentCancelled = async (appointment: any, allAppointments: any[]) => {
  const message = `Cita cancelada:\n
Fecha: ${appointment.date}\n
Hora: ${appointment.time}\n
Este horario está ahora disponible.`;

  // Notify barbershop
  await sendWhatsAppMessage('8092033894', message);

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