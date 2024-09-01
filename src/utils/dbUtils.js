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
        INSERT INTO reservas(nombre, fecha, hora, num_personas, id_usuario) 
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

module.exports = { getMenuItems, saveReservation };
