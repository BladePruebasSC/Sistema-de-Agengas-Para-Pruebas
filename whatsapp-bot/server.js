const express = require('express');
const cors = require('cors');
const { sendMessage } = require('./bot');

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['POST'],
    credentials: true
}));
app.use(express.json());

app.post('/send-message', async (req, res) => {
    const { type, phone, data } = req.body;
    
    try {
        console.log('Recibida petición de mensaje:', { type, phone, data });

        // Formatear el número de teléfono
        const cleanPhone = phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;

        let message = '';
        switch (type) {
            case 'appointment_created':
                message = `¡Hola ${data.clientName}! Tu cita ha sido confirmada para el ${data.date} a las ${data.time}. Servicio: ${data.service}. ¡Te esperamos!`;
                break;
            case 'appointment_cancelled':
                message = `Hola ${data.clientName}, tu cita para el ${data.date} a las ${data.time} ha sido cancelada.`;
                break;
            default:
                throw new Error('Tipo de mensaje no válido');
        }

        console.log('Intentando enviar mensaje:', { formattedPhone, message });
        await sendMessage(formattedPhone, message);
        
        console.log('Mensaje enviado exitosamente');
        res.json({ success: true });
    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});