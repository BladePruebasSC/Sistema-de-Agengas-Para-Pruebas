import React from 'react';
import { User } from 'lucide-react';
import { Barber } from '../../types';

interface BarberSelectorProps {
  barbers: Barber[];
  selectedBarberId: string | null | undefined;
  onSelectBarber: (barberId: string) => void;
}

const BarberSelector: React.FC<BarberSelectorProps> = ({
  barbers,
  selectedBarberId,
  onSelectBarber
}) => {
  if (barbers.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600 font-medium">No hay barberos disponibles.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-md font-medium mb-3 text-gray-700">Selecciona tu barbero:</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {barbers.map((barber) => (
          <button
            key={barber.id}
            onClick={() => onSelectBarber(barber.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedBarberId === barber.id
                ? 'border-red-500 bg-red-50 text-red-800'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                selectedBarberId === barber.id
                  ? 'bg-red-100'
                  : 'bg-gray-100'
              }`}>
                <User className={`h-5 w-5 ${
                  selectedBarberId === barber.id
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`} />
              </div>
              <div>
                <p className="font-medium">{barber.name}</p>
                <p className="text-sm text-gray-500">Barbero profesional</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BarberSelector;