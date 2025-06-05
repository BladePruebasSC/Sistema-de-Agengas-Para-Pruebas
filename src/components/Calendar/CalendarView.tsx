import React, { useState, useEffect, useCallback } from 'react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Calendar from 'react-calendar';
import { useAppointments } from '../../context/AppointmentContext';
import TimeSlotPicker from './TimeSlotPicker';
import { isBusinessHour } from '../../utils/businessHours';
import './Calendar.css';

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
  const { isTimeSlotAvailable, holidays } = useAppointments();
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const today = startOfDay(new Date());

  const allHours = [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
  ];

  // Reset time selection when date changes
  const handleDateChange = (date: Date) => {
    onTimeChange(null); // Reset time selection
    setAvailableHours([]); // Reset available hours
    onDateChange(date); // Update parent component
  };

  // Check availability when date changes
  const checkAvailability = useCallback(async (date: Date) => {
    if (!date) return;
    
    setIsLoading(true);
    try {
      const available = [];
      for (const hour of allHours) {
        const isAvailable = await isTimeSlotAvailable(date, hour);
        if (isAvailable) {
          available.push(hour);
        }
      }
      setAvailableHours(available);
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isTimeSlotAvailable, allHours]);

  // Update available hours when date changes
  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate);
    }
  }, [selectedDate, checkAvailability]);

  const isHoliday = useCallback((date: Date) => {
    return holidays.some(
      holiday =>
        holiday.date.getFullYear() === date.getFullYear() &&
        holiday.date.getMonth() === date.getMonth() &&
        holiday.date.getDate() === date.getDate()
    );
  }, [holidays]);

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';
    
    const classes = [];
    
    if (isToday(date)) {
      classes.push('bg-blue-100');
    }
    
    if (isHoliday(date)) {
      classes.push('holiday');
    }
    
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

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">1. Elige una Fecha</h3>
            <div className="calendar-container">
              <Calendar
                onChange={handleDateChange}
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
              <h3 className="text-lg font-medium mb-3">
                2. Elige un Horario - {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </h3>
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <TimeSlotPicker
                  date={selectedDate}
                  onSelectTime={onTimeChange}
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