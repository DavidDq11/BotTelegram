const { Scenes, Markup } = require('telegraf');
const { pool } = require('../../utils/dbUtils');

const queryScene = new Scenes.BaseScene('query');

queryScene.enter((ctx) => {
    ctx.reply('Por favor, ingresa tu nombre para consultar tus reservas:');
    ctx.scene.state.step = 'getName';
});

queryScene.on('text', async (ctx) => {
    const step = ctx.scene.state.step;

    if (step === 'getName') {
        const name = ctx.message.text;
        ctx.scene.state.name = name;
        ctx.reply('Buscando reservas para ' + name + '...');

        let client;
        try {
            client = await pool.connect();  // Usa pool.connect() aquí
            const result = await client.query('SELECT * FROM public.reservas WHERE nombre = $1', [name]);

            if (result.rows.length > 0) {
                let response = 'Aquí están tus reservas:\n\n';

                result.rows.forEach(row => {
                    response += `Reserva ID: ${row.id}\n`;
                    response += `Fecha: ${row.fecha}\n`;
                    response += `Hora: ${row.hora}\n`;
                    response += `Personas: ${row.num_personas}\n`;
                    response += '--------------------------\n';  // Puedes ajustar el tamaño o estilo de la línea
                });

                ctx.reply(response);
            } else {
                ctx.reply('No se encontraron reservas para ese nombre.');
            }
        } catch (err) {
            console.error('Error al consultar las reservas:', err);
            ctx.reply('Hubo un error al consultar tus reservas. Por favor, inténtalo de nuevo más tarde.');
        } finally {
            if (client) {
                client.release(); // Asegúrate de liberar la conexión
            }
        }

        // Ofrece la opción de volver al inicio
        ctx.reply('¿Deseas hacer algo más?', Markup.inlineKeyboard([
            [Markup.button.callback('Volver al inicio', 'start')]
        ]).resize());

        // Salir de la escena después de mostrar los resultados, pero con la opción de volver al inicio
        // Esto asegura que el usuario pueda elegir otra opción después de consultar reservas
    }
});

queryScene.action('start', (ctx) => {
    ctx.reply('¡Bienvenido de nuevo! Por favor selecciona una opción:', Markup.inlineKeyboard([
        [Markup.button.callback('Menú', 'menu')],
        [Markup.button.callback('Hacer una reserva', 'reserve')],
        [Markup.button.callback('Consultar reservas', 'query')],
        [Markup.button.callback('Ayuda', 'help')]
    ]).resize());
    ctx.scene.leave();  // Sal de la escena después de volver al inicio
});

module.exports = { queryScene };
