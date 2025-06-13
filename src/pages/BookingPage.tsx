import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarView from '../components/Calendar/CalendarView';
import BookingForm from '../components/BookingForm';
import toast from 'react-hot-toast';
import { useAppointments } from '../context/AppointmentContext';

const BookingPage: React.FC = () => {
  const { adminSettings, barbers } = useAppointments();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  // Auto-seleccionar barbero por defecto si no hay múltiples barberos habilitados
  useEffect(() => {
    if (!adminSettings.multiple_barbers_enabled && adminSettings.default_barber_id) {
      setSelectedBarberId(adminSettings.default_barber_id);
    } else if (!adminSettings.multiple_barbers_enabled && barbers.length === 1) {
      setSelectedBarberId(barbers[0].id);
    }
  }, [adminSettings, barbers]);

  const handleDateTimeSelected = (date: Date, time: string, barberId?: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    if (barberId) {
      setSelectedBarberId(barberId);
    }
  };
  
  const handleBookingSuccess = () => {
    setSelectedDate(null);
    setSelectedTime('');
    setSelectedBarberId(null);
  };
  
  const handleCancelBooking = () => {
    setSelectedTime('');
  };

  const handleBarberChange = (barberId: string | null) => {
    setSelectedBarberId(barberId);
    setSelectedTime(''); // Limpiar tiempo cuando cambia barbero
  };

  const getBarberName = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    return barber?.name || 'Barbero';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Agenda tu Cita</h1>
      
      {/* Calendario y Selector de Hora */}
      <CalendarView
        onDateTimeSelected={handleDateTimeSelected}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedBarberId={selectedBarberId}
        onDateChange={setSelectedDate}
        onTimeChange={setSelectedTime}
        onBarberChange={handleBarberChange}
      />

      {/* Formulario de reserva */}
      {selectedDate && selectedTime && (!adminSettings.multiple_barbers_enabled || selectedBarberId) && (
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
              {selectedBarberId && adminSettings.multiple_barbers_enabled && (
                <span> con {getBarberName(selectedBarberId)}</span>
              )}
            </div>
          </div>
          
          <BookingForm
            selectedDate={selectedDate!}
            selectedTime={selectedTime!}
            selectedBarberId={selectedBarberId || undefined}
            onSuccess={handleBookingSuccess}
          />
        </div>
      )}
    </div>
  );
};

export default BookingPage;