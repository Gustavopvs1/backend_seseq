const express = require('express');
const router = express.Router();
const db = require('../database/db');  // Asegúrate de que esta sea la ruta correcta a tu archivo de conexión a la base de datos

// Endpoint para obtener las opciones de los enums
router.get('/enums', async (req, res) => {
    try {
        const enumQueries = {
            clave_esp: 'SELECT DISTINCT clave_esp FROM solicitudes_cirugia',
            nombre_esp: 'SELECT DISTINCT nombre_especialidad FROM solicitudes_cirugia',
            tipo_intervencion: 'SELECT DISTINCT tipo_intervencion FROM solicitudes_cirugia',
            turno_solicitado: 'SELECT DISTINCT turno_solicitado FROM solicitudes_cirugia',
            sala_quirofano: 'SELECT DISTINCT sala_quirofano FROM solicitudes_cirugia',
            tipo_admision: 'SELECT DISTINCT tipo_admision FROM solicitudes_cirugia'
        };

        const enums = {};
        for (const [key, query] of Object.entries(enumQueries)) {
            const [rows] = await db.query(query);
            enums[key] = rows.map(row => row[key]);
        }

        res.json(enums);
    } catch (error) {
        console.error('Error fetching enums:', error);
        res.status(500).json({ error: 'Error fetching enums' });
    }
});

module.exports = router;
