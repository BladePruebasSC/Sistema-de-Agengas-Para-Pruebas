import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Scissors, Trash2 } from 'lucide-react';
import { useAppointments } from '../context/AppointmentContext';
import toast from 'react-hot-toast';

const AppointmentList: React.FC = () => {
  const { appointments, deleteAppointment, userPhone } = useAppointments();
  
  // Filter appointments by user's phone number
  const userAppointments = appointments.filter(app => app.clientPhone === userPhone);
  
  // Sort appointments by date and time
  const sortedAppointments = [...userAppointments].sort((a, b) => {
    const dateComparison = a.date.getTime() - b.date.getTime();
    if (dateComparison !== 0) return dateComparison;
    return a.time.localeCompare(b.time);
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment(id);
    } catch (error) {
      console.error('Error al eliminar la cita:', error);
    }
  };
  
  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Mis Citas</h2>
        
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tienes citas programadas.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedAppointments.map((appointment) => (
              <div key={appointment.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start">
                    <div className="rounded-md bg-red-50 p-2 mr-3">
                      <Calendar className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{appointment.service}</h3>
                      <div className="mt-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{format(appointment.date, 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex items-center space-x-4">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-1" />
                        <span>{appointment.clientName}</span>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Cancelar cita"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;