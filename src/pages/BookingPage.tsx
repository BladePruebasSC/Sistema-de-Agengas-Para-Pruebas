import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarView from '../components/Calendar/CalendarView';
import BookingForm from '../components/BookingForm';
import toast from 'react-hot-toast';
import { useAppointments } from '../context/AppointmentContext';

const BookingPage: React.FC = () => {
  const { isTimeSlotAvailable } = useAppointments();
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<'select' | 'confirm'>('select');

  const allHours = [
    '7:00 AM',
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
    '7:00 PM'
  ];

  // Verificar disponibilidad cuando cambie la fecha
  const checkAvailableHours = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const availableSlots = [];
      for (const hour of allHours) {
        const isAvailable = await isTimeSlotAvailable(date, hour);
        if (isAvailable) {
          availableSlots.push(hour);
        }
      }
      setAvailableHours(availableSlots);
    } catch (error) {
      console.error('Error checking available hours:', error);
      toast.error('Error al verificar horarios disponibles');
    } finally {
      setIsLoading(false);
    }
  }, [isTimeSlotAvailable, allHours]);

  // Actualizar horas disponibles cuando cambie la fecha
  useEffect(() => {
    if (selectedDate) {
      checkAvailableHours(selectedDate);
    }
  }, [selectedDate, checkAvailableHours]);

  const handleDateTimeSelected = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };
  
  const handleBookingSuccess = () => {
    setSelectedDate(null);
    setSelectedTime('');
    setBookingStep('select');
  };
  
  const handleCancelBooking = () => {
    setBookingStep('select');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Agenda tu Cita</h1>
      
      {/* Calendario y Selector de Hora */}
      <CalendarView
        onDateTimeSelected={handleDateTimeSelected}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onDateChange={setSelectedDate}
        onTimeChange={setSelectedTime}
      />

      {/* Formulario de reserva */}
      {selectedDate && selectedTime && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handleCancelBooking}
              className="text-gray-600 hover:text-gray-800 font-medium flex items-center"
            >
              ← Volver al Calendario
            </button>
            
            <div className="text-gray-600">
              Seleccionado: {format(selectedDate!, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} a las {selectedTime}
            </div>
          </div>
          
          <BookingForm
            selectedDate={selectedDate!}
            selectedTime={selectedTime!}
            onSuccess={handleBookingSuccess}
          />
        </div>
      )}
    </div>
  );
};

export default BookingPage;