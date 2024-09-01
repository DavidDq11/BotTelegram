const { Markup } = require('telegraf');

class CalendarHelper {
    constructor(options) {
        this.options = options || {};
        this.minDate = new Date();
        this.maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // Por defecto, el máximo es un año a partir de hoy
        this.weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        this.startWeekDay = 0; // Domingo por defecto
    }

    getMonthMarkup() {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();

        let buttons = [];
        for (let i = 0; i < this.monthNames.length; i++) {
            if (i >= currentMonth || currentYear > new Date().getFullYear()) {
                buttons.push([Markup.button.callback(this.monthNames[i], `calendar-month-${currentYear}-${i}`)]);
            }
        }

        return Markup.inlineKeyboard(buttons).resize();
    }

    getCalendarMarkup(year, month) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        let buttons = [];

        // Encabezados de los días de la semana
        let weekRow = this.weekDayNames.map(day => Markup.button.callback(day, `ignore`));
        buttons.push(weekRow);

        // Generar botones para las fechas del mes
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            let weekRow = [];
            for (let i = 0; i < 7; i++) {
                if (currentDate.getMonth() === month && currentDate <= endDate) {
                    weekRow.push(Markup.button.callback(`${currentDate.getDate()}`, `calendar-date-${currentDate.toISOString().slice(0, 10)}`));
                } else {
                    weekRow.push(Markup.button.callback('   ', `ignore`)); // Espacio vacío para días fuera del mes
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            buttons.push(weekRow);
        }

        return Markup.inlineKeyboard(buttons).resize();
    }

    // Otros métodos...
}

module.exports = CalendarHelper;
