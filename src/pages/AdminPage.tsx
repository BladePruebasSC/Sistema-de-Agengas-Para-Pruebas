import React, { useState } from 'react';
import AdminPanel from '../components/admin/AdminPanel';
import { Lock } from 'lucide-react';

const ADMIN_PASSWORD = 'A1234a';

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-6">Acceso Administrativo</h2>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                placeholder="Ingresa la contraseña"
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow transition duration-200"
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

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