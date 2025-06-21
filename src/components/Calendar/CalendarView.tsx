import React, { useState, useEffect, useCallback } from 'react';
import { format, isToday, isBefore, startOfDay, getHours, getMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import Calendar from 'react-calendar';
import { useAppointments } from '../../context/AppointmentContext';
import TimeSlotPicker from './TimeSlotPicker';
import BarberSelector from './BarberSelector';
import { isSameDate } from '../../utils/dateUtils';
import './Calendar.css';

function parseHourLabel(hourLabel: string): { hour: number; minute: number; isPm: boolean } {
  const [time, modifier] = hourLabel.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const isPm = modifier === 'PM';
  if (isPm && hour !== 12) hour += 12;
  if (!isPm && hour === 12) hour = 0;
  return { hour, minute, isPm };
}

function isEarlyHourRestricted(date: Date, hourLabel: string, adminSettings: any) {
  if (!adminSettings.restricted_hours?.includes(hourLabel)) return false;
  if (!adminSettings.early_booking_restriction) return false;

  const target = new Date(date);
  const { hour, minute } = parseHourLabel(hourLabel);
  target.setHours(hour, minute, 0, 0);

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < adminSettings.early_booking_hours;
}

interface CalendarViewProps {
  onDateTimeSelected: (date: Date, time: string, barberId?: string) => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedBarberId?: string | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string | null) => void;
  onBarberChange?: (barberId: string | null) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  onDateTimeSelected,
  selectedDate,
  selectedTime,
  selectedBarberId,
  onDateChange,
  onTimeChange,
  onBarberChange
}) => {
  const { 
    isTimeSlotAvailable, 
    holidays, 
    adminSettings, 
    barbers, 
    getAvailableHoursForDate 
  } = useAppointments();
  
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const today = startOfDay(new Date());

  // Filtrado rápido y bloqueo de horas pasadas y restricción de horas tempranas
  const getFilteredHours = useCallback((date: Date, barberId?: string) => {
    const hoursForDay = getAvailableHoursForDate(date);
    const now = new Date();

    return hoursForDay.filter(label => {
      // Restricción para horarios específicos (configuración de admin)
      if (isEarlyHourRestricted(date, label, adminSettings)) {
        return false;
      }
      // Si es el mismo día, filtrar horas pasadas
      if (isToday(date)) {
        const { hour, minute } = parseHourLabel(label);
        return hour > now.getHours() || (hour === now.getHours() && minute > now.getMinutes());
      }
      return true;
    });
  }, [getAvailableHoursForDate, adminSettings]);

  // Consulta paralela de disponibilidad y filtrado de horas pasadas
  const checkAvailability = useCallback(async (date: Date, barberId?: string) => {
    setIsLoading(true);
    try {
      const filteredHours = getFilteredHours(date, barberId);
      const results = await Promise.all(
        filteredHours.map(hour => isTimeSlotAvailable(date, hour, barberId))
      );
      const available = filteredHours.filter((hour, idx) => results[idx]);
      setAvailableHours(available);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableHours([]);
    } finally {
      setIsLoading(false);
    }
  }, [isTimeSlotAvailable, getFilteredHours]);

  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate, selectedBarberId || undefined);
    } else {
      setAvailableHours([]);
    }
  }, [selectedDate, selectedBarberId, checkAvailability]);

  const isHolidayForContext = useCallback((date: Date, currentBarberId?: string | null) => {
    if (!date) return false;
    return holidays.some(holiday => {
      const holidayDateMatches = isSameDate(holiday.date, date);
      if (!holidayDateMatches) return false;

      // Si es un feriado general, aplica a todos.
      if (holiday.barber_id === null) return true;

      // Si se ha seleccionado un barbero, y el feriado es para ese barbero.
      if (currentBarberId && holiday.barber_id === currentBarberId) return true;

      // Si no se ha seleccionado barbero (mostrando disponibilidad general) y el feriado es específico, no lo consideramos festivo para la vista general.
      // A menos que la configuración de "múltiples barberos" esté desactivada, en cuyo caso cualquier feriado específico podría considerarse general.
      // Para este caso, si no hay barberId seleccionado, solo los generales cuentan.
      if (!currentBarberId && holiday.barber_id !== null) return false;

      return false;
    });
  }, [holidays]);

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';
    const classes = [];
    if (isToday(date)) classes.push('bg-blue-100');
    // Usar isHolidayForContext con el barbero seleccionado para la clase
    if (isHolidayForContext(date, selectedBarberId)) classes.push('holiday');
    return classes.join(' ');
  };

  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false;
    // Un tile está deshabilitado si es anterior a hoy O si es un feriado para el contexto actual (barbero seleccionado o general)
    return isBefore(date, today) || isHolidayForContext(date, selectedBarberId);
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    // Mostrar "Feriado" si es relevante para el contexto actual
    if (isHolidayForContext(date, selectedBarberId)) {
      const holidayInfo = holidays.find(h => isSameDate(h.date, date) && (h.barber_id === null || h.barber_id === selectedBarberId));
      let holidayText = "Feriado";
      if (holidayInfo?.barber_id && adminSettings.multiple_barbers_enabled) {
        const barber = barbers.find(b => b.id === holidayInfo.barber_id);
        if (barber) {
          // holidayText = `Feriado (${barber.name.split(' ')[0]})`; // Podría ser muy largo
        }
      }
      return <div className="text-xs mt-1 text-red-500">{holidayText}</div>;
    }
    return null;
  };

  const handleTimeSelect = (time: string) => {
    onTimeChange(time);
    if (selectedDate) {
      onDateTimeSelected(selectedDate, time, selectedBarberId || undefined);
    }
  };

  const handleBarberSelect = (barberId: string) => {
    if (onBarberChange) {
      onBarberChange(barberId);
    }
    // Limpiar tiempo seleccionado cuando cambia el barbero
    onTimeChange(null);
  };

  const getBusinessHoursText = (date: Date) => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      return "Horario: 10:00 AM - 3:00 PM";
    } else if (dayOfWeek === 3) {
      return "Horario: 7:00 AM - 12:00 PM, 3:00 PM - 7:00 PM";
    } else {
      return "Horario: 7:00 AM - 12:00 PM, 3:00 PM - 9:00 PM";
    }
  };

  const getRestrictionsText = () => {
    if (adminSettings.early_booking_restriction && adminSettings.restricted_hours?.length > 0) {
      const hours = adminSettings.restricted_hours.join(', ');
      return `Nota: Los horarios ${hours} requieren reserva con ${adminSettings.early_booking_hours} horas de antelación.`;
    }
    return null;
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">1. Elige una Fecha</h3>
            <div className="calendar-container">
              <Calendar
                onChange={onDateChange}
                value={selectedDate}
                tileClassName={tileClassName}
                tileDisabled={tileDisabled}
                tileContent={tileContent}
                minDate={today}
                className="rounded-lg border"
                next2Label={null}
                prev2Label={null}
                locale={es}
                formatDay={(locale, date) => format(date, 'd')}
                formatMonth={(locale, date) => format(date, 'MMMM', { locale: es })}
                formatMonthYear={(locale, date) => format(date, 'MMMM yyyy', { locale: es })}
                formatShortWeekday={(locale, date) => format(date, 'EEEEE', { locale: es })}
              />
            </div>
          </div>

          {selectedDate && (
            <div>
              <h3 className="text-lg font-medium mb-2">
                2. Selecciona {adminSettings.multiple_barbers_enabled ? 'Barbero y ' : ''}Horario
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                {getBusinessHoursText(selectedDate)}
              </p>
              {getRestrictionsText() && (
                <p className="text-sm text-orange-600 mb-3 bg-orange-50 p-2 rounded">
                  {getRestrictionsText()}
                </p>
              )}

              {/* Selector de barbero si está habilitado */}
              {adminSettings.multiple_barbers_enabled && (
                <div className="mb-4">
                  <BarberSelector
                    barbers={barbers}
                    selectedBarberId={selectedBarberId}
                    onSelectBarber={handleBarberSelect}
                  />
                </div>
              )}

              {/* Selector de horarios */}
              {(!adminSettings.multiple_barbers_enabled || selectedBarberId) && (
                <>
                  {isLoading ? (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-block w-5 h-5 border-2 border-t-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></span>
                      <span className="text-gray-500">Cargando horarios...</span>
                    </div>
                  ) : (
                    <TimeSlotPicker
                      date={selectedDate}
                      onSelectTime={handleTimeSelect}
                      selectedTime={selectedTime}
                      isHoliday={isHolidayForContext(selectedDate, selectedBarberId || undefined)}
                      availableHours={availableHours}
                      barberId={selectedBarberId || undefined}
                    />
                  )}
                </>
              )}

              {adminSettings.multiple_barbers_enabled && !selectedBarberId && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-blue-600 font-medium">Selecciona un barbero para ver los horarios disponibles</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;