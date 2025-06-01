import React from 'react';
import AdminPanel from '../components/admin/AdminPanel';

const AdminPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Administración</h1>
      <p className="text-gray-600 mb-6">
        Gestiona los días feriados y horarios bloqueados.
      </p>
      
      <AdminPanel />
    </div>
  );
};

export default AdminPage;