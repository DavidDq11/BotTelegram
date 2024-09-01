const CalendarHelper = require('./calendar-helper'); // Asegúrate de que la ruta sea correcta

class Calendar {
    constructor(bot, options) {
        this.bot = bot;
        this.helper = new CalendarHelper(options);
    }

    getCalendar(date) {
        if (!date) date = new Date();
        return this.helper.getCalendarMarkup(date);
    }
}

module.exports = Calendar;
