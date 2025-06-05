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
        <button
          key={time}
          onClick={() => onTimeSelect(time)}
          disabled={checking || isLoadingSlots || !availableSlots.includes(time)}
          className={`
            p-2 rounded-md text-sm font-medium
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
};