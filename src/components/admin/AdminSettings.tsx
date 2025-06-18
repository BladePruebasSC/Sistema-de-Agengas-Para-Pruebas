import React, { useState, useEffect } from 'react';
import { Clock, Save, Settings as SettingsIcon, Users, Calendar, Phone, Plus, Trash2, Edit, Star } from 'lucide-react';
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

const AdminSettings: React.FC = () => {
  const { 
    adminSettings, 
    barbers, 
    businessHours, 
    updateAdminSettings,
    createBarber,
    updateBarber,
    deleteBarber,
    updateBusinessHours
  } = useAppointments();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'hours' | 'barbers'>('general');
  
  // Estados para configuración general
  const [generalSettings, setGeneralSettings] = useState({
    early_booking_restriction: false,
    early_booking_hours: 12,
    restricted_hours: ['7:00 AM', '8:00 AM'],
    multiple_barbers_enabled: false,
    default_barber_id: '',
    reviews_enabled: true
  });

  // Estados para horarios de negocio
  const [hoursSettings, setHoursSettings] = useState<any[]>([]);

  // Estados para barberos
  const [newBarber, setNewBarber] = useState({ name: '', phone: '', access_key: '' });
  const [editingBarber, setEditingBarber] = useState<string | null>(null);
  const [editingBarberData, setEditingBarberData] = useState({ id: null as string | null, name: '', phone: '', access_key: '' });

  // Todas las horas disponibles para seleccionar
  const allAvailableHours = [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', 
    '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  useEffect(() => {
    if (adminSettings) {
      setGeneralSettings({
        early_booking_restriction: adminSettings.early_booking_restriction,
        early_booking_hours: adminSettings.early_booking_hours,
        restricted_hours: adminSettings.restricted_hours || ['7:00 AM', '8:00 AM'],
        multiple_barbers_enabled: adminSettings.multiple_barbers_enabled,
        default_barber_id: adminSettings.default_barber_id || '',
        reviews_enabled: adminSettings.reviews_enabled !== false // Por defecto true
      });
    }
  }, [adminSettings]);

  useEffect(() => {
    // Inicializar horarios de negocio
    const initialHours = DAYS_OF_WEEK.map(day => {
      const existing = businessHours.find(bh => bh.day_of_week === day.value);
      return existing || {
        day_of_week: day.value,
        is_open: true,
        morning_start: '07:00',
        morning_end: '12:00',
        afternoon_start: '15:00',
        afternoon_end: '21:00'
      };
    });
    setHoursSettings(initialHours);
  }, [businessHours]);

  const saveGeneralSettings = async () => {
    setLoading(true);
    try {
      await updateAdminSettings(generalSettings);
    } catch (error) {
      console.error('Error guardando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessHours = async () => {
    setLoading(true);
    try {
      for (const hours of hoursSettings) {
        await updateBusinessHours(hours.day_of_week, hours);
      }
    } catch (error) {
      console.error('Error guardando horarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestrictedHourToggle = (hour: string) => {
    const currentHours = generalSettings.restricted_hours || [];
    if (currentHours.includes(hour)) {
      setGeneralSettings({
        ...generalSettings,
        restricted_hours: currentHours.filter(h => h !== hour)
      });
    } else {
      setGeneralSettings({
        ...generalSettings,
        restricted_hours: [...currentHours, hour]
      });
    }
  };

  const handleHoursChange = (dayIndex: number, field: string, value: any) => {
    const newHours = [...hoursSettings];
    newHours[dayIndex] = { ...newHours[dayIndex], [field]: value };
    setHoursSettings(newHours);
  };

  const handleCreateBarber = async () => {
    if (!newBarber.name.trim() || !newBarber.phone.trim() || !newBarber.access_key.trim()) {
      toast.error('Por favor completa todos los campos, incluyendo la clave de acceso.');
      return;
    }

    try {
      await createBarber({
        name: newBarber.name.trim(),
        phone: newBarber.phone.trim(),
        access_key: newBarber.access_key.trim(),
        is_active: true
      });
      setNewBarber({ name: '', phone: '', access_key: '' });
    } catch (error) {
      console.error('Error creando barbero:', error);
    }
  };

  const handleUpdateBarber = async (id: string, data: any) => {
    try {
      await updateBarber(id, data);
      setEditingBarber(null);
    } catch (error) {
      console.error('Error actualizando barbero:', error);
    }
  };

  const handleDeleteBarber = async (id: string) => {
    // Check if the barber to be deleted is the default barber
    if (adminSettings.default_barber_id === id) {
      toast.error('Este barbero está configurado como el barbero por defecto. Por favor, selecciona un barbero por defecto diferente antes de eliminar este.');
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar este barbero? Esta acción es irreversible y también eliminará sus horarios específicos.')) {
      try {
        await deleteBarber(id);
        // Optionally, if the deleted barber was the one being edited, clear the edit form
        if (editingBarber === id) {
          setEditingBarber(null);
          setEditingBarberData({ id: null, name: '', phone: '', access_key: '' });
        }
      } catch (error) {
        console.error('Error eliminando barbero:', error);
        // Error toast is already handled in deleteBarber context function
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <SettingsIcon className="h-6 w-6 text-red-600 mr-2" />
        <h2 className="text-xl font-semibold">Configuración del Sistema</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'general'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('general')}
        >
          <Clock className="h-4 w-4 inline mr-1" />
          General
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'hours'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('hours')}
        >
          <Calendar className="h-4 w-4 inline mr-1" />
          Horarios
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'barbers'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('barbers')}
        >
          <Users className="h-4 w-4 inline mr-1" />
          Barberos
        </button>
      </div>

      {/* Configuración General */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Sistema de reseñas */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Star className="h-5 w-5 text-yellow-500 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-2">Sistema de Reseñas</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Controla si los clientes pueden dejar reseñas y calificaciones.
                </p>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={generalSettings.reviews_enabled}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      reviews_enabled: e.target.checked
                    })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm font-medium">
                    Habilitar sistema de reseñas
                  </span>
                </label>
                
                {!generalSettings.reviews_enabled && (
                  <p className="text-sm text-orange-600 mt-2">
                    Las reseñas existentes seguirán siendo visibles, pero no se podrán crear nuevas.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Múltiples barberos */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-blue-500 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-2">Configuración de Barberos</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Habilita el modo múltiples barberos para permitir selección de barbero específico.
                </p>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generalSettings.multiple_barbers_enabled}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        multiple_barbers_enabled: e.target.checked
                      })}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm font-medium">
                      Habilitar múltiples barberos
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barbero por defecto:
                    </label>
                    <select
                      value={generalSettings.default_barber_id}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        default_barber_id: e.target.value
                      })}
                      className="block w-64 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Seleccionar barbero</option>
                      {barbers.map(barber => (
                        <option key={barber.id} value={barber.id}>
                          {barber.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                      checked={generalSettings.early_booking_restriction}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        early_booking_restriction: e.target.checked
                      })}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm font-medium">
                      Activar restricción de antelación para horarios específicos
                    </span>
                  </label>

                  {generalSettings.early_booking_restriction && (
                    <div className="ml-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horas de antelación requeridas:
                        </label>
                        <select
                          value={generalSettings.early_booking_hours}
                          onChange={(e) => setGeneralSettings({
                            ...generalSettings,
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
                                generalSettings.restricted_hours?.includes(hour)
                                  ? 'bg-orange-100 border-orange-300 text-orange-800'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={generalSettings.restricted_hours?.includes(hour) || false}
                                onChange={() => handleRestrictedHourToggle(hour)}
                              />
                              <span className="text-sm">{hour}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Los clientes deberán reservar con al menos {generalSettings.early_booking_hours} horas de antelación 
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
              onClick={saveGeneralSettings}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      )}

      {/* Configuración de Horarios */}
      {activeTab === 'hours' && (
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Horarios de Trabajo</h3>
            <p className="text-gray-600 text-sm mb-6">
              Configura los horarios de trabajo para cada día de la semana.
            </p>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day, index) => {
                const dayHours = hoursSettings[index] || {};
                return (
                  <div key={day.value} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{day.label}</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={dayHours.is_open || false}
                          onChange={(e) => handleHoursChange(index, 'is_open', e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm">Abierto</span>
                      </label>
                    </div>

                    {dayHours.is_open && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mañana
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="time"
                              value={dayHours.morning_start || '07:00'}
                              onChange={(e) => handleHoursChange(index, 'morning_start', e.target.value)}
                              className="block w-full p-2 border border-gray-300 rounded-md text-sm"
                            />
                            <span className="self-center text-gray-500">a</span>
                            <input
                              type="time"
                              value={dayHours.morning_end || '12:00'}
                              onChange={(e) => handleHoursChange(index, 'morning_end', e.target.value)}
                              className="block w-full p-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tarde
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="time"
                              value={dayHours.afternoon_start || '15:00'}
                              onChange={(e) => handleHoursChange(index, 'afternoon_start', e.target.value)}
                              className="block w-full p-2 border border-gray-300 rounded-md text-sm"
                            />
                            <span className="self-center text-gray-500">a</span>
                            <input
                              type="time"
                              value={dayHours.afternoon_end || '21:00'}
                              onChange={(e) => handleHoursChange(index, 'afternoon_end', e.target.value)}
                              className="block w-full p-2 border border-gray-300 rounded-md text-sm"
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
          <div className="flex justify-end">
            <button
              onClick={saveBusinessHours}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Configuración de Barberos */}
      {activeTab === 'barbers' && (
        <div className="space-y-6">
          {/* Agregar nuevo barbero */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Agregar Nuevo Barbero</h3>
            {/* Adjusted grid to md:grid-cols-4 to accommodate the new field and button */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newBarber.name}
                  onChange={(e) => setNewBarber({ ...newBarber, name: e.target.value })}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  placeholder="Nombre del barbero"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono WhatsApp
                </label>
                <input
                  type="tel"
                  value={newBarber.phone}
                  onChange={(e) => setNewBarber({ ...newBarber, phone: e.target.value })}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clave de Acceso (para ver sus citas)
                </label>
                <input
                  type="text"
                  value={newBarber.access_key}
                  onChange={(e) => setNewBarber({ ...newBarber, access_key: e.target.value })}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  placeholder="Clave secreta"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCreateBarber}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full md:w-auto justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de barberos */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Barberos Activos</h3>
            {barbers.length === 0 ? (
              <p className="text-gray-500">No hay barberos registrados.</p>
            ) : (
              <div className="space-y-3">
                {barbers.map((barber) => (
                  <div key={barber.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">{barber.name}</p>
                        <p className="font-medium text-gray-900">{barber.name}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {barber.phone}
                        </p>
                        {/* Displaying access key here is a security risk if not handled carefully.
                            Typically, admin might see it or it's only set/reset.
                            For now, we are not displaying it directly in the list.
                            It should be editable in the editing form.
                        */}
                        {/* <p className="text-xs text-gray-400">Key: {barber.access_key || 'N/A'}</p> */}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // When editing, you would typically fetch the full barber details
                          // including the access_key to populate the editing form.
                          const currentBarber = barbers.find(b => b.id === barber.id);
                          if (currentBarber) {
                            setEditingBarber(currentBarber.id);
                            setEditingBarberData({
                              id: currentBarber.id,
                              name: currentBarber.name,
                              phone: currentBarber.phone || '',
                              access_key: currentBarber.access_key || '' // Use empty string if null/undefined for form
                            });
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar barbero"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBarber(barber.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar barbero" // Changed title
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Barber Editing Modal/Form */}
          {editingBarber && editingBarberData.id && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
                <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-6">
                  Editar Barbero: {editingBarberData.name}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre del barbero"
                      value={editingBarberData.name}
                      onChange={(e) => setEditingBarberData({ ...editingBarberData, name: e.target.value })}
                      className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="+1234567890"
                      value={editingBarberData.phone}
                      onChange={(e) => setEditingBarberData({ ...editingBarberData, phone: e.target.value })}
                      className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva Clave de Acceso
                    </label>
                    <input
                      type="text"
                      placeholder="Dejar vacío para no cambiar clave"
                      value={editingBarberData.access_key || ''} // Ensure it's controlled, use empty string for null
                      onChange={(e) => setEditingBarberData({ ...editingBarberData, access_key: e.target.value })}
                      className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si dejas este campo vacío, la clave de acceso actual no se modificará.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                  <button
                    onClick={() => {
                      setEditingBarber(null);
                      setEditingBarberData({ id: null, name: '', phone: '', access_key: '' }); // Reset data
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (!editingBarberData.id) return; // Should not happen if modal is visible

                      const updates: { name: string; phone: string; access_key?: string } = {
                        name: editingBarberData.name.trim(),
                        phone: editingBarberData.phone.trim(),
                      };

                      if (editingBarberData.access_key && editingBarberData.access_key.trim() !== '') {
                        updates.access_key = editingBarberData.access_key.trim();
                      }
                      // If access_key is empty, we don't include it in `updates`, so it won't be changed.

                      handleUpdateBarber(editingBarberData.id, updates);
                      setEditingBarberData({ id: null, name: '', phone: '', access_key: '' }); // Reset after save
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <Save className="h-4 w-4 inline mr-2" />
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;