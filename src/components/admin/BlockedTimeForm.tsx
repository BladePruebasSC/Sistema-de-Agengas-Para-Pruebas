import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppointments } from '../../context/AppointmentContext';
import toast from 'react-hot-toast';

interface BlockedTimeFormProps {
  onBlockTime?: (date: Date, selectedTimes: string[], reason: string, barberId?: string | null) => Promise<void>;
}

const BlockedTimeForm: React.FC<BlockedTimeFormProps> = ({ onBlockTime }) => {
  const [date, setDate] = useState<Date | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const { createBlockedTime, getAvailableHoursForDate, barbers, adminSettings } = useAppointments();
  const [selectedBarberIdForBlock, setSelectedBarberIdForBlock] = useState<string | null>(null);
  
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
      toast.error('Debe seleccionar una fecha');
      return;
    }

    if (selectedTimes.length === 0) {
      toast.error('Debe seleccionar al menos un horario');
      return;
    }

    try {
      await createBlockedTime({
        date: date,
        timeSlots: selectedTimes.sort(),
        reason: reason.trim() || 'Horario bloqueado',
        barber_id: selectedBarberIdForBlock || undefined // Pass undefined if null/empty
      });
      // Success toast is handled within createBlockedTime context function
      
      // Limpiar el formulario
      setDate(null);
      setSelectedTimes([]);
      setReason('');
      setSelectedBarberIdForBlock(null);
      
    } catch (error) {
      // Error toast is handled by createBlockedTime if it throws
      console.error('Error in BlockedTimeForm handleSubmit:', error);
    }
  };
  
  // Usar los horarios dinámicos basados en la configuración de negocio y barbero seleccionado
  const availableTimeSlots = date ? getAvailableHoursForDate(date, selectedBarberIdForBlock || undefined) : [];
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Bloquear Horarios</h3>
      
      <form onSubmit={handleSubmit}>
        <div className={`grid grid-cols-1 ${adminSettings.multiple_barbers_enabled ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 mb-4`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Fecha
            </label>
            <DatePicker
              selected={date}
              onChange={(date: Date | null) => {
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

          {adminSettings.multiple_barbers_enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barbero (Opcional)
              </label>
              <select
                value={selectedBarberIdForBlock || ''}
                onChange={(e) => {
                  setSelectedBarberIdForBlock(e.target.value || null);
                  setSelectedTimes([]); // Reset selected times when barber changes
                }}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              >
                <option value="">General (para todos)</option>
                {barbers.map(barber => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Si seleccionas un barbero, el bloqueo y los horarios disponibles aplicarán solo a él.
              </p>
            </div>
          )}
        </div>
        
        {date && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona los Horarios a Bloquear {selectedBarberIdForBlock ? `para ${barbers.find(b=>b.id === selectedBarberIdForBlock)?.name}` : '(General)'}
            </label>
            
            {availableTimeSlots.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No hay horarios laborables configurados para este día {selectedBarberIdForBlock ? `para ${barbers.find(b=>b.id === selectedBarberIdForBlock)?.name}` : 'de forma general'}.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {availableTimeSlots.map((time) => (
                  <label
                    key={time}
                    className={`flex items-center justify-center p-2 border rounded-md cursor-pointer transition-all duration-150 ease-in-out text-xs sm:text-sm ${
                      selectedTimes.includes(time)
                        ? 'bg-red-500 border-red-600 text-white shadow-md scale-105'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:shadow-sm'
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
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={!date || selectedTimes.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
          >
            Bloquear Horarios Seleccionados
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlockedTimeForm;