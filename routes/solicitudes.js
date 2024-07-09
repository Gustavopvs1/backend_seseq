const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Importar la conexión a la base de datos

const formatDateForDisplay = (date) => {
    if (!date) return null; // Devolver null si la fecha no es válida
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = ('0' + (d.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + d.getUTCDate()).slice(-2);
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
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
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada);
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
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada);
            });
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});

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
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada);
            });
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});

router.get('/suspendidas', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = "Suspendida"', (err, results) => {
        if (err) {
            console.error('Error fetching suspendidas:', err);
            res.status(500).json({ error: 'Error fetching suspendidas' });
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud);
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada);
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada);
            });
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});

// Obtener solicitudes pre-programadas
router.get('/preprogramadas', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = "Pre-programada"', (err, results) => {
        if (err) {
            console.error('Error fetching preprogramadas:', err);
            res.status(500).json({ error: 'Error fetching preprogramadas' });
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud);
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada);
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada);
            });
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});

// Endpoint para obtener los procedimientos con búsqueda
router.get('/procedimientos', (req, res) => {
    const searchQuery = req.query.q || '';

    // Construir la consulta para buscar procedimientos que coincidan con el término de búsqueda
    const sqlQuery = `
        SELECT * FROM procedimientos
        WHERE nombre_procedimiento LIKE ?`;

    // El comodín '%' se usa para buscar cualquier ocurrencia del término de búsqueda
    db.query(sqlQuery, [`%${searchQuery}%`], (err, results) => {
        if (err) {
            console.error('Error fetching procedimientos:', err);
            res.status(500).json({ error: 'Error fetching procedimientos' });
        } else {
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
            solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada);
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
        'nombre_cirujano', 'req_insumo', 'tipo_admision', 'estado_solicitud',
        'procedimientos_paciente'
    ];

    for (const field of requiredFields) {
        if (!solicitud[field]) {
            return res.status(400).json({ error: `El campo ${field} es requerido.` });
        }
    }

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

// Suspender una solicitud
router.put('/preprogramar/:id', (req, res) => {
    const id = req.params.id;
    db.query('UPDATE solicitudes_cirugia SET estado_solicitud = ? WHERE id_solicitud = ?', ['Pre-programada', id], (err, result) => {
        if (err) {
            console.error('Error suspendiendo solicitud:', err);
            res.status(500).json({ error: 'Error preprogramando solicitud' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud preprogramada exitosamente' });
        }
    });
});

// Endpoint para actualizar una solicitud pre-programada a programada
router.put('/programar/:id', (req, res) => {
    const id = req.params.id;
    const { fecha_programada, hora_asignada, turno, nombre_anestesiologo } = req.body;

    // Validar campos requeridos
    if (!fecha_programada || !hora_asignada || !turno || !nombre_anestesiologo) {
        return res.status(400).json({ error: 'Todos los campos son requeridos para programar la cita.' });
    }

    // Establecer el estado de la solicitud a "Programada"
    const updatedData = {
        fecha_programada,
        hora_asignada,
        turno,
        nombre_anestesiologo,
        estado_solicitud: 'Programada'
    };

    db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedData, id], (err, result) => {
        if (err) {
            console.error('Error updating solicitud:', err);
            res.status(500).json({ error: 'Error updating solicitud', details: err.message });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud actualizada exitosamente a Programada.' });
        }
    });
});

// Suspender una solicitud
router.put('/suspender/:id', (req, res) => {
    const id = req.params.id;
    db.query('UPDATE solicitudes_cirugia SET estado_solicitud = ? WHERE id_solicitud = ?', ['Suspendida', id], (err, result) => {
        if (err) {
            console.error('Error suspendiendo solicitud:', err);
            res.status(500).json({ error: 'Error suspendiendo solicitud' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud suspendida exitosamente' });
        }
    });
});

// Reprogramar una solicitud suspendida
router.put('/reprogramar/:id', (req, res) => {
    const id = req.params.id;
    
    
    const updatedData = {
        estado_solicitud: 'Pre-programada',
        fecha_programada: null,
        hora_asignada: null,
        turno: null,
        nombre_anestesiologo: null
    };
    
    db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedData, id], (err, result) => {
        if (err) {
            console.error('Error reprogramando solicitud:', err);
            res.status(500).json({ error: 'Error reprogramando solicitud' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud reprogramada exitosamente.' });
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
