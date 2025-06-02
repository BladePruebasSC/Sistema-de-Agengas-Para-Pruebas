import { Appointment } from '../types';

const WHATSAPP_API_URL = 'https://api.whatsapp.com/send';

export const notifyAppointmentCreated = async (appointment: Appointment): Promise<void> => {
  try {
    const message = `¡Hola ${appointment.clientName}! Tu cita ha sido confirmada:\n
🗓️ Fecha: ${appointment.date.toLocaleDateString()}\n
⏰ Hora: ${appointment.time}\n
💇 Servicio: ${appointment.service}\n
¡Te esperamos!`;

    const phoneNumber = appointment.clientPhone.replace(/\D/g, '');
    const url = `${WHATSAPP_API_URL}?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    // Abre WhatsApp Web en una nueva pestaña
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error sending creation notification:', error);
    throw error;
  }
};

export const notifyAppointmentCancelled = async (appointment: Appointment): Promise<void> => {
  try {
    const message = `Hola ${appointment.clientName}, tu cita ha sido cancelada:\n
🗓️ Fecha: ${appointment.date.toLocaleDateString()}\n
⏰ Hora: ${appointment.time}\n
💇 Servicio: ${appointment.service}\n
Para reagendar, por favor visita nuestra página web.`;

    const phoneNumber = appointment.clientPhone.replace(/\D/g, '');
    const url = `${WHATSAPP_API_URL}?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    // Abre WhatsApp Web en una nueva pestaña
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
    throw error;
  }
};