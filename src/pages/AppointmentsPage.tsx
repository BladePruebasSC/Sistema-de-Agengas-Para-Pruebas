import { useState } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import AppointmentList from '../components/AppointmentList';
import { User } from 'lucide-react';

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const AppointmentsPage: React.FC = () => {
  const { userPhone, setUserPhone } = useAppointments();
  const [inputPhone, setInputPhone] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPhone(formatPhone(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPhone(inputPhone);
  };

  if (!userPhone) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <User className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-6">
            Consulta tus citas
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de teléfono
              </label>
              <input
                type="text"
                value={inputPhone}
                onChange={handleInputChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                placeholder="Ingresa tu número de teléfono"
                required
                maxLength={12}
                pattern="\d{3}-\d{3}-\d{4}"
                autoComplete="tel"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow transition duration-200"
            >
              Consultar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AppointmentList />;
};

export default AppointmentsPage;