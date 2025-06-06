import React from "react";
import { useAppointments } from "../context/AppointmentContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AppointmentList: React.FC = () => {
  const { appointments } = useAppointments();

  // Ordenar por fecha y hora
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Todas las citas agendadas</h2>
      {sortedAppointments.length === 0 ? (
        <div className="text-gray-500">No hay citas agendadas.</div>
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
                <th className="px-4 py-2 border">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-4 py-2 border">{appointment.clientName}</td>
                  <td className="px-4 py-2 border">{appointment.clientPhone}</td>
                  <td className="px-4 py-2 border">
                    {format(new Date(appointment.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-2 border">{appointment.time}</td>
                  <td className="px-4 py-2 border">{appointment.service}</td>
                  <td className="px-4 py-2 border">
                    {appointment.confirmed ? (
                      <span className="text-green-600 font-medium">Confirmada</span>
                    ) : (
                      <span className="text-yellow-700 font-medium">Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;