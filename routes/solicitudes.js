const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Importar la conexión a la base de datos

// Función para convertir fechas al formato MySQL
const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    const hours = ('0' + d.getHours()).slice(-2);
    const minutes = ('0' + d.getMinutes()).slice(-2);
    const seconds = ('0' + d.getSeconds()).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Obtener todas las solicitudes de cirugía
router.get('/', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia', (err, results) => {
        if (err) {
            console.error('Error fetching solicitudes:', err);
            res.status(500).json({ error: 'Error fetching solicitudes' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});

// Crear una nueva solicitud de cirugía
router.post('/', (req, res) => {
    const solicitud = req.body;

    // Validar campos requeridos
    const requiredFields = [
        'fecha_solicitud', 'id_especialidad', 'clave_esp', 'nombre_especialidad', 'curp', 'ap_paterno',
        'ap_materno', 'nombre_paciente', 'fecha_nacimiento', 'edad', 'sexo', 'no_expediente',
        'tipo_intervencion', 'fecha_solicitada', 'hora_solicitada', 'tiempo_estimado', 'turno_solicitado',
        'sala_quirofano', 'id_cirujano', 'req_insumo', 'insumos', 'tipo_admision', 'estado_solicitud'
    ];

    for (const field of requiredFields) {
        if (!solicitud[field]) {
            return res.status(400).json({ error: `El campo ${field} es requerido.` });
        }
    }

    // Formatear las fechas antes de la inserción
    solicitud.fecha_solicitud = formatDate(solicitud.fecha_solicitud);
    solicitud.fecha_nacimiento = formatDate(solicitud.fecha_nacimiento);
    solicitud.fecha_solicitada = formatDate(solicitud.fecha_solicitada);

    console.log('Datos a insertar en la base de datos:', solicitud);

    db.query('INSERT INTO solicitudes_cirugia SET ?', solicitud, (err, result) => {
        if (err) {
            console.error('Error creating solicitud:', err);
            res.status(500).json({ error: 'Error creating solicitud', details: err.message });
        } else {
            const id_solicitud = result.insertId;

            // Generar el folio
            const folio = `${solicitud.fecha_solicitud.split(' ')[0]}-${solicitud.clave_esp}-${solicitud.fecha_solicitada.split(' ')[0]}-${solicitud.req_insumo.charAt(0)}-${String(id_solicitud).padStart(5, '0')}`;

            console.log('Folio generado:', folio);

            // Actualizar el folio en la base de datos
            db.query('UPDATE solicitudes_cirugia SET folio = ? WHERE id_solicitud = ?', [folio, id_solicitud], (updateErr) => {
                if (updateErr) {
                    console.error('Error updating folio:', updateErr);
                    res.status(500).json({ error: 'Error updating folio', details: updateErr.message });
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ message: 'Solicitud creada exitosamente.', id: id_solicitud, folio: folio });
                }
            });
        }
    });
});

module.exports = router;
