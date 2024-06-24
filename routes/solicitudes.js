const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Importar la conexión a la base de datos

const formatDate = (date) => {
    if (!date) return null; // Devolver null si la fecha no es válida
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    const hours = ('0' + d.getHours()).slice(-2);
    const minutes = ('0' + d.getMinutes()).slice(-2);
    const seconds = ('0' + d.getSeconds()).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Formato de fechas para visualización
const formatDateForDisplay = (date) => {
    if (!date) return null; // Devolver null si la fecha no es válida
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
};

// Función para eliminar guiones de las fechas
const removeDashes = (dateString) => {
    return dateString.replace(/-/g, '');
};

// Obtener todas las solicitudes de cirugía
router.get('/', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia', (err, results) => {
        if (err) {
            console.error('Error fetching solicitudes:', err);
            res.status(500).json({ error: 'Error fetching solicitudes' });
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud);
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada);
            });
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});


router.get('/pendientes', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = ?', ['Pendiente'], (err, results) => {
        if (err) {
            console.error('Error fetching solicitud by status:', err);
            res.status(500).json({ error: 'Error fetching solicitud by status' });
        } else if (results.length === 0) {
            res.status(404).json({ error: 'No hay solicitudes pendientes' });
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud);
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada);
            });
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});


// Obtener todas las solicitudes programadas
router.get('/programadas', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = "Programada"', (err, results) => {
        if (err) {
            console.error('Error fetching programadas:', err);
            res.status(500).json({ error: 'Error fetching programadas' });
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud);
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada);
            });
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});



// Obtener una solicitud por ID
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM solicitudes_cirugia WHERE id_solicitud = ?', [id], (err, results) => {
        if (err) {
            console.error('Error fetching solicitud by id:', err);
            res.status(500).json({ error: 'Error fetching solicitud by id' });
        } else if (results.length === 0) {
            res.status(404).json({ error: 'Solicitud not found' });
        } else {
            const solicitud = results[0];
            // Formatear las fechas para visualización
            solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud);
            solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada);
            res.setHeader('Content-Type', 'application/json');
            res.json(solicitud);
        }
    });
});


// Crear una nueva solicitud de cirugía
router.post('/', (req, res) => {
    const solicitud = req.body;

    // Validar campos requeridos
    const requiredFields = [
        'fecha_solicitud', 'clave_esp', 'nombre_especialidad', 'ap_paterno',
        'ap_materno', 'nombre_paciente', 'tipo_intervencion', 'fecha_solicitada',
        'hora_solicitada', 'tiempo_estimado', 'turno_solicitado', 'sala_quirofano',
        'id_cirujano', 'req_insumo', 'tipo_admision', 'estado_solicitud',
        'procedimientos_paciente'
    ];

    for (const field of requiredFields) {
        if (!solicitud[field]) {
            return res.status(400).json({ error: `El campo ${field} es requerido.` });
        }
    }

    // Darle formato a las fechas antes de la inserción
    solicitud.fecha_solicitud = formatDate(solicitud.fecha_solicitud);
    solicitud.fecha_nacimiento = formatDate(solicitud.fecha_nacimiento) || null;
    solicitud.fecha_solicitada = formatDate(solicitud.fecha_solicitada);

    console.log('Datos a insertar en la base de datos:', solicitud);

    db.query('INSERT INTO solicitudes_cirugia SET ?', solicitud, (err, result) => {
        if (err) {
            console.error('Error creating solicitud:', err);
            res.status(500).json({ error: 'Error creating solicitud', details: err.message });
        } else {
            const id_solicitud = result.insertId;

            // Generar el folio
            const formattedFechaSolicitud = removeDashes(solicitud.fecha_solicitud.split(' ')[0]);
            const formattedFechaSolicitada = removeDashes(solicitud.fecha_solicitada.split(' ')[0]);
            const folio = `${formattedFechaSolicitud}-${solicitud.clave_esp}-${formattedFechaSolicitada}-${solicitud.req_insumo.charAt(0)}-${String(id_solicitud).padStart(5, '0')}`;

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

// Actualizar una solicitud de cirugía
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    // Darle formato a las fechas antes de la actualización
    if (updatedData.fecha_solicitud) {
        updatedData.fecha_solicitud = formatDate(updatedData.fecha_solicitud);
    }
    if (updatedData.fecha_nacimiento) {
        updatedData.fecha_nacimiento = formatDate(updatedData.fecha_nacimiento) || null;
    }
    if (updatedData.fecha_solicitada) {
        updatedData.fecha_solicitada = formatDate(updatedData.fecha_solicitada);
    }

    db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedData, id], (err, result) => {
        if (err) {
            console.error('Error updating solicitud:', err);
            res.status(500).json({ error: 'Error updating solicitud', details: err.message });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud actualizada exitosamente.' });
        }
    });
});

// Endpoint para actualizar una solicitud pendiente con los nuevos campos
router.put('/programar/:id', (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    // Validar campos requeridos
    const requiredFields = [
       'fecha_programada', 'hora_asignada', 'turno', 'piso', 'nombre_anestesiologo'
    ];

    for (const field of requiredFields) {
        if (!updatedData[field]) {
            return res.status(400).json({ error: `El campo ${field} es requerido.` });
        }
    }

    // Darle formato a las fechas y horas antes de la actualización
    if (updatedData.fecha_programada) {
        updatedData.fecha_programada = formatDate(updatedData.fecha_programada);
    }

    // Establecer el estado de la solicitud a "Programada"
    updatedData.estado_solicitud = 'Programada';

    db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedData, id], (err, result) => {
        if (err) {
            console.error('Error updating solicitud:', err);
            res.status(500).json({ error: 'Error updating solicitud', details: err.message });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud actualizada exitosamente.' });
        }
    });
});


// Eliminar una solicitud de cirugía
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM solicitudes_cirugia WHERE id_solicitud = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting solicitud:', err);
            res.status(500).json({ error: 'Error deleting solicitud', details: err.message });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud eliminada exitosamente.' });
        }
    });
});

module.exports = router;
