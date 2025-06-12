import React, { useState, useEffect } from 'react';
import { Clock, Save, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AdminSettings {
  id?: string;
  early_booking_restriction: boolean;
  early_booking_hours: number;
  restricted_hours: string[];
  created_at?: string;
  updated_at?: string;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    early_booking_restriction: false,
    early_booking_hours: 12,
    restricted_hours: ['7:00 AM', '8:00 AM']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Todas las horas disponibles para seleccionar
  const allAvailableHours = [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', 
    '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          ...data,
          restricted_hours: data.restricted_hours || ['7:00 AM', '8:00 AM']
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existingSettings } = await supabase
        .from('admin_settings')
        .select('id')
        .single();

      const settingsToSave = {
        early_booking_restriction: settings.early_booking_restriction,
        early_booking_hours: settings.early_booking_hours,
        restricted_hours: settings.restricted_hours,
        updated_at: new Date().toISOString()
      };

      if (existingSettings) {
        // Actualizar configuración existente
        const { error } = await supabase
          .from('admin_settings')
          .update(settingsToSave)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        // Crear nueva configuración
        const { error } = await supabase
          .from('admin_settings')
          .insert([settingsToSave]);

        if (error) throw error;
      }

      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleRestrictedHourToggle = (hour: string) => {
    const currentHours = settings.restricted_hours || [];
    if (currentHours.includes(hour)) {
      setSettings({
        ...settings,
        restricted_hours: currentHours.filter(h => h !== hour)
      });
    } else {
      setSettings({
        ...settings,
        restricted_hours: [...currentHours, hour]
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <SettingsIcon className="h-6 w-6 text-red-600 mr-2" />
        <h2 className="text-xl font-semibold">Configuración del Sistema</h2>
      </div>

      <div className="space-y-6">
        {/* Restricción de reservas tempranas */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-orange-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">Restricción de Reservas con Antelación</h3>
              <p className="text-gray-600 text-sm mb-4">
                Controla qué horarios requieren reserva con antelación.
              </p>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.early_booking_restriction}
                    onChange={(e) => setSettings({
                      ...settings,
                      early_booking_restriction: e.target.checked
                    })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm font-medium">
                    Activar restricción de antelación para horarios específicos
                  </span>
                </label>

                {settings.early_booking_restriction && (
                  <div className="ml-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horas de antelación requeridas:
                      </label>
                      <select
                        value={settings.early_booking_hours}
                        onChange={(e) => setSettings({
                          ...settings,
                          early_booking_hours: parseInt(e.target.value)
                        })}
                        className="block w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      >
                        <option value={6}>6 horas</option>
                        <option value={12}>12 horas</option>
                        <option value={24}>24 horas</option>
                        <option value={48}>48 horas</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecciona los horarios que requieren antelación:
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {allAvailableHours.map((hour) => (
                          <label
                            key={hour}
                            className={`flex items-center justify-center p-2 border rounded-md cursor-pointer transition-colors ${
                              settings.restricted_hours?.includes(hour)
                                ? 'bg-orange-100 border-orange-300 text-orange-800'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={settings.restricted_hours?.includes(hour) || false}
                              onChange={() => handleRestrictedHourToggle(hour)}
                            />
                            <span className="text-sm">{hour}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Los clientes deberán reservar con al menos {settings.early_booking_hours} horas de antelación 
                        para los horarios seleccionados.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botón de guardar */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;