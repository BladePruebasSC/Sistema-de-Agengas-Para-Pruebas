import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppointments } from '../../context/AppointmentContext';
import toast from 'react-hot-toast';

const HolidayForm: React.FC = () => {
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const { createHoliday, barbers, adminSettings } = useAppointments();
  const [selectedBarberIdForHoliday, setSelectedBarberIdForHoliday] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error('Por favor selecciona una fecha');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Por favor ingresa una descripción del feriado');
      return;
    }
    
    try {
      await createHoliday({
        date,
        description,
        barber_id: selectedBarberIdForHoliday || undefined // Pass undefined if null/empty
      });
      // Toast success is handled within createHoliday context function

      // Reset form
      setDate(null);
      setDescription('');
      setSelectedBarberIdForHoliday(null);
    } catch (error) {
      // Error toast is handled by createHoliday if it throws
      console.error("Error in HolidayForm handleSubmit:", error);
    }
  };
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Agregar Feriado</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha del Feriado
            </label>
            <DatePicker
              selected={date}
              onChange={(date: Date) => setDate(date)}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              placeholderText="Selecciona una fecha"
              minDate={new Date()}
              locale={es}
              dateFormat="dd/MM/yyyy"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del Feriado
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              placeholder="ej. Navidad"
            />
          </div>

          {adminSettings.multiple_barbers_enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barbero (Opcional)
              </label>
              <select
                value={selectedBarberIdForHoliday || ''}
                onChange={(e) => setSelectedBarberIdForHoliday(e.target.value || null)}
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
                Si seleccionas un barbero, el feriado aplicará solo a él.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow transition duration-150 ease-in-out"
          >
            Agregar Feriado
          </button>
        </div>
      </form>
    </div>
  );
};

export default HolidayForm;