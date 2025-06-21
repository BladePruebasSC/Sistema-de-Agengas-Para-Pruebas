import React from "react";
import { useAppointments } from "../context/AppointmentContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from 'lucide-react'; // Icono para cancelar
import toast from 'react-hot-toast';

const AppointmentList: React.FC = () => {
  const { getFutureAppointments, barbers, cancelAppointment, adminSettings } = useAppointments();

  // Obtener solo las citas futuras activas (no canceladas)
  // Si se quisiera mostrar TODAS las citas (incluyendo pasadas o canceladas para el admin, se usaría 'appointments')
  // Pero para "Citas Programadas", getFutureAppointments (que filtra no canceladas y futuras) es adecuado.
  const futureAppointments = getFutureAppointments();

  // Ordenar por fecha y hora
  const sortedAppointments = [...futureAppointments].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.time.localeCompare(b.time);
  });

  const getBarberName = (barber_id?: string) => {
    if (!barber_id) return 'No asignado';
    const barber = barbers.find(b => b.id === barber_id);
    return barber?.name || 'Barbero desconocido';
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Citas programadas</h2>
      {sortedAppointments.length === 0 ? (
        <div className="text-gray-500">No hay citas programadas.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Nombre</th>
                <th className="px-4 py-2 border">Teléfono</th>
                <th className="px-4 py-2 border">Fecha</th>
                <th className="px-4 py-2 border">Hora</th>
                <th className="px-4 py-2 border">Servicio</th>
                <th className="px-4 py-2 border">Barbero</th>
                <th className="px-4 py-2 border">Estado</th>
                <th className="px-4 py-2 border">Acciones</th> {/* Nueva columna */}
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.map((appointment) => (
                <tr key={appointment.id} className={`${appointment.cancelled ? 'bg-red-50 line-through' : ''}`}>
                  <td className="px-4 py-2 border">{appointment.clientName}</td>
                  <td className="px-4 py-2 border">{appointment.clientPhone}</td>
                  <td className="px-4 py-2 border">
                    {format(new Date(appointment.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-2 border">{appointment.time}</td>
                  <td className="px-4 py-2 border">{appointment.service}</td>
                  <td className="px-4 py-2 border">{getBarberName(appointment.barber_id)}</td>
                  <td className="px-4 py-2 border">
                    {appointment.cancelled ? (
                      <span className="text-red-600 font-medium">Cancelada</span>
                    ) : appointment.confirmed ? (
                      <span className="text-green-600 font-medium">Confirmada</span>
                    ) : (
                      <span className="text-yellow-700 font-medium">Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {!appointment.cancelled && (
                      <button
                        onClick={async () => {
                          if (window.confirm(`¿Estás seguro de que deseas cancelar la cita de ${appointment.clientName} el ${format(new Date(appointment.date), "d/MM/yy")} a las ${appointment.time}?`)) {
                            try {
                              await cancelAppointment(appointment.id);
                              toast.success('Cita cancelada exitosamente.');
                            } catch (error) {
                              toast.error('Error al cancelar la cita.');
                              console.error("Error cancelling appointment from admin list:", error);
                            }
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                        title="Cancelar Cita"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-500">
        Mostrando solo citas activas de hoy en adelante. Las citas canceladas se conservan para estadísticas.
      </div>
    </div>
  );
};

export default AppointmentList;