const TimeSlots: React.FC<TimeSlotsProps> = ({ selectedDate, onTimeSelect }) => {
  const { isTimeSlotAvailable, isLoadingSlots } = useAppointments();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  // Morning slots: 7:00 AM to 12:00 PM
  const morningSlots = [
    "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM",
    "11:00 AM", "12:00 PM"
  ];

  // Afternoon slots: 3:00 PM to 8:00 PM
  const afternoonSlots = [
    "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
    "7:00 PM", "8:00 PM"
  ];

  const timeSlots = [...morningSlots, ...afternoonSlots];

  useEffect(() => {
<<<<<<< HEAD
    let mounted = true;

    const checkAvailability = async () => {
      if (!selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setChecking(true);
      setAvailableSlots([]); // Clear previous slots

      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');

        // Get all unavailable slots at once
        const [holidayExists, unavailableSlots] = await Promise.all([
          // Check holidays
          supabase
            .from('holidays')
            .select('id')
            .eq('date', formattedDate)
            .maybeSingle(),
          // Check appointments and blocked times
          supabase
            .from('appointments')
            .select('time')
            .eq('date', formattedDate)
        ]);

        if (!mounted) return;

        if (holidayExists.data) {
          setAvailableSlots([]);
          return;
        }

        const bookedTimes = new Set(unavailableSlots.data?.map(slot => slot.time) || []);
        const availableTimes = timeSlots.filter(time => !bookedTimes.has(time));
        
        if (mounted) {
          setAvailableSlots(availableTimes);
        }
      } catch (error) {
        console.error('Error checking availability:', error);
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    checkAvailability();

    return () => {
      mounted = false;
      setAvailableSlots([]);
      setChecking(false);
    };
  }, [selectedDate, timeSlots]);

  const renderTimeSlots = (slots: string[]) => (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((time) => (
=======
    const checkAvailability = async () => {
      setChecking(true);
      setAvailableSlots([]); // Clear previous slots

      const available = await Promise.all(
        timeSlots.map(async (time) => ({
          time,
          available: await isTimeSlotAvailable(selectedDate, time)
        }))
      );

      setAvailableSlots(available.filter(slot => slot.available).map(slot => slot.time));
      setChecking(false);
    };

    checkAvailability();
  }, [selectedDate, isTimeSlotAvailable]);

  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      {timeSlots.map((time) => (
>>>>>>> 5293b691d34fcfe6e9c67d3d007e642ab94ae6f2
        <button
          key={time}
          onClick={() => onTimeSelect(time)}
          disabled={checking || isLoadingSlots || !availableSlots.includes(time)}
          className={`
<<<<<<< HEAD
            p-3 rounded-md text-sm font-medium transition-all
=======
            p-2 rounded-md text-sm font-medium
>>>>>>> 5293b691d34fcfe6e9c67d3d007e642ab94ae6f2
            ${checking || isLoadingSlots
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed animate-pulse'
              : availableSlots.includes(time)
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {checking || isLoadingSlots ? '...' : time}
        </button>
      ))}
    </div>
  );
<<<<<<< HEAD

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Mañana</h3>
        {renderTimeSlots(morningSlots)}
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Tarde</h3>
        {renderTimeSlots(afternoonSlots)}
      </div>
    </div>
  );
=======
>>>>>>> 5293b691d34fcfe6e9c67d3d007e642ab94ae6f2
};