import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Appointment, Holiday, BlockedTime } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { formatPhoneForWhatsApp, formatPhoneForDisplay } from '../utils/phoneUtils';
import { sendWhatsAppMessage, sendMassNotification } from '../services/twilioService';
import type { TwilioMessageData } from '../types/twilio';
import { formatDateForSupabase, parseSupabaseDate } from '../utils/dateUtils';

interface AppointmentContextType {
  appointments: Appointment[];
  holidays: Holiday[];
  blockedTimes: BlockedTime[];
  userPhone: string | null;
  setUserPhone: (phone: string) => void;
  deleteAppointment: (id: string) => Promise<void>;
  createAppointment: (appointmentData: CreateAppointmentData) => Promise<Appointment>;
  createHoliday: (holidayData: Omit<Holiday, 'id'>) => Promise<Holiday>;
  createBlockedTime: (blockedTimeData: Omit<BlockedTime, 'id'>) => Promise<BlockedTime>;
  removeHoliday: (id: string) => Promise<void>;
  removeBlockedTime: (id: string) => Promise<void>;
  isTimeSlotAvailable: (date: Date, time: string) => Promise<boolean>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

const notifyWhatsApp = async (type: string, data: any) => {
    try {
        const response = await fetch('http://localhost:3000/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                phone: data.clientPhone || data.phone,
                data: {
                    ...data,
                    date: new Date(data.date).toLocaleDateString('es-ES'),
                }
            })
        });

        if (!response.ok) {
            throw new Error('Error enviando mensaje de WhatsApp');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en notificación WhatsApp:', error);
        return null;
    }
};

const getAllRegisteredPhones = (appointments: Appointment[]): string[] => {
  const phones = new Set(appointments.map(app => app.clientPhone));
  return Array.from(phones);
};

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [userPhone, setUserPhone] = useState<string | null>(() => {
    return localStorage.getItem('userPhone');
  });

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      const formattedAppointments = data.map(appointment => {
        console.log('Fecha de BD:', appointment.date);
        const parsedDate = parseSupabaseDate(appointment.date);
        console.log('Fecha parseada:', parsedDate);
        
        return {
          ...appointment,
          date: parsedDate
        };
      });

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error in fetchAppointments:', error);
      toast.error('Error al cargar las citas');
    }
  };

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      const formattedHolidays = data.map(holiday => ({
        ...holiday,
        date: new Date(holiday.date)
      }));

      setHolidays(formattedHolidays);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast.error('Error al cargar los feriados');
    }
  };

  const fetchBlockedTimes = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_times')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      const formattedBlockedTimes = data.map(blockedTime => ({
        ...blockedTime,
        date: new Date(blockedTime.date)
      }));

      setBlockedTimes(formattedBlockedTimes);
    } catch (error) {
      console.error('Error fetching blocked times:', error);
      toast.error('Error al cargar los horarios bloqueados');
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchHolidays();
    fetchBlockedTimes();
  }, []);

  const isTimeSlotAvailable = async (date: Date, time: string): Promise<boolean> => {
    try {
        const formattedDate = date.toISOString().split('T')[0];

        // Verificar si hay una cita existente para esta fecha y hora específica
        const { data: existingAppointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('date', formattedDate)
            .eq('time', time);

        if (error) {
            console.error('Error checking appointments:', error);
            throw error;
        }

        // Si hay alguna cita a esta hora específica, el horario no está disponible
        if (existingAppointments && existingAppointments.length > 0) {
            console.log(`Hora ${time} en fecha ${formattedDate} no disponible - cita existente`);
            return false;
        }

        // Verificar si es un día feriado
        const { data: holiday } = await supabase
            .from('holidays')
            .select('*')
            .eq('date', formattedDate)
            .maybeSingle();

        if (holiday) {
            console.log(`Fecha ${formattedDate} no disponible - día feriado`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking time slot availability:', error);
        throw error;
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    return `+1${phone.replace(/\D/g, '')}`;
  };

  const createAppointment = async (appointmentData: CreateAppointmentData): Promise<Appointment> => {
    try {
      // Asegurarnos de que la fecha esté en UTC-4 (Santo Domingo)
      const formattedDate = formatDateForSupabase(appointmentData.date);
      
      console.log('Fecha original:', appointmentData.date);
      console.log('Fecha formateada para Supabase:', formattedDate);
      
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          ...appointmentData,
          date: formattedDate // Ya está en el formato correcto para Supabase
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Error al crear la cita');
      }

      // Parsear la fecha de vuelta a un objeto Date
      const newAppointment = { 
        ...data, 
        date: parseSupabaseDate(data.date)
      };
      
      console.log('Fecha parseada:', newAppointment.date);
      
      setAppointments(prev => [...prev, newAppointment]);

      // Enviar mensaje de confirmación
      try {
        await sendWhatsAppMessage(
          appointmentData.clientPhone,
          'appointment_created',
          {
            clientName: appointmentData.clientName,
            date: newAppointment.date.toLocaleDateString('es-ES'),
            time: appointmentData.time,
            service: appointmentData.service
          }
        );
      } catch (msgError) {
        console.error('Error sending WhatsApp message:', msgError);
      }

      toast.success('Cita creada exitosamente');
      return newAppointment;
    } catch (error) {
      console.error('Error in createAppointment:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear la cita');
      throw error;
    }
  };

  const createHoliday = async (holidayData: Omit<Holiday, 'id'>): Promise<Holiday> => {
    try {
      const formattedDate = formatDateForSupabase(holidayData.date);
      
      // Verificar si ya existe un feriado
      const { data: existingHoliday } = await supabase
          .from('holidays')
          .select('*')
          .eq('date', formattedDate)
          .single();

      if (existingHoliday) {
          toast.error('Ya existe un feriado en esta fecha');
          throw new Error('Ya existe un feriado en esta fecha');
      }

      const { data, error } = await supabase
          .from('holidays')
          .insert([{ ...holidayData, date: formattedDate }])
          .select()
          .single();

      if (error) throw error;

      const newHoliday = { ...data, date: parseSupabaseDate(data.date) };
      setHolidays(prev => [...prev, newHoliday]);

      // Enviar notificación a todos los clientes registrados
      try {
          const phones = appointments.map(app => app.clientPhone);
          const uniquePhones = [...new Set(phones)]; // Eliminar duplicados
          let messagesSent = 0;

          // Enviar mensajes uno por uno, con límite
          for (const phone of uniquePhones) {
              if (messagesSent >= 9) {
                  console.log('Límite de mensajes diarios alcanzado');
                  break;
              }

              try {
                  await sendWhatsAppMessage(
                      phone,
                      'holiday_added',
                      {
                          date: newHoliday.date.toLocaleDateString('es-ES')
                      }
                  );
                  messagesSent++;
                  await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (error) {
                  if (error instanceof Error && error.message.includes('exceeded the 9 daily messages limit')) {
                      console.log('Límite de mensajes diarios alcanzado');
                      break;
                  }
                  console.error(`Error sending message to ${phone}:`, error);
              }
          }

          // Si no se pudieron enviar todos los mensajes, mostrar una notificación
          if (messagesSent < uniquePhones.length) {
              toast('No se pudieron enviar todos los mensajes - Límite diario alcanzado', {
                  icon: '⚠️'
              });
          }
      } catch (msgError) {
          console.error('Error sending holiday notifications:', msgError);
          toast('No se pudieron enviar las notificaciones', {
              icon: '⚠️'
          });
      }

      toast.success('Feriado agregado exitosamente');
      return newHoliday;
    } catch (error) {
      console.error('Error creating holiday:', error);
      if (error instanceof Error) {
          toast.error(error.message);
      } else {
          toast.error('Error al crear el feriado');
      }
      throw error;
    }
  };

  const createBlockedTime = async (blockedTimeData: Omit<BlockedTime, 'id'>): Promise<BlockedTime> => {
    try {
        const formattedDate = formatDateForSupabase(blockedTimeData.date);
        
        const { data, error } = await supabase
            .from('blocked_times')
            .insert([{
                ...blockedTimeData,
                date: formattedDate,
                time: blockedTimeData.timeSlots?.[0] || '',
                timeSlots: blockedTimeData.timeSlots || [blockedTimeData.time]
            }])
            .select()
            .single();

        if (error) throw error;

        const newBlockedTime = { 
            ...data, 
            date: parseSupabaseDate(data.date),
            time: data.time || data.timeSlots?.[0] || '',
            timeSlots: data.timeSlots || [data.time]
        };

        setBlockedTimes(prev => [...prev, newBlockedTime]);

        // Enviar notificación a todos los clientes registrados
        try {
            const phones = appointments.map(app => app.clientPhone);
            const uniquePhones = [...new Set(phones)];
            let messagesSent = 0;

            // Enviar mensajes uno por uno, con límite
            for (const phone of uniquePhones) {
                if (messagesSent >= 9) {
                    toast('Límite de mensajes diarios alcanzado', {
                        icon: '⚠️',
                        duration: 4000
                    });
                    break;
                }

                try {
                    await sendWhatsAppMessage(
                        phone,
                        'time_blocked',
                        {
                            date: newBlockedTime.date.toLocaleDateString('es-ES'),
                            time: newBlockedTime.time
                        }
                    );
                    messagesSent++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    if (error instanceof Error && error.message.includes('exceeded the 9 daily messages limit')) {
                        break;
                    }
                    console.error(`Error sending message to ${phone}:`, error);
                }
            }

            if (messagesSent < uniquePhones.length) {
                toast('No se pudieron enviar todas las notificaciones - Límite diario alcanzado', {
                    icon: '⚠️',
                    duration: 4000
                });
            }
        } catch (msgError) {
            console.error('Error sending blocked time notifications:', msgError);
            toast('Error al enviar notificaciones', {
                icon: '⚠️',
                duration: 4000
            });
        }

        toast.success('Horario bloqueado exitosamente');
        return newBlockedTime;
    } catch (error) {
        console.error('Error creating blocked time:', error);
        toast.error('Error al bloquear el horario');
        throw error;
    }
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
        const appointmentToDelete = appointments.find(app => app.id === id);
        if (!appointmentToDelete) {
            throw new Error('Cita no encontrada');
        }

        // Primero eliminamos de la base de datos
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting from database:', error);
            toast.error('Error al cancelar la cita');
            throw error;
        }

        // Actualizar el estado local
        setAppointments(prev => prev.filter(app => app.id !== id));

        // Intentar enviar la notificación
        try {
            await sendWhatsAppMessage(
                appointmentToDelete.clientPhone,
                'appointment_cancelled',
                {
                    clientName: appointmentToDelete.clientName,
                    date: appointmentToDelete.date.toLocaleDateString('es-ES'),
                    time: appointmentToDelete.time
                }
            );
            toast.success('Cita cancelada exitosamente');
        } catch (msgError) {
            console.error('Error al enviar notificación:', msgError);
            toast.success('Cita cancelada exitosamente (sin notificación)');
        }
    } catch (error) {
        if (error instanceof Error && !error.message.includes('exceeded the 9 daily messages limit')) {
            toast.error('Error al cancelar la cita');
        }
    }
};

  const removeHoliday = async (id: string): Promise<void> => {
    try {
        const holidayToRemove = holidays.find(h => h.id === id);
        if (!holidayToRemove) {
            throw new Error('Feriado no encontrado');
        }

        // Primero eliminamos de la base de datos
        const { error } = await supabase
            .from('holidays')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error Supabase:', error);
            throw new Error('Error al eliminar el feriado de la base de datos');
        }

        // Si la eliminación fue exitosa, notificamos
        try {
            const phones = appointments.map(app => app.clientPhone);
            const uniquePhones = [...new Set(phones)]; // Eliminar duplicados
            let messagesSent = 0;

            // Enviar mensajes uno por uno, con límite
            for (const phone of uniquePhones) {
                if (messagesSent >= 9) {
                    toast('Límite de mensajes diarios alcanzado', {
                        icon: '⚠️',
                        duration: 4000
                    });
                    break;
                }

                try {
                    await sendWhatsAppMessage(
                        phone,
                        'holiday_removed',
                        {
                            date: new Date(holidayToRemove.date).toLocaleDateString('es-ES')
                        }
                    );
                    messagesSent++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    if (error instanceof Error && error.message.includes('exceeded the 9 daily messages limit')) {
                        break;
                    }
                    console.error(`Error sending message to ${phone}:`, error);
                }
            }

            // Si no se pudieron enviar todos los mensajes
            if (messagesSent < uniquePhones.length) {
                toast('No se pudieron enviar todas las notificaciones - Límite diario alcanzado', {
                    icon: '⚠️',
                    duration: 4000
                });
            }
        } catch (msgError) {
            console.error('Error enviando notificaciones:', msgError);
            toast('Error al enviar notificaciones', {
                icon: '⚠️',
                duration: 4000
            });
        }

        // Actualizar el estado local
        setHolidays(prev => prev.filter(h => h.id !== id));
        toast.success('Feriado eliminado exitosamente');
    } catch (error) {
        console.error('Error removing holiday:', error);
        toast.error(error instanceof Error ? error.message : 'Error al eliminar el feriado');
        throw error;
    }
  };

  const removeBlockedTime = async (id: string): Promise<void> => {
    try {
        const blockedTimeToRemove = blockedTimes.find(bt => bt.id === id);
        if (!blockedTimeToRemove) {
            throw new Error('Horario bloqueado no encontrado');
        }

        const { error } = await supabase
            .from('blocked_times')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error Supabase:', error);
            throw new Error('Error al eliminar el horario bloqueado');
        }

        try {
            const phones = appointments.map(app => app.clientPhone);
            const uniquePhones = [...new Set(phones)];
            let messagesSent = 0;

            for (const phone of uniquePhones) {
                if (messagesSent >= 9) {
                    toast('Límite de mensajes diarios alcanzado', {
                        icon: '⚠️',
                        duration: 4000
                    });
                    break;
                }

                try {
                    await sendWhatsAppMessage(
                        phone,
                        'time_unblocked',
                        {
                            date: new Date(blockedTimeToRemove.date).toLocaleDateString('es-ES'),
                            time: blockedTimeToRemove.time
                        }
                    );
                    messagesSent++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    if (error instanceof Error && error.message.includes('exceeded the 9 daily messages limit')) {
                        break;
                    }
                    console.error(`Error sending message to ${phone}:`, error);
                }
            }

            if (messagesSent < uniquePhones.length) {
                toast('No se pudieron enviar todas las notificaciones - Límite diario alcanzado', {
                    icon: '⚠️',
                    duration: 4000
                });
            }
        } catch (msgError) {
            console.error('Error enviando notificaciones:', msgError);
            toast('Error al enviar notificaciones', {
                icon: '⚠️',
                duration: 4000
            });
        }

        setBlockedTimes(prev => prev.filter(bt => bt.id !== id));
        toast.success('Horario desbloqueado exitosamente');
    } catch (error) {
        console.error('Error removing blocked time:', error);
        toast.error(error instanceof Error ? error.message : 'Error al desbloquear el horario');
        throw error;
    }
  };

  const handleSetUserPhone = (phone: string) => {
    setUserPhone(phone);
    localStorage.setItem('userPhone', phone);
  };

  return (
    <AppointmentContext.Provider value={{
      appointments,
      holidays,
      blockedTimes,
      userPhone,
      setUserPhone: handleSetUserPhone,
      deleteAppointment,
      createAppointment,
      createHoliday,
      createBlockedTime,
      removeHoliday,
      removeBlockedTime,
      isTimeSlotAvailable,
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};