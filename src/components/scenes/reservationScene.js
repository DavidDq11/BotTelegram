const { Scenes, Markup } = require('telegraf');
const CalendarHelper = require('../calendar/calendar-helper');
const { getMenuItems, saveReservation, checkAvailability, getAvailableTimes } = require('../../utils/dbUtils');

const reservationScene = new Scenes.BaseScene('reservation');
const calendarHelper = new CalendarHelper();
let timeout;  // Variable para almacenar el temporizador

// Función para finalizar la escena después de cierto tiempo de inactividad
const startInactivityTimer = (ctx) => {
    clearTimeout(timeout);  // Limpia el temporizador anterior si existe

    timeout = setTimeout(() => {
        ctx.reply('Tu sesión ha expirado debido a inactividad. Por favor, empieza de nuevo si deseas hacer una reserva.');
        ctx.scene.leave();  // Sale de la escena
    }, 1 * 60 * 1000);  // 5 minutos de inactividad
};

reservationScene.enter((ctx) => {
    ctx.reply('¡Hola! Vamos a empezar con tu reserva. Por favor, elige una opción:', Markup.inlineKeyboard([
        [Markup.button.callback('Hacer una reserva', 'reserve')],
        [Markup.button.callback('Cancelar', 'cancel')]
    ]).resize());
    startInactivityTimer(ctx);  // Inicia el temporizador al entrar en la escena
});

reservationScene.action('reserve', (ctx) => {
    ctx.reply('¿Cuál es tu nombre?');
    ctx.scene.state.step = 'name';  // Establece el paso actual como 'name'
    startInactivityTimer(ctx);  // Reinicia el temporizador
});

// Captura del nombre del usuario
reservationScene.on('text', (ctx) => {
    if (ctx.scene.state.step === 'name') {
        ctx.scene.state.name = ctx.message.text; // Guarda el nombre proporcionado por el usuario
        ctx.scene.state.step = 'people';  // Cambia el paso a 'people'

        // Ofrecer opciones predefinidas para el número de personas
        ctx.reply('Gracias. ¿Cuántas personas serán?', Markup.inlineKeyboard([
            [Markup.button.callback('1', 'people-1'), Markup.button.callback('2', 'people-2')],
            [Markup.button.callback('3', 'people-3'), Markup.button.callback('4', 'people-4')],
            [Markup.button.callback('5 o más', 'people-more')]
        ]).resize());
        startInactivityTimer(ctx);  // Reinicia el temporizador
    }
});

// Manejo de selección del número de personas
reservationScene.action(/people-(\d+)/, (ctx) => {
    ctx.scene.state.people = parseInt(ctx.match[1], 10); // Guarda el número de personas
    ctx.scene.state.step = 'date';  // Cambia el paso a 'date'
    ctx.reply('Ahora, selecciona una fecha para tu reserva:', Markup.inlineKeyboard([
        [Markup.button.callback('Seleccionar fecha', 'calendar')]
    ]).resize());
    startInactivityTimer(ctx);  // Reinicia el temporizador
});

reservationScene.action('people-more', (ctx) => {
    ctx.scene.state.step = 'peopleMore';  // Permite entrada de texto libre
    ctx.reply('Por favor, ingresa el número exacto de personas:');
    startInactivityTimer(ctx);  // Reinicia el temporizador
});

// Captura del número de personas (caso libre)
reservationScene.on('text', (ctx) => {
    if (ctx.scene.state.step === 'peopleMore') {
        const numberOfPeople = parseInt(ctx.message.text, 10);
        if (isNaN(numberOfPeople) || numberOfPeople <= 0) {
            ctx.reply('Por favor, ingresa un número válido de personas.');
            return;
        }
        ctx.scene.state.people = numberOfPeople;
        ctx.scene.state.step = 'date';
        ctx.reply('Ahora, selecciona una fecha para tu reserva:', Markup.inlineKeyboard([
            [Markup.button.callback('Seleccionar fecha', 'calendar')]
        ]).resize());
    }
});

reservationScene.action('calendar', async (ctx) => {
    ctx.reply('Selecciona un mes:', calendarHelper.getMonthMarkup());
});

reservationScene.action(/calendar-month-(\d{4})-(\d+)/, async (ctx) => {
    const [, year, month] = ctx.match;
    ctx.reply('Selecciona el día:', calendarHelper.getCalendarMarkup(parseInt(year), parseInt(month)));
});

reservationScene.action(/calendar-date-(\d{4}-\d{2}-\d{2})/, async (ctx) => {
    const selectedDate = ctx.match[1];
    ctx.scene.state.date = selectedDate;

    const availableTimes = await getAvailableTimes(selectedDate);

    if (availableTimes.length === 0) {
        ctx.reply('Lo siento, no hay horarios disponibles para esa fecha. Por favor, selecciona otra fecha.');
        ctx.scene.state.step = 'date';  // Cambia el paso a 'date'
    } else {
        ctx.reply('Fecha seleccionada. Ahora, selecciona una hora:', Markup.inlineKeyboard(
            availableTimes.map(time => Markup.button.callback(time, `time-${time}`))
        ).resize());
    }
});

reservationScene.action(/time-(\d{2}:\d{2})/, async (ctx) => {
    ctx.scene.state.time = ctx.match[1];
    const { name, date, time, people } = ctx.scene.state;
    ctx.scene.state.step = 'confirm';  // Cambia el paso a 'confirm'

    ctx.reply(`Resumiendo tu reserva:\nNombre: ${name}\nFecha: ${date}\nHora: ${time}\nNúmero de personas: ${people}\n¿Todo está correcto?`, Markup.inlineKeyboard([
        [Markup.button.callback('Sí, confirmar', 'confirm')],
        [Markup.button.callback('No, corregir', 'correct')]
    ]).resize());
});

reservationScene.action('confirm', async (ctx) => {
    const { name, date, time, people } = ctx.scene.state;
    const id_usuario = ctx.from.id.toString();

    const isAvailable = await checkAvailability(date, time, people);
    if (!isAvailable) {
        ctx.reply('Lo siento, no hay disponibilidad para esa fecha y hora. Por favor, elige otra.');
        ctx.scene.state.step = 'time';
        return;
    }

    try {
        const reservationId = await saveReservation({ name, date, time, people, id_usuario });
        await ctx.reply(`¡Tu reserva ha sido confirmada! Número de reserva: ${reservationId}`);
    } catch (err) {
        await ctx.reply('Hubo un error al procesar tu reserva. Por favor, inténtalo de nuevo más tarde.');
    }

    await ctx.reply('Si deseas hacer algo más, selecciona una opción:', Markup.inlineKeyboard([
        [Markup.button.callback('Volver al inicio', 'start')]
    ]).resize());

    ctx.scene.leave();
});

reservationScene.action('correct', (ctx) => {
    ctx.reply('Vamos a empezar de nuevo. ¿Cuál es tu nombre?');
    ctx.scene.state.step = 'name';
});

reservationScene.action('cancel', (ctx) => {
    ctx.reply('Reserva cancelada. Si deseas hacer algo más, selecciona una opción:', Markup.inlineKeyboard([
        [Markup.button.callback('Volver al inicio', 'start')]
    ]).resize());
    ctx.scene.leave();
    clearTimeout(timeout);  // Limpia el temporizador al salir de la escena
});

reservationScene.action('start', (ctx) => {
    ctx.reply('¡Bienvenido de nuevo! Por favor selecciona una opción:', Markup.inlineKeyboard([
        [Markup.button.callback('Menú', 'menu')],
        [Markup.button.callback('Hacer una reserva', 'reserve')],
        [Markup.button.callback('Consultar reservas', 'query')],
        [Markup.button.callback('Ayuda', 'help')]
    ]).resize());
    ctx.scene.leave();
});

module.exports = { reservationScene };
