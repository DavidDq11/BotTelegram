const { Scenes, Markup } = require('telegraf');
const CalendarHelper = require('../calendar/calendar-helper');
const { getMenuItems } = require('../../utils/dbUtils'); // Ajusta la ruta si es necesario
const { saveReservation } = require('../../utils/dbUtils'); // Añadido para manejar reservas

const reservationScene = new Scenes.BaseScene('reservation');
const calendarHelper = new CalendarHelper();

reservationScene.enter((ctx) => {
    ctx.reply('¡Hola! Vamos a empezar con tu reserva. Por favor, elige una opción:', Markup.inlineKeyboard([
        [Markup.button.callback('Hacer una reserva', 'reserve')],
        [Markup.button.callback('Cancelar', 'cancel')]
    ]).resize());
});

reservationScene.action('reserve', (ctx) => {
    ctx.reply('¿Cuál es tu nombre?');
    ctx.scene.state.step = 'name';
});

reservationScene.action('cancel', (ctx) => {
    ctx.reply('Reserva cancelada.');
    ctx.scene.leave();
});

reservationScene.action('calendar', async (ctx) => {
    ctx.reply('Selecciona un mes:', calendarHelper.getMonthMarkup());
});

reservationScene.action(/calendar-month-(\d{4})-(\d+)/, async (ctx) => {
    const [ , year, month] = ctx.match;
    ctx.reply('Selecciona el día:', calendarHelper.getCalendarMarkup(parseInt(year), parseInt(month)));
});

reservationScene.action(/calendar-date-(\d{4}-\d{2}-\d{2})/, async (ctx) => {
    const selectedDate = ctx.match[1];
    ctx.scene.state.date = selectedDate;
    ctx.reply(`Fecha seleccionada: ${selectedDate}. Ahora, ¿a qué hora te gustaría hacer la reserva? Por favor, proporciona la hora en formato 24h (HH:MM).`);
    ctx.scene.state.step = 'time';
});

reservationScene.on('text', async (ctx) => {
    const step = ctx.scene.state.step;

    if (step === 'name') {
        ctx.scene.state.name = ctx.message.text;
        ctx.reply('Gracias, ¿cuántas personas asistirán?');
        ctx.scene.state.step = 'people';
    } else if (step === 'people') {
        const numberOfPeople = parseInt(ctx.message.text);
        if (isNaN(numberOfPeople) || numberOfPeople <= 0) {
            ctx.reply('Por favor, ingresa un número válido de personas.');
        } else {
            ctx.scene.state.people = numberOfPeople;
            ctx.reply('Selecciona una fecha para tu reserva:', Markup.inlineKeyboard([
                [Markup.button.callback('Seleccionar fecha', 'calendar')]
            ]).resize());
            ctx.scene.state.step = 'date';
        }
    } else if (step === 'date') {
        // La selección de la fecha ya está manejada en los actions
    } else if (step === 'time') {
        const time = ctx.message.text;
        const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/; // Verifica el formato HH:MM
        if (!timePattern.test(time)) {
            ctx.reply('Por favor, ingresa una hora válida en formato 24h (HH:MM).');
        } else {
            ctx.scene.state.time = time;
            const numberOfPeople = ctx.scene.state.people;
            ctx.reply(`Resumiendo tu reserva:\nNombre: ${ctx.scene.state.name}\nFecha: ${ctx.scene.state.date}\nHora: ${time}\nNúmero de personas: ${numberOfPeople}\n¿Todo está correcto?`, Markup.inlineKeyboard([
                [Markup.button.callback('Sí, confirmar', 'confirm')],
                [Markup.button.callback('No, corregir', 'correct')]
            ]).resize());
            ctx.scene.state.step = 'confirm';
        }
    }
});

reservationScene.action('confirm', async (ctx) => {
    const { name, date, time, people } = ctx.scene.state;
    const id_usuario = ctx.from.id.toString(); // Usamos el ID de Telegram como id_usuario

    try {
        const reservationId = await saveReservation({ name, date, time, people, id_usuario });
        ctx.reply(`¡Tu reserva ha sido confirmada! Número de reserva: ${reservationId}`);
    } catch (err) {
        ctx.reply('Hubo un error al procesar tu reserva. Por favor, inténtalo de nuevo más tarde. Si el problema persiste, contacta con soporte.');
    }
    ctx.scene.leave();
});

reservationScene.action('correct', (ctx) => {
    ctx.reply('Vamos a empezar de nuevo. ¿Cuál es tu nombre?');
    ctx.scene.state.step = 'name';
});

module.exports = { reservationScene };
