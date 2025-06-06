import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { services } from '../utils/mockData';
import { useAppointments } from '../context/AppointmentContext';
import { Phone, MessageSquare, Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';
import { es } from 'date-fns/locale';

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onSuccess: () => void;
}

const allHours = [
  '7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'
];

const BookingForm: React.FC<BookingFormProps> = ({
  selectedDate,
  selectedTime,
  onSuccess
}) => {
  const { getDayAvailability, createAppointment } = useAppointments();
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '___-___-____',
    service: services[0].id
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ... el resto de tus funciones handleChange, handlePhoneChange, validateForm igual que antes

  const checkAvailableHours = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const availability = await getDayAvailability(date, allHours);
      setAvailableHours(allHours.filter(hour => availability[hour]));
    } catch (error) {
      toast.error('Error al verificar horarios disponibles');
    } finally {
      setIsLoading(false);
    }
  }, [getDayAvailability]);

  // <-- Aquí está el truco, cuando cambia la fecha, SIEMPRE carga -->
  useEffect(() => {
    if (selectedDate) checkAvailableHours(selectedDate);
    // IMPORTANTE: Limpia horarios al cambiar fecha para evitar parpadeo de datos viejos
    setAvailableHours([]);
  }, [selectedDate, checkAvailableHours]);

  // --- resto del código igual, solo el bloque de loader lo ponemos SIEMPRE visible ---

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
      {/* ... resto de tu formulario ... */}
      <div className="mt-6">
        <h4 className="font-semibold mb-2">Horarios disponibles:</h4>
        {isLoading ? (
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block w-5 h-5 border-2 border-t-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></span>
            <span className="text-gray-500">Cargando horarios...</span>
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {availableHours.length === 0
              ? <li className="text-gray-400">No hay horarios disponibles</li>
              : availableHours.map(hour => (
                  <li
                    key={hour}
                    className={`px-3 py-1 rounded text-sm ${
                      hour === selectedTime
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {hour}
                  </li>
                ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BookingForm;