import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppointments } from '../../context/AppointmentContext';
import { generateTimeSlots } from '../../utils/businessHours';
import toast from 'react-hot-toast';

interface BlockedTimeFormProps {
  onBlockTime: (date: Date | null, time: string | null, reason: string) => void;
}

const BlockedTimeForm: React.FC<BlockedTimeFormProps> = ({ onBlockTime }) => {
  const [date, setDate] = useState<Date | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  
  const { createBlockedTime } = useAppointments();
  
  const handleTimeToggle = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error('Por favor selecciona una fecha');
      return;
    }

    if (selectedTimes.length === 0) {
      toast.error('Por favor selecciona al menos un horario');
      return;
    }

    if (!reason.trim()) {
      toast.error('Por favor ingresa un motivo');
      return;
    }

    // Guarda cada horario como un registro separado
    for (const time of selectedTimes) {
      await createBlockedTime({
        date,
        time,
        reason
      });
    }

    toast.success('Horarios bloqueados exitosamente');

    // Reset form
    setDate(null);
    setSelectedTimes([]);
    setReason('');
  };
  
  const availableTimeSlots = date ? generateTimeSlots(date) : [];
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Bloquear Horarios</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Fecha
            </label>
            <DatePicker
              selected={date}
              onChange={(date: Date) => {
                setDate(date);
                setSelectedTimes([]);
              }}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              placeholderText="Selecciona fecha"
              minDate={new Date()}
              locale={es}
              dateFormat="dd/MM/yyyy"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del Bloqueo
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              placeholder="ej. Reunión de Personal"
            />
          </div>
        </div>
        
        {date && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona los Horarios a Bloquear
            </label>
            
            {availableTimeSlots.length === 0 ? (
              <p className="text-gray-500">No hay horarios laborables en este día.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {availableTimeSlots.map((time) => (
                  <label
                    key={time}
                    className={`flex items-center justify-center p-2 border rounded-md cursor-pointer transition-colors ${
                      selectedTimes.includes(time)
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedTimes.includes(time)}
                      onChange={() => handleTimeToggle(time)}
                    />
                    <span>{time}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow"
          >
            Bloquear Horarios Seleccionados
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlockedTimeForm;