import React, { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { services } from '../utils/mockData';
import { useAppointments } from '../context/AppointmentContext';
import { Phone, MessageSquare, Calendar, Clock, Scissors } from 'lucide-react';

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onSuccess: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  selectedDate,
  selectedTime,
  onSuccess
}) => {
  const { createAppointment } = useAppointments();

  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '___-___-____',
    service: services[0].id
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhoneNumber = (value: string) => {
    // Elimina todo excepto números
    const numbers = value.replace(/\D/g, '');
    
    // Garantiza que no exceda 10 dígitos
    const truncated = numbers.slice(0, 10);
    
    // Formatea el número según el patrón XXX-XXX-XXXX
    const matches = truncated.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    
    if (!matches) return '';
    
    const formatted = matches
      .slice(1)
      .filter(Boolean)
      .join('-');
      
    // Si está incompleto, rellena con guiones bajos
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const selectedService = services.find(s => s.id === formData.service)?.name || '';

    try {
      await createAppointment({
        date: selectedDate,
        time: selectedTime,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        service: selectedService,
        confirmed: true
      });

      toast.success(
        <div>
          <p className="font-bold">¡Cita confirmada!</p>
          <p>Confirmación enviada por WhatsApp a {formData.clientPhone}</p>
        </div>,
        { duration: 5000 }
      );

      onSuccess();
    } catch (error) {
      toast.error('Error al crear la cita. Por favor intenta nuevamente.');
    }
  };

  const selectedServiceDetails = services.find(s => s.id === formData.service);

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Completa tu reserva</h2>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-2">Detalles de la cita</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Calendar className="text-gray-600 mr-2 h-5 w-5" />
              <span>{format(selectedDate, 'MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <Clock className="text-gray-600 mr-2 h-5 w-5" />
              <span>{selectedTime}</span>
            </div>
            <div className="flex items-center">
              <Scissors className="text-gray-600 mr-2 h-5 w-5" />
              <span>{selectedServiceDetails?.name || 'Servicio'}</span>
            </div>
          </div>
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
              Se enviará un mensaje de confirmación a tu WhatsApp después de reservar.
            </p>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow transition duration-200 ease-in-out transform hover:scale-105"
            >
              Confirmar cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;