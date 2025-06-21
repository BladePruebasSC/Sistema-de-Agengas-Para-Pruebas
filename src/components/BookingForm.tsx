import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
// import { services as mockServices } from '../utils/mockData'; // No longer use mockServices directly for display
import { useAppointments } from '../context/AppointmentContext';
import { Phone, MessageSquare, Calendar as CalendarIcon, Clock as ClockIcon, User } from 'lucide-react';
import { es } from 'date-fns/locale';

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  selectedBarberId?: string;
  onSuccess: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  selectedDate,
  selectedTime,
  selectedBarberId,
  onSuccess
}) => {
  const { createAppointment, barbers, adminSettings, services } = useAppointments(); // Get services from context
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    service: '', // Initialize service as empty or handle loading state
    barber_id: selectedBarberId || adminSettings.default_barber_id || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Set default service when services are loaded from context
    if (services && services.length > 0 && !formData.service) {
      setFormData(prev => ({
        ...prev,
        service: services[0].id
      }));
    }
  }, [services, formData.service]);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const truncated = numbers.slice(0, 10);
    const matches = truncated.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!matches) return '';
    const formatted = matches.slice(1).filter(Boolean).join('-');
    const remaining = 12 - formatted.length;
    return formatted + '_'.repeat(Math.max(0, remaining));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      clientPhone: formatted
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'clientPhone') return;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'El nombre es obligatorio';
    }
    if (!formData.clientPhone.trim() || formData.clientPhone.includes('_')) {
      newErrors.clientPhone = 'El teléfono es obligatorio';
    } else if (!/^\d{3}-\d{3}-\d{4}$/.test(formData.clientPhone)) {
      newErrors.clientPhone = 'Formato: 555-123-4567';
    }
    if (adminSettings.multiple_barbers_enabled && !formData.barber_id) {
      newErrors.barber_id = 'Debe seleccionar un barbero';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const cleanPhone = formData.clientPhone.replace(/\D/g, '');
      
      // Usar el barbero seleccionado o el por defecto
      const finalBarberId = selectedBarberId || formData.barber_id || adminSettings.default_barber_id;
      
      await createAppointment({
        date: selectedDate,
        time: selectedTime,
        clientName: formData.clientName.trim(),
        clientPhone: cleanPhone,
        service: formData.service,
        barber_id: finalBarberId, // Asegurar que se use el barbero correcto
        confirmed: true
      });
      toast.success(
        <div>
          <p className="font-bold">¡Cita confirmada!</p>
          <p>Se enviará notificación al barbero por WhatsApp</p>
        </div>,
        { duration: 5000 }
      );
      onSuccess();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      if (error.message === 'El horario seleccionado ya no está disponible') {
        toast.error('Este horario ya no está disponible. Por favor selecciona otro.');
      } else if (error.code === '23505') {
        toast.error('Ya existe una cita en este horario. Por favor selecciona otro.');
      } else {
        toast.error('Error al crear la cita. Por favor intenta nuevamente.');
      }
    }
  };

  const getBarberName = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    return barber?.name || 'Barbero';
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Detalles de la cita</h3>
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-gray-600">
          <CalendarIcon className="w-5 h-5" />
          {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <ClockIcon className="w-5 h-5" />
          {selectedTime}
        </div>
        {selectedBarberId && (
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-5 h-5" />
            {getBarberName(selectedBarberId)}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecciona el servicio
            </label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            >
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price}
                </option>
              ))}
            </select>
          </div>

          {adminSettings.multiple_barbers_enabled && !selectedBarberId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecciona el barbero
              </label>
              <select
                name="barber_id"
                value={formData.barber_id}
                onChange={handleChange}
                className={`block w-full p-2 border ${
                  errors.barber_id ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
              >
                <option value="">Seleccionar barbero</option>
                {barbers.map(barber => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
              {errors.barber_id && (
                <p className="mt-1 text-sm text-red-600">{errors.barber_id}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              className={`block w-full p-2 border ${
                errors.clientName ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
              placeholder="Juan Pérez"
            />
            {errors.clientName && (
              <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                Teléfono
              </div>
            </label>
            <input
              type="text"
              name="clientPhone"
              value={formData.clientPhone}
              onChange={handlePhoneChange}
              className={`block w-full p-2 border ${
                errors.clientPhone ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
              placeholder="000-000-0000"
            />
            {errors.clientPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.clientPhone}</p>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex items-center">
          <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-sm text-gray-600">
            Se notificará automáticamente al barbero por WhatsApp después de reservar.
          </p>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Confirmar cita
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;