import React, { useState } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import toast from 'react-hot-toast';
import AppointmentList from '../components/AppointmentList';

const AppointmentsPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const { appointments, deleteAppointment } = useAppointments();

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const matches = numbers.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

    if (!matches) return '';

    const [, first, second, third] = matches;
    if (!second) return first;
    if (!third) return `${first}-${second}`;
    return `${first}-${second}-${third}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 10) {
      setVerifiedPhone(numbers);
      setIsVerified(true);
      console.log('Buscando citas para el teléfono:', numbers);
    } else {
      toast.error('Por favor ingrese un número válido de 10 dígitos');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    const isConfirmed = window.confirm('¿Estás seguro de que deseas cancelar esta cita?');
    
    if (isConfirmed) {
      try {
        console.log('Intentando eliminar cita con ID:', id);
        await deleteAppointment(id);
        
        // Esperamos un momento para asegurarnos que la UI se actualice
        setTimeout(() => {
          // Verificamos si la cita aún existe en la lista
          const citaExiste = appointments.some(app => app.id === id);
          if (citaExiste) {
            toast.error('La cita no se eliminó correctamente');
          } else {
            toast.success('Cita cancelada correctamente');
          }
        }, 1000);

      } catch (error) {
        console.error('Error al cancelar la cita:', error);
        toast.error('Error al cancelar la cita. Por favor intente nuevamente.');
      }
    }
  };

  const userAppointments = React.useMemo(() => {
    if (!isVerified || !verifiedPhone) return [];

    const filtered = appointments.filter(app => {
      const cleanAppPhone = app.clientPhone?.replace(/\D/g, '') || '';
      const cleanVerifiedPhone = verifiedPhone.replace(/\D/g, '');
      
      const matches = cleanAppPhone === cleanVerifiedPhone;
      console.log('Comparando:', {
        cleanAppPhone,
        cleanVerifiedPhone,
        matches,
        appointment: app
      });
      
      return matches;
    });

    console.log('Citas encontradas:', filtered.length, filtered);
    return filtered;
  }, [appointments, isVerified, verifiedPhone]);

  // Componente de renderizado de citas
  const RenderAppointments = () => {
    console.log('Renderizando citas:', userAppointments.length);
    
    if (userAppointments.length === 0) {
      return <p className="text-gray-500 text-center">No tienes citas programadas.</p>;
    }

    return (
      <div className="space-y-4">
        {userAppointments.map(appointment => (
          <div 
            key={appointment.id} 
            className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {appointment.clientName}
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Fecha:</span>{' '}
                    {new Date(appointment.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Hora:</span>{' '}
                    {appointment.time}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Teléfono:</span>{' '}
                    {formatPhoneNumber(appointment.clientPhone)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  appointment.confirmed 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.confirmed ? 'Confirmada' : 'Pendiente'}
                </span>
                <button
                  onClick={() => handleCancelAppointment(appointment.id)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Cancelar cita
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizado condicional principal
  if (!isVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium mb-4">Ver Mis Citas</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Número de teléfono
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="000-000-0000"
                className="block w-full p-2 border border-gray-300 rounded-md"
                maxLength={12}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Ver mis citas
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Mis Citas</h2>
          <p className="text-sm text-gray-600">
            Teléfono: {formatPhoneNumber(verifiedPhone)}
          </p>
        </div>
        <RenderAppointments />
      </div>
    </div>
  );
};

export default AppointmentsPage;