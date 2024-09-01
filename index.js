require('dotenv').config({ path: './.env.telegram' });


const botService = require('./src/services/botService');

// Verifica que la clave API se esté cargando correctamente
const apiKey = process.env.HUGGING_FACE_API_KEY;
if (!apiKey) {
    console.error('Clave API de Hugging Face no encontrada en el archivo de entorno.');
    process.exit(1);
}

botService.launch()
  .then(() => console.log('Bot iniciado correctamente'))
  .catch(err => console.error('Error iniciando el bot:', err));

// Habilitar la terminación elegante
process.once('SIGINT', () => botService.stop('SIGINT'));
process.once('SIGTERM', () => botService.stop('SIGTERM'));

