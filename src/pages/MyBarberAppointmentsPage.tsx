import React, { useState, useEffect } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import { Appointment, Barber } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Lock, LogIn, LogOut, Calendar, Clock, User, ListChecks } from 'lucide-react';

const MyBarberAppointmentsPage: React.FC = () => {
  const {
    verifyBarberAccessKey,
    loggedInBarber,
    logoutBarber,
    getAppointmentsForBarber
  } = useAppointments();

  const [accessKey, setAccessKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (loggedInBarber) {
      setAppointments(getAppointmentsForBarber(loggedInBarber.id));
    } else {
      setAppointments([]);
    }
  }, [loggedInBarber, getAppointmentsForBarber]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const barber = await verifyBarberAccessKey(accessKey);
    if (!barber) {
      setError('Clave de acceso incorrecta o barbero no activo.');
      setAccessKey(''); // Clear the input after failed attempt
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    logoutBarber();
    setAccessKey('');
    setError(null);
  };

  if (!loggedInBarber) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <Lock size={48} className="text-red-500 mb-3" />
          <h2 className="text-2xl font-semibold text-center text-gray-700">Acceso para Barberos</h2>
          <p className="text-sm text-gray-500 text-center mt-1">Ingresa tu clave para ver tus citas agendadas.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700">
              Clave de Acceso
            </label>
            <input
              type="password"
              id="accessKey"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <LogIn size={16} className="mr-2" />
            )}
            {isLoading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <ListChecks size={32} className="text-red-600 mr-3" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Citas Agendadas</h1>
            <p className="text-md text-gray-600">Barbero: {loggedInBarber.name}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 md:mt-0 flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <LogOut size={16} className="mr-2" />
          Cerrar Sesión
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-xl text-gray-500">No tienes citas programadas para hoy o en el futuro.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(app => (
            <div key={app.id} className="bg-white shadow-lg rounded-lg p-5 border-l-4 border-red-500">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                <h3 className="text-lg font-semibold text-red-700">{app.service}</h3>
                <p className="text-sm text-gray-500 sm:text-right">
                  {format(new Date(app.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center text-gray-700">
                  <Clock size={14} className="mr-2 text-red-500" />
                  Hora: <span className="font-medium ml-1">{app.time}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <User size={14} className="mr-2 text-red-500" />
                  Cliente: <span className="font-medium ml-1">{app.clientName}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <User size={14} className="mr-2 opacity-0" /> {/* Placeholder for alignment */}
                  Teléfono: <span className="font-medium ml-1">{app.clientPhone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBarberAppointmentsPage;
