import React from 'react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarProps } from 'react-calendar';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';
import { useAppointments } from '../../context/AppointmentContext';
import TimeSlotPicker from './TimeSlotPicker';

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
  const { holidays, isTimeSlotAvailable } = useAppointments();
  const today = startOfDay(new Date());

  const isHoliday = (date: Date) => {
    return holidays.some(holiday => 
      holiday.date.toDateString() === date.toDateString()
    );
  };

  const handleDateChange: CalendarProps['onChange'] = (value) => {
    if (value instanceof Date) {
      onDateChange(value);
    }
  };

  const tileClassName: CalendarProps['tileClassName'] = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const classes = [];
    
    if (isToday(date)) {
      classes.push('bg-blue-100');
    }
    
    if (isHoliday(date)) {
      classes.push('holiday bg-red-100');
    }
    
    return classes.join(' ');
  };

  const tileDisabled: CalendarProps['tileDisabled'] = ({ date, view }) => {
    if (view !== 'month') return false;
    return isBefore(date, today) || isHoliday(date);
  };

  const handleTimeSelect = (time: string) => {
    onTimeChange(time);
    if (selectedDate) {
      onDateTimeSelected(selectedDate, time);
    }
  };

  const formatCalendarDay = (locale: string | undefined, date: Date) => {
    return format(date, 'd');
  };

  const formatCalendarMonth = (locale: string | undefined, date: Date) => {
    return format(date, 'MMMM', { locale: es });
  };

  const formatCalendarMonthYear = (locale: string | undefined, date: Date) => {
    return format(date, 'MMMM yyyy', { locale: es });
  };

  const formatCalendarWeekday = (locale: string | undefined, date: Date) => {
    return format(date, 'EEEEE', { locale: es });
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Selecciona Fecha y Hora</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">1. Elige una Fecha</h3>
            <div className="calendar-container">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                tileClassName={tileClassName}
                tileDisabled={tileDisabled}
                minDate={today}
                className="rounded-lg border"
                next2Label={null}
                prev2Label={null}
                locale="es-ES"
                formatDay={formatCalendarDay}
                formatMonth={formatCalendarMonth}
                formatMonthYear={formatCalendarMonthYear}
                formatShortWeekday={formatCalendarWeekday}
              />
            </div>
            <div className="mt-4 text-center text-gray-600">
              <div className="text-sm">
                <span className="inline-block w-3 h-3 bg-blue-100 rounded-full mr-1"></span> Hoy
                <span className="inline-block w-3 h-3 bg-red-100 rounded-full ml-4 mr-1"></span> Feriado
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">
              2. Elige un Horario - {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : ''}
            </h3>
            {selectedDate && (
              <TimeSlotPicker
                date={selectedDate}
                onSelectTime={handleTimeSelect}
                selectedTime={selectedTime}
                isHoliday={isHoliday(selectedDate)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;