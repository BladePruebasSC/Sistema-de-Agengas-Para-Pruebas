import React, { useState } from 'react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Calendar from 'react-calendar';
import { useAppointments } from '../../context/AppointmentContext';
import TimeSlotPicker from './TimeSlotPicker';
import { isBusinessHour } from '../../utils/businessHours';
import { isTimeSlotAvailable } from '../../utils/mockData';
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
  const { holidays } = useAppointments();
  const today = startOfDay(new Date());

  const isHoliday = (date: Date) => {
    return holidays.some(
      holiday =>
        holiday.date.getFullYear() === date.getFullYear() &&
        holiday.date.getMonth() === date.getMonth() &&
        holiday.date.getDate() === date.getDate()
    );
  };

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

  const handleTimeSelect = (time: string) => {
    onTimeChange(time);
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

export default CalendarView