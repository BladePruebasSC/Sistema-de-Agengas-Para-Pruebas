const sendWhatsAppNotification = async (phone: string, message: string) => {
    try {
        const response = await fetch('http://localhost:3000/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone, message })
        });

        if (!response.ok) {
            throw new Error('Error enviando mensaje de WhatsApp');
        }

        return true;
    } catch (error) {
        console.error('Error en notificación WhatsApp:', error);
        return false;
    }
};

export default sendWhatsAppNotification;