import React, { useState, useEffect } from 'react';
import { Clock, Save, User, Calendar } from 'lucide-react';
import { useAppointments } from '../../context/AppointmentContext';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

const BarberScheduleManager: React.FC = () => {
  const { 
    barbers, 
    barberSchedules, 
    businessHours,
    updateBarberSchedule
  } = useAppointments();
  
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [scheduleSettings, setScheduleSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedBarberId) {
      // Inicializar horarios del barbero seleccionado
      const initialSchedule = DAYS_OF_WEEK.map(day => {
        const existing = barberSchedules.find(bs => 
          bs.barber_id === selectedBarberId && bs.day_of_week === day.value
        );
        
        // Si no existe horario específico, usar el horario general del negocio
        const businessDay = businessHours.find(bh => bh.day_of_week === day.value);
        
        return existing || {
          barber_id: selectedBarberId,
          day_of_week: day.value,
          is_available: businessDay?.is_open || true,
          morning_start: businessDay?.morning_start || '07:00',
          morning_end: businessDay?.morning_end || '12:00',
          afternoon_start: businessDay?.afternoon_start || '15:00',
          afternoon_end: businessDay?.afternoon_end || '21:00'
        };
      });
      setScheduleSettings(initialSchedule);
    }
  }, [selectedBarberId, barberSchedules, businessHours]);

  const handleScheduleChange = (dayIndex: number, field: string, value: any) => {
    const newSchedule = [...scheduleSettings];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };
    setScheduleSettings(newSchedule);
  };

  const saveBarberSchedule = async () => {
    if (!selectedBarberId) {
      toast.error('Selecciona un barbero');
      return;
    }

    setLoading(true);
    try {
      for (const schedule of scheduleSettings) {
        await updateBarberSchedule(selectedBarberId, schedule.day_of_week, schedule);
      }
      toast.success('Horarios del barbero actualizados exitosamente');
    } catch (error) {
      console.error('Error guardando horarios del barbero:', error);
      toast.error('Error al guardar los horarios');
    } finally {
      setLoading(false);
    }
  };

  const copyFromBusinessHours = () => {
    if (!selectedBarberId) return;
    
    const newSchedule = DAYS_OF_WEEK.map(day => {
      const businessDay = businessHours.find(bh => bh.day_of_week === day.value);
      return {
        barber_id: selectedBarberId,
        day_of_week: day.value,
        is_available: businessDay?.is_open || true,
        morning_start: businessDay?.morning_start || '07:00',
        morning_end: businessDay?.morning_end || '12:00',
        afternoon_start: businessDay?.afternoon_start || '15:00',
        afternoon_end: businessDay?.afternoon_end || '21:00'
      };
    });
    setScheduleSettings(newSchedule);
    toast.info('Horarios copiados desde la configuración general');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6"> {/* Adjusted padding */}
      <div className="flex items-center mb-6">
        <User className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold">Horarios por Barbero</h2>
      </div>

      {/* Selector de barbero */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Barbero
        </label>
        {/* Adjusted for responsiveness: flex-col on small, md:flex-row on medium+ */}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
          <select
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="block w-full md:w-64 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" // w-full on small, md:w-64 on medium+
          >
            <option value="">Seleccionar barbero</option>
            {barbers.map(barber => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
          
          {selectedBarberId && (
            <button
              onClick={copyFromBusinessHours}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm w-full md:w-auto" // w-full on small, md:w-auto on medium+
            >
              Copiar horarios generales
            </button>
          )}
        </div>
      </div>

      {selectedBarberId && (
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              Horarios de {barbers.find(b => b.id === selectedBarberId)?.name}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Configura los horarios específicos para este barbero. Si no se configuran, se usarán los horarios generales del negocio.
            </p>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day, index) => {
                const daySchedule = scheduleSettings[index] || {};
                return (
                  <div key={day.value} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{day.label}</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={daySchedule.is_available || false}
                          onChange={(e) => handleScheduleChange(index, 'is_available', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">Disponible</span>
                      </label>
                    </div>

                    {daySchedule.is_available && (
                      // Adjusted for responsiveness: grid-cols-1 on small/medium, lg:grid-cols-2 on large+
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mañana
                          </label>
                          {/* Time inputs container: flex-col on smallest, sm:flex-row on small+ */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                            <input
                              type="time"
                              value={daySchedule.morning_start || '07:00'}
                              onChange={(e) => handleScheduleChange(index, 'morning_start', e.target.value)}
                              className="block w-full sm:w-auto flex-1 p-2 border border-gray-300 rounded-md text-sm" // flex-1 to share space on sm+
                            />
                            <span className="self-center text-gray-500 px-1 text-center sm:text-left">a</span> {/* Centered text for stacked, left for row */}
                            <input
                              type="time"
                              value={daySchedule.morning_end || '12:00'}
                              onChange={(e) => handleScheduleChange(index, 'morning_end', e.target.value)}
                              className="block w-full sm:w-auto flex-1 p-2 border border-gray-300 rounded-md text-sm" // flex-1 to share space on sm+
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tarde
                          </label>
                          {/* Time inputs container: flex-col on smallest, sm:flex-row on small+ */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                            <input
                              type="time"
                              value={daySchedule.afternoon_start || '15:00'}
                              onChange={(e) => handleScheduleChange(index, 'afternoon_start', e.target.value)}
                              className="block w-full sm:w-auto flex-1 p-2 border border-gray-300 rounded-md text-sm" // flex-1 to share space on sm+
                            />
                            <span className="self-center text-gray-500 px-1 text-center sm:text-left">a</span> {/* Centered text for stacked, left for row */}
                            <input
                              type="time"
                              value={daySchedule.afternoon_end || '21:00'}
                              onChange={(e) => handleScheduleChange(index, 'afternoon_end', e.target.value)}
                              className="block w-full sm:w-auto flex-1 p-2 border border-gray-300 rounded-md text-sm" // flex-1 to share space on sm+
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botón de guardar */}
          {/* Adjusted for responsiveness: full width on small, auto on sm+ */}
          <div className="flex flex-col sm:flex-row sm:justify-end mt-6">
            <button
              onClick={saveBarberSchedule}
              disabled={loading}
              className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Guardando...' : 'Guardar Horarios'}
            </button>
          </div>
        </div>
      )}

      {!selectedBarberId && (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Selecciona un barbero para configurar sus horarios específicos.</p>
        </div>
      )}
    </div>
  );
};

export default BarberScheduleManager;