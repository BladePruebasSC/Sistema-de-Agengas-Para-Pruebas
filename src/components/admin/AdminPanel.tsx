import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppointments } from '../../context/AppointmentContext';
import HolidayForm from './HolidayForm';
import BlockedTimeForm from './BlockedTimeForm';
import { Holiday, BlockedTime } from '../../types';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'holidays' | 'blockedTimes'>('holidays');
  const { holidays, blockedTimes, removeHoliday, removeBlockedTime, createBlockedTime } = useAppointments();
  
  const handleBlockTime = async (selectedDate: Date | null, selectedTime: string | null, reason: string) => {
    if (!selectedDate || !selectedTime) return;

    await createBlockedTime({
      date: selectedDate,
      time: selectedTime,
      reason: reason,
    });
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Panel de Administración</h2>
        
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'holidays'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('holidays')}
          >
            Gestión de Feriados
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'blockedTimes'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('blockedTimes')}
          >
            Horas Bloqueadas
          </button>
        </div>
        
        {activeTab === 'holidays' ? (
          <div>
            <HolidayForm />
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Feriados Programados</h3>
              
              {holidays.length === 0 ? (
                <p className="text-gray-500">No hay feriados programados.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {holidays.map((holiday) => (
                    <HolidayCard
                      key={holiday.id}
                      holiday={holiday}
                      onDelete={removeHoliday}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <BlockedTimeForm onBlockTime={handleBlockTime} />
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Horarios Bloqueados</h3>
              
              {blockedTimes.length === 0 ? (
                <p className="text-gray-500">No hay horarios bloqueados.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {blockedTimes.map((blockedTime) => (
                    <BlockedTimeCard
                      key={blockedTime.id}
                      blockedTime={blockedTime}
                      onDelete={removeBlockedTime}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface HolidayCardProps {
  holiday: Holiday;
  onDelete: (id: string) => void;
}

const HolidayCard: React.FC<HolidayCardProps> = ({ holiday, onDelete }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <CalendarIcon className="h-5 w-5 text-red-500 mt-1 mr-2" />
          <div>
            <h4 className="font-medium">{holiday.description}</h4>
            <p className="text-gray-600 text-sm">
              {format(holiday.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDelete(holiday.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Eliminar feriado"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

interface BlockedTimeCardProps {
  blockedTime: BlockedTime;
  onDelete: (id: string) => void;
}

const BlockedTimeCard: React.FC<BlockedTimeCardProps> = ({ blockedTime, onDelete }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <Clock className="h-5 w-5 text-orange-500 mt-1 mr-2" />
          <div>
            <h4 className="font-medium">{blockedTime.reason}</h4>
            <p className="text-gray-600 text-sm">
              {format(blockedTime.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              <span
                className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {blockedTime.time}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(blockedTime.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Eliminar horario bloqueado"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;