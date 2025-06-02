import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Trash2 } from 'lucide-react';
import { useAppointments } from '../context/AppointmentContext';
import toast from 'react-hot-toast';

// Función para formatear el teléfono automáticamente
function formatPhone(value: string) {
  // Solo números
  let digits = value.replace(/\D/g, '');
  // Limita a 10 dígitos (sin el +1)
  digits = digits.slice(0, 10);

  let formatted = '+1 ';
  if (digits.length > 0) formatted += '(';
  if (digits.length >= 1) formatted += digits.slice(0, 3);
  if (digits.length >= 4) formatted += ') ';
  if (digits.length >= 4) formatted += digits.slice(3, 6);  
  if (digits.length >= 7) formatted += '-';
  if (digits.length >= 7) formatted += digits.slice(6, 10);

  return formatted;
}

const AppointmentList: React.FC = () => {
  const { appointments, deleteAppointment } = useAppointments();
  const [phone, setPhone] = useState('');
  const [show, setShow] = useState(false);

  // Filtra las citas por el número ingresado
  const myAppointments = appointments.filter(
    app => app.clientPhone.replace(/\D/g, '') === phone.replace(/\D/g, '')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShow(true);
  };

  const handleDelete = async (appointment: any) => {
    try {
      await deleteAppointment(appointment.id);
      toast.success('Cita cancelada exitosamente');
    } catch (error) {
      toast.error('Error al cancelar la cita');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[70vh]">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-3 rounded-full">
            <User className="h-8 w-8 text-red-600" />
          </div>
        </div>
        {!show && (
          <>
            <h2 className="text-2xl font-bold text-center mb-2">Consulta tus Citas</h2>
            <p className="text-gray-600 mb-6 text-center">
              Ingresa tu número de teléfono para ver tus citas agendadas.
            </p>
            <form onSubmit={handleSubmit} className="mb-4">
              <input
                type="text"
                placeholder="Tu número de teléfono"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 mb-2"
                required
              />
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow transition duration-200"
              >
                Consultar
              </button>
            </form>
          </>
        )}
        {show && (
          <div>
            <button
              className="mb-4 text-red-600 hover:underline"
              onClick={() => {
                setShow(false);
                setPhone('');
              }}
            >
              ← Volver
            </button>
            <h3 className="font-semibold mb-2 text-center">Tus citas:</h3>
            {myAppointments.length === 0 ? (
              <p className="text-gray-500 text-center">No tienes citas registradas con ese número.</p>
            ) : (
              <div className="space-y-4">
                {myAppointments.map((appointment) => (
                  <div key={appointment.id} className="bg-gray-50 rounded-md p-4 shadow flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-gray-700 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(appointment.date, 'EEEE, d MMMM yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 mb-1">
                        <Clock className="h-4 w-4" />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 mb-1">
                        <User className="h-4 w-4" />
                        <span>{appointment.clientName}</span>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        appointment.confirmed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.confirmed ? 'Confirmada' : 'Pendiente'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(appointment)}
                      className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 mt-2 md:mt-0"
                      title="Cancelar cita"
                    >
                      <Trash2 className="h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;