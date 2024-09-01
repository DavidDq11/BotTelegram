const axios = require('axios');
require('dotenv').config();

const huggingFaceApiKey = process.env.HUGGING_FACE_API_KEY;
const huggingFaceUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

async function getResponseFromHuggingFace(inputText) {
    try {
        const response = await axios.post(
            huggingFaceUrl,
            { inputs: inputText },
            {
                headers: {
                    Authorization: `Bearer ${huggingFaceApiKey}`,
                    'Content-Type': 'application/json'
                },
            }
        );
        return response.data[0].generated_text; // Ajusta el acceso a la propiedad correcta según la respuesta de la API
    } catch (error) {
        console.error('Error al obtener respuesta de Hugging Face:', error);
        return 'Lo siento, no pude procesar tu solicitud en este momento.';
    }
}

module.exports = { getResponseFromHuggingFace };
