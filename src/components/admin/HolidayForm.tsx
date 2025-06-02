import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppointments } from '../../context/AppointmentContext';
import toast from 'react-hot-toast';

const HolidayForm: React.FC = () => {
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const { holidays, createHoliday } = useAppointments();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error('Por favor selecciona una fecha');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Por favor ingresa una descripción');
      return;
    }
    
    // Verifica si ya existe un feriado para esa fecha
    const exists = holidays.some(
      h => new Date(h.date).toDateString() === date.toDateString()
    );
    if (exists) {
      toast.error('Ya existe un feriado para esa fecha');
      return;
    }
    
    createHoliday(date, description);
    toast.success('Feriado agregado');
    
    // Reset form
    setDate(null);
    setDescription('');
  };
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Agregar Feriado</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        
        <div className="mt-4">
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow"
          >
            Agregar Feriado
          </button>
        </div>
      </form>
    </div>
  );
};

export default HolidayForm;