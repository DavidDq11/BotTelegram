const { Telegraf, Markup, session, Scenes } = require('telegraf');
const { Pool } = require('pg');
const { reservationScene } = require('../components/scenes/reservationScene');
const { menuScene } = require('../components/scenes/menuScene');
const { queryScene } = require('../components/scenes/queryScene');

const getBotToken = () => {
    const token = process.env.BOT_TOKEN;
    if (!token) {
        console.error('No se encontró BOT_TOKEN en las variables de entorno.');
        process.exit(1);
    }
    return token;
};

const bot = new Telegraf(getBotToken());
console.log('Bot iniciado correctamente');

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error adquiriendo cliente', err.stack);
    }
    console.log('Conexión a la base de datos establecida');
    release();
});

const stage = new Scenes.Stage([reservationScene, menuScene, queryScene]);

bot.use(session());
bot.use(stage.middleware());

const startKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Menú', 'menu')],
    [Markup.button.callback('Hacer una reserva', 'reserve')],
    [Markup.button.callback('Consultar reservas', 'query')],
    [Markup.button.callback('Ayuda', 'help')]
]);

bot.command('start', (ctx) => {
    ctx.reply('¡Bienvenido a nuestro bot de reservas! Por favor selecciona una opción:', startKeyboard);
});

bot.action('reserve', (ctx) => {
    ctx.reply('Has seleccionado hacer una reserva.');
    ctx.scene.enter('reservation');
});

bot.action('query', (ctx) => {
    ctx.reply('Has seleccionado consultar reservas.');
    ctx.scene.enter('query');
});

bot.action('help', (ctx) => {
    ctx.reply('Comandos disponibles:\n/start - Iniciar el bot\n/reserve - Hacer una reserva\n/help - Ver esta lista de comandos');
});

bot.action('menu', (ctx) => {
    ctx.reply('Accediendo al menú...');
    ctx.scene.enter('menu');
});

bot.action('start', (ctx) => {
    console.log('Acción start activada');
    ctx.reply('¡Bienvenido de nuevo! Por favor selecciona una opción:', startKeyboard);
    ctx.scene.leave();  // Asegúrate de que estás saliendo de la escena actual si es necesario
});

bot.action('cancel', (ctx) => {
    ctx.reply('Reserva cancelada. Si deseas hacer una nueva reserva, puedes empezar de nuevo:', Markup.inlineKeyboard([
        [Markup.button.callback('Hacer una nueva reserva', 'start')]
    ]).resize());
    ctx.scene.leave();  // Sal de la escena después de cancelar
});

module.exports = bot;
