const { Scenes, Markup } = require('telegraf');
const pool = require('../../utils/dbUtils');

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

        try {
            const client = await pool.connect();
            const result = await client.query('SELECT * FROM reservas WHERE nombre = $1', [name]);

            if (result.rows.length > 0) {
                let response = 'Aquí están tus reservas:\n';
                result.rows.forEach(row => {
                    response += `- Reserva ID: ${row.id}, Fecha: ${row.fecha}, Hora: ${row.hora}, Personas: ${row.num_personas}\n`;
                });
                ctx.reply(response);
            } else {
                ctx.reply('No se encontraron reservas para ese nombre.');
            }

            client.release();
        } catch (err) {
            console.error('Error al consultar las reservas:', err);
            ctx.reply('Hubo un error al consultar tus reservas. Por favor, inténtalo de nuevo más tarde.');
        }

        ctx.scene.leave(); // Salir de la escena después de mostrar los resultados
    }
});

module.exports = { queryScene };
