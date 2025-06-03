const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let isClientReady = false;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

client.on('qr', (qr) => {
    console.log('\n=========================');
    console.log('POR FAVOR ESCANEA ESTE CÓDIGO QR:');
    console.log('=========================\n');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    isClientReady = true;
    console.log('\n=========================');
    console.log('¡Bot de WhatsApp listo y conectado!');
    console.log('=========================\n');
});

client.on('auth_failure', (msg) => {
    console.error('Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    isClientReady = false;
    console.log('Cliente desconectado:', reason);
    // Intentar reconectar
    client.initialize();
});

const waitForClient = async (retries = 30, interval = 1000) => {
    for (let i = 0; i < retries; i++) {
        if (isClientReady) return true;
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Timeout esperando que el cliente esté listo');
};

const sendMessage = async (phone, message) => {
    try {
        await waitForClient();

        // Asegurarse que el número tenga el formato correcto
        const cleanPhone = phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;
        const chatId = `${formattedPhone}@c.us`;
        console.log('Enviando mensaje a:', chatId);
        
        const response = await client.sendMessage(chatId, message);
        console.log('Mensaje enviado:', response);
        return response;
    } catch (error) {
        console.error('Error en sendMessage:', error);
        throw error;
    }
};

client.initialize();

module.exports = {
    sendMessage
};