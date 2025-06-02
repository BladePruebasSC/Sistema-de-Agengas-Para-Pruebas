import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarView from '../components/Calendar/CalendarView';
import BookingForm from '../components/BookingForm';
import toast from 'react-hot-toast';

const BookingPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<'select' | 'confirm'>('select');
  
  const handleDateTimeSelected = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };
  
  const handleBookingSuccess = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setBookingStep('select');
  };
  
  const handleCancelBooking = () => {
    setBookingStep('select');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Agenda tu Cita</h1>
      <p className="text-gray-600 mb-6">
        Selecciona tu fecha y hora preferida para tu próxima visita.
      </p>
      
      {bookingStep === 'select' ? (
        <div>
          <CalendarView
            onDateTimeSelected={handleDateTimeSelected}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
          />
          
          {selectedDate && selectedTime && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setBookingStep('confirm')}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md shadow transition duration-200 ease-in-out transform hover:scale-105"
              >
                Continuar con la Reserva
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
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