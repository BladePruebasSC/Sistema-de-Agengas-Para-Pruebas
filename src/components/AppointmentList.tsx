import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Scissors } from 'lucide-react';
import { useAppointments } from '../context/AppointmentContext';

const AppointmentList: React.FC = () => {
  const { appointments } = useAppointments();
  
  // Sort appointments by date and time
  const sortedAppointments = [...appointments].sort((a, b) => {
    // Sort by date first
    const dateComparison = a.date.getTime() - b.date.getTime();
    if (dateComparison !== 0) return dateComparison;
    
    // If same date, sort by time
    return a.time.localeCompare(b.time);
  });
  
  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">My Appointments</h2>
        
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You don't have any appointments yet.</p>
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
                  
                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-1" />
                      <span>{appointment.clientName}</span>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        appointment.confirmed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
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