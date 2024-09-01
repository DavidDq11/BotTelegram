declare module 'telegraf-calendar' {
    export class Calendar {
        constructor();
        getCalendar(): any;
        isCalendarCallback(query: any): boolean;
        getDate(callbackData: string): Date;
    }
}
