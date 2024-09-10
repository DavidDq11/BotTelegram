const { Markup } = require('telegraf');

class CalendarHelper {
    constructor(options) {
        this.options = options || {};
        this.minDate = new Date();
        this.maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // Por defecto, el máximo es un año a partir de hoy
        this.weekDayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        this.monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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
        let weekHeaderRow = this.weekDayNames.map(day => Markup.button.callback(day, `ignore`));
        buttons.push(weekHeaderRow);

        // Añadir espacio en blanco para los días antes del primer día del mes
        let firstDayOfWeek = startDate.getDay();
        let currentDate = new Date(startDate);
        let currentWeekRow = [];

        // Rellenar los días en blanco antes del primer día del mes
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeekRow.push(Markup.button.callback('   ', `ignore`));
        }

        // Generar botones para las fechas del mes
        while (currentDate <= endDate) {
            if (currentDate.getMonth() === month) {
                currentWeekRow.push(Markup.button.callback(`${currentDate.getDate()}`, `calendar-date-${currentDate.toISOString().slice(0, 10)}`));
            }

            if (currentWeekRow.length === 7) {
                buttons.push(currentWeekRow);
                currentWeekRow = [];
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Rellenar el resto de la última semana con espacios en blanco si es necesario
        while (currentWeekRow.length > 0 && currentWeekRow.length < 7) {
            currentWeekRow.push(Markup.button.callback('   ', `ignore`));
        }

        if (currentWeekRow.length > 0) {
            buttons.push(currentWeekRow);
        }

        return Markup.inlineKeyboard(buttons).resize();
    }
    // Otros métodos...
}

module.exports = CalendarHelper;
