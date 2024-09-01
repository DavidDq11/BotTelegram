const { Scenes, Markup } = require('telegraf');
const { getResponseFromHuggingFace } = require('../../services/huggingFaceServices');
const { getMenuItems } = require('../../utils/dbUtils');

// Crear una nueva escena llamada 'menu'
const menuScene = new Scenes.BaseScene('menu');

// Cuando el usuario entra a la escena del menú
menuScene.enter((ctx) => {
    ctx.reply('Bienvenido al menú principal. ¿Qué te gustaría hacer?', Markup.inlineKeyboard([
        [Markup.button.callback('Ver opciones de menú', 'view_menu')],
        [Markup.button.callback('Hacer una reserva', 'make_reservation')],
        [Markup.button.callback('Consultar disponibilidad "PRUEBA"', 'check_availability')],
        [Markup.button.callback('Hablar con IA "PRUEBA"', 'chat_with_ia ')]
    ]).resize());
});

// Acción para mostrar las opciones de menú
menuScene.action('view_menu', async (ctx) => {
    // Obtener los elementos del menú desde la base de datos
    const menuItems = await getMenuItems();
    if (menuItems.length > 0) {
        const menuText = menuItems.map(item => `${item.nombre}: $${item.precio}`).join('\n');
        ctx.reply(`Los siguientes platillos están disponibles:\n${menuText}`);
    } else {
        ctx.reply('Lo siento, no hay elementos disponibles en el menú en este momento.');
    }
});

// Acción para iniciar el proceso de reserva (puede redirigir a otra escena)
menuScene.action('make_reservation', (ctx) => {
    ctx.reply('Redirigiéndote a la escena de reserva...');
    ctx.scene.enter('reservation'); // Asumiendo que tienes una escena de reserva configurada
});

// Acción para consultar disponibilidad
menuScene.action('check_availability', async (ctx) => {
    const inputText = '¿Cuál es la disponibilidad actual?';
    const response = await getResponseFromHuggingFace(inputText);
    ctx.reply(response);
});

// Acción para iniciar una conversación con IA
menuScene.action('chat_with_ia', (ctx) => {
    ctx.reply('Puedes comenzar a hablar con la IA. Escribe lo que quieras preguntar o decir.');
    ctx.scene.state.step = 'chat_with_ia'; // Inicializa el paso para la conversación con la IA
});

menuScene.on('text', async (ctx) => {
    // Verifica si el usuario está en la etapa de conversación con la IA.
    if (ctx.scene.state.step === 'chat_with_ia') {
        const userMessage = ctx.message.text;
        const response = await getResponseFromHuggingFace(userMessage);

        if (response) {
            ctx.reply(response);
        } else {
            ctx.reply('Hubo un problema al procesar tu mensaje. Por favor, inténtalo de nuevo.');
        }
    }
});

module.exports = { menuScene };
