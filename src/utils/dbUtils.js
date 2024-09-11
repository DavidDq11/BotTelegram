const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
});

/**
 * Obtiene las horas disponibles para una fecha específica.
 * @param {string} selectedDate - La fecha seleccionada en formato 'YYYY-MM-DD'.
 * @returns {Promise<Array>} - Lista de horas disponibles.
 */
async function getAvailableTimes(selectedDate) {
    try {
        const bookedTimesQuery = `
            SELECT hora FROM reservas WHERE fecha = $1
        `;
        const result = await pool.query(bookedTimesQuery, [selectedDate]);
        const bookedTimes = result.rows.map(row => row.hora);

        const allTimes = [
            '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
            '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
        ];

        const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));

        return availableTimes;
    } catch (error) {
        console.error('Error al obtener las horas disponibles:', error);
        return [];
    }
}

/**
 * Verifica la disponibilidad para una fecha, hora y número de personas específicos.
 * @param {string} date - La fecha en formato 'YYYY-MM-DD'.
 * @param {string} time - La hora en formato 'HH:MM'.
 * @param {number} people - Número de personas para la reserva.
 * @returns {Promise<boolean>} - Verdadero si hay disponibilidad, falso en caso contrario.
 */
async function checkAvailability(date, time, people) {
    const maxCapacity = 20; // Capacidad máxima permitida

    try {
        const reservationsQuery = `
            SELECT num_personas FROM reservas WHERE fecha = $1 AND hora = $2
        `;
        const result = await pool.query(reservationsQuery, [date, time]);
        const reservations = result.rows;

        const totalPeople = reservations.reduce((sum, reservation) => sum + reservation.num_personas, 0);

        return (totalPeople + people) <= maxCapacity;
    } catch (error) {
        console.error('Error al verificar la disponibilidad:', error);
        return false;
    }
}

/**
 * Función para obtener los elementos del menú desde la base de datos
 * @returns {Promise<Array>} - Lista de elementos del menú disponibles
 */
async function getMenuItems() {
    try {
        const query = 'SELECT * FROM menu';
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener elementos del menú desde la base de datos:', error);
        return [];
    }
}

/**
 * Función para obtener los elementos del menú por categoría desde la base de datos
 * @param {string} category - La categoría por la que filtrar los elementos del menú
 * @returns {Promise<Array>} - Lista de elementos del menú disponibles en la categoría
 */
async function getMenuItemsByCategory(category) {
    try {
        const query = 'SELECT * FROM menu WHERE categoria = $1';
        const result = await pool.query(query, [category]);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener elementos del menú por categoría desde la base de datos:', error);
        return [];
    }
}

/**
 * Función para guardar una reserva en la base de datos
 * @param {Object} reservation - Datos de la reserva
 * @param {string} reservation.name - Nombre del usuario
 * @param {string} reservation.date - Fecha de la reserva
 * @param {string} reservation.time - Hora de la reserva
 * @param {number} reservation.people - Número de personas
 * @param {string} reservation.id_usuario - ID del usuario de Telegram
 * @returns {Promise<number>} - ID de la reserva creada
 */
async function saveReservation({ name, date, time, people, id_usuario }) {
    const query = `
        INSERT INTO reservas(nombre, fecha, hora, num_personas, usuario_id) 
        VALUES($1, $2, $3, $4, $5) 
        RETURNING id
    `;
    try {
        const res = await pool.query(query, [name, date, time, people, id_usuario]);
        return res.rows[0].id;
    } catch (err) {
        console.error('Error al guardar la reserva:', err);
        throw err;
    }
}

/**
 * Función para guardar un pedido asociado a una reserva
 * @param {number} reservationId - ID de la reserva
 * @param {Array} order - Array de strings con los platos pedidos
 * @returns {Promise<void>}
 */
async function savePedido(reservationId, order) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const item of order) {
            const [nombre, precio] = item.split(' - $');
            await client.query(
                'INSERT INTO pedidos (reserva_id, menu_id, cantidad) VALUES ($1, (SELECT id FROM menu WHERE nombre = $2), 1)',
                [reservationId, nombre]
            );
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al guardar el pedido:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    getMenuItems,
    saveReservation,
    getAvailableTimes,
    checkAvailability,
    savePedido,
    getMenuItemsByCategory
};