import React, { useEffect, useState } from "react";
import { Cita } from "../../context/AppointmentContext";

const CitasList: React.FC = () => {
  const [citas, setCitas] = useState<Cita[]>([]);

  useEffect(() => {
    // Aquí deberías hacer fetch a tu backend o base de datos
    // Por ahora, ejemplo con datos mock
    fetch("/api/citas") // Cambia esto por tu endpoint real
      .then(res => res.json())
      .then(data => setCitas(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Todas las Citas</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Servicio</th>
          </tr>
        </thead>
        <tbody>
          {citas.map((cita) => (
            <tr key={cita.id}>
              <td>{cita.nombre}</td>
              <td>{cita.telefono}</td>
              <td>{cita.fecha}</td>
              <td>{cita.hora}</td>
              <td>{cita.servicio}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CitasList;