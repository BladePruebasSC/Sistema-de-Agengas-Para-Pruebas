const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTime = // ... tu lógica para obtener la hora seleccionada
    
    try {
        await createBlockedTime({
            date: selectedDate,
            time: selectedTime,  // Hora individual
            timeSlots: [selectedTime],  // Array con la hora
            reason: reason
        });
    } catch (error) {
        console.error('Error:', error);
    }
};