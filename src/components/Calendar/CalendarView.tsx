import React, { useState, useEffect, useCallback } from 'react';
import { format, isToday, isBefore, startOfDay, getHours, getMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import Calendar from 'react-calendar';
import { useAppointments } from '../../context/AppointmentContext';
import TimeSlotPicker from './TimeSlotPicker';
import { isSameDate } from '../../utils/dateUtils';
import './Calendar.css';

// Horarios actualizados según los nuevos requerimientos
const ALL_HOURS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
];

// Horarios específicos por día
const getHoursForDay = (date: Date): string[] => {
  const dayOfWeek = date.getDay();
  
  if (dayOfWeek === 0) {
    // Domingo: 10:00 AM a 3:00 PM
    return ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'];
  } else if (dayOfWeek === 3) {
    // Miércoles: 7:00 AM a 12:00 PM y 3:00 PM a 7:00 PM
    return [
      '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
    ];
  } else {
    // Resto de días: horarios normales
    return ALL_HOURS;
  }
};

function parseHourLabel(hourLabel: string): { hour: number; minute: number; isPm: boolean } {
  // e.g. "7:00 AM", "3:00 PM"
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
  // Aplica solo para 7:00 AM y 8:00 AM de cualquier día
  if (hourLabel !== '7:00 AM' && hourLabel !== '8:00 AM') return false;
  
  // Si la restricción no está activada, no aplicar
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
  onDateTimeSelected: (date: Date, time: string) => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string | null) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  onDateTimeSelected,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange 
}) => {
  const { isTimeSlotAvailable, holidays, adminSettings } = useAppointments();
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const today = startOfDay(new Date());

  // --- FILTRADO RÁPIDO Y BLOQUEO DE HORAS PASADAS Y RESTRICCIÓN DE HORAS TEMPRANAS ---
  const getFilteredHours = (date: Date) => {
    const hoursForDay = getHoursForDay(date);
    const now = new Date();

    return hoursForDay.filter(label => {
      // Restricción para las primeras dos horas (configuración de admin)
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
  };

  // Consulta paralela de disponibilidad y filtrado de horas pasadas
  const checkAvailability = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const filteredHours = getFilteredHours(date);
      const results = await Promise.all(
        filteredHours.map(hour => isTimeSlotAvailable(date, hour))
      );
      const available = filteredHours.filter((hour, idx) => results[idx]);
      setAvailableHours(available);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableHours([]);
    } finally {
      setIsLoading(false);
    }
  }, [isTimeSlotAvailable, adminSettings]);

  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate);
    } else {
      setAvailableHours([]);
    }
  }, [selectedDate, checkAvailability]);

  const isHoliday = useCallback((date: Date) => {
    return holidays.some(holiday => isSameDate(holiday.date, date));
  }, [holidays]);

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';
    const classes = [];
    if (isToday(date)) classes.push('bg-blue-100');
    if (isHoliday(date)) classes.push('holiday');
    return classes.join(' ');
  };

  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false;
    return isBefore(date, today) || isHoliday(date);
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    if (isHoliday(date)) {
      return <div className="text-xs mt-1 text-red-500">Feriado</div>;
    }
    return null;
  };

  const handleTimeSelect = (time: string) => {
    onTimeChange(time);
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
    if (adminSettings.early_booking_restriction) {
      return `Nota: Los horarios de 7:00 AM y 8:00 AM requieren reserva con ${adminSettings.early_booking_hours} horas de antelación.`;
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
                2. Elige un Horario - {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {getBusinessHoursText(selectedDate)}
              </p>
              {getRestrictionsText() && (
                <p className="text-sm text-orange-600 mb-3 bg-orange-50 p-2 rounded">
                  {getRestrictionsText()}
                </p>
              )}
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
                  isHoliday={isHoliday(selectedDate)}
                  availableHours={availableHours}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;