import { useMemo } from 'react';
import { useAppointments } from '../context/AppointmentContext';

const Calendar: React.FC<CalendarProps> = ({ onDateSelect, onTimeSelect }) => {
  const { isTimeSlotAvailable } = useAppointments();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      onTimeSelect(new Date(selectedDate.setHours(+time.split(':')[0], +time.split(':')[1])));
    }
  };

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    return generateTimeSlots().map(time => ({
      time,
      available: isTimeSlotAvailable(selectedDate, time),
      isBusinessHour: true
    }));
  }, [selectedDate, isTimeSlotAvailable]);

  return (
    <div>
      {/* Date and Time selection UI components */}
    </div>
  );
};

export default Calendar;