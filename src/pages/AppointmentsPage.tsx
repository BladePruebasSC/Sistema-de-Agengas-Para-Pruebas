import React from 'react';
import AppointmentList from '../components/AppointmentList';

const AppointmentsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Mis Citas</h1>
      <p className="text-gray-600 mb-6">
        Ver y gestionar tus próximas citas.
      </p>
      
      <AppointmentList />
    </div>
  );
};

export default AppointmentsPage;