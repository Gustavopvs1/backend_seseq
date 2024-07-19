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
                solicitud.fecha_nacimiento = formatDateForDisplay(solicitud.fecha_nacimiento);
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

// Endpoint para obtener los motivos de suspensión
router.get('/motivos-suspension', (req, res) => {
    const category = req.query.category || '';

    // Definir las columnas válidas
    const validColumns = [
        'paciente',
        'administrativas',
        'apoyo_clinico',
        'team_quirurgico',
        'infraestructura',
        'tiempo_quirurgico',
        'emergencias',
        'gremiales'
    ];

    // Verificar que la categoría solicitada sea válida
    if (!validColumns.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    // Construir la consulta para obtener los motivos de la categoría seleccionada
    const sqlQuery = `SELECT ${category} AS motivo FROM motivo_suspension WHERE ${category} IS NOT NULL`;

    // Ejecutar la consulta
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error fetching motivos de suspensión:', err);
            res.status(500).json({ error: 'Error fetching motivos de suspensión' });
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
            solicitud.fecha_nacimiento = formatDateForDisplay(solicitud.fecha_nacimiento);
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
        'procedimientos_paciente','diagnostico','procedimientos_extra'
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
router.patch('/suspender/:id', (req, res) => {
    const id = req.params.id;
    const { suspendReason, suspendDetail } = req.body;

    // Obtener el folio actual y las reprogramaciones
    db.query('SELECT folio, reprogramaciones FROM solicitudes_cirugia WHERE id_solicitud = ?', [id], (err, results) => {
        if (err) {
            console.error('Error obteniendo el folio y las reprogramaciones:', err);
            return res.status(500).json({ error: 'Error obteniendo el folio y las reprogramaciones' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        let folio = results[0].folio;
        let reprogramaciones = results[0].reprogramaciones || 0;

        // Si el folio tiene un sufijo de reprogramación, reemplazarlo con "-S"
        if (/-R\d+$/.test(folio)) {
            folio = folio.replace(/-R\d+$/, '-S');
        } else {
            // Si no tiene un sufijo de reprogramación, simplemente añadir "-S"
            folio += '-S';
        }

        // Actualizar el estado, el folio y el motivo de suspensión en la base de datos
        const motivoSuspension = `${suspendReason} - ${suspendDetail}`;
        db.query('UPDATE solicitudes_cirugia SET estado_solicitud = ?, folio = ?, motivo_suspension = ? WHERE id_solicitud = ?', ['Suspendida', folio, motivoSuspension, id], (err, result) => {
            if (err) {
                console.error('Error suspendiendo solicitud:', err);
                return res.status(500).json({ error: 'Error suspendiendo solicitud' });
            }

            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud suspendida exitosamente' });
        });
    });
});

// Crear un endpoint PATCH para actualizar las columnas en la tabla bitacoraenf
router.patch('/bitacoraenf/:id', (req, res) => {
    const id = req.params.id;
    const {
        nuevos_procedimientos_extra,
        hora_entrada,
        hora_incision,
        hora_cierre,
        hora_salida,
        egreso,
        enf_quirurgica,
        enf_circulante
    } = req.body;

    // Validar que nuevos_procedimientos_extra sea un array
    if (!Array.isArray(nuevos_procedimientos_extra)) {
        return res.status(400).json({ error: 'Los procedimientos extra deben ser un array' });
    }

    // Convertir procedimientos extra a JSON
    const procedimientosExtraJSON = JSON.stringify(nuevos_procedimientos_extra);

    // Crear el objeto con los campos a actualizar
    const updatedFields = {
        nuevos_procedimientos_extra: procedimientosExtraJSON,
        hora_entrada,
        hora_incision,
        hora_cierre,
        hora_salida,
        egreso,
        enf_quirurgica,
        enf_circulante
    };

    // Actualizar los campos en la tabla solicitudes_cirugia
    db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedFields, id], (err, result) => {
        if (err) {
            console.error('Error updating bitacoraenf:', err);
            return res.status(500).json({ error: 'Error updating bitacoraenf', details: err.message });
        }

        // Actualizar el estado de la solicitud en la tabla solicitudes_cirugia
        const updateSolicitudQuery = 'UPDATE solicitudes_cirugia SET estado_solicitud = ? WHERE id_solicitud = ?';
        db.query(updateSolicitudQuery, ['Realizada', id], (err, result) => {
            if (err) {
                console.error('Error updating solicitudes_cirugia:', err);
                return res.status(500).json({ error: 'Error updating solicitudes_cirugia', details: err.message });
            }

            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Registro actualizado exitosamente en bitacoraenf y el estado de la solicitud a Realizada.' });
        });
    });
});


// Reprogramar una solicitud suspendida
router.patch('/reprogramar/:id', (req, res) => {
    const id = req.params.id;

    // Obtener el folio actual y el contador de reprogramaciones
    db.query('SELECT folio, reprogramaciones FROM solicitudes_cirugia WHERE id_solicitud = ?', [id], (err, results) => {
        if (err) {
            console.error('Error obteniendo el folio y las reprogramaciones:', err);
            return res.status(500).json({ error: 'Error obteniendo el folio y las reprogramaciones' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        let folio = results[0].folio;
        let reprogramaciones = results[0].reprogramaciones || 0;

        // Remover '-S' si está presente y añadir 'R' seguido del contador de reprogramaciones
        folio = folio.replace(/-S$/, '');
        reprogramaciones += 1;
        folio += `-R${reprogramaciones}`;

        // Actualizar el estado, el folio y el contador de reprogramaciones en la base de datos
        const updatedData = {
            estado_solicitud: 'Pre-programada',
            fecha_programada: null,
            hora_asignada: null,
            turno: null,
            nombre_anestesiologo: null,
            folio: folio,
            reprogramaciones: reprogramaciones
        };

        db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedData, id], (err, result) => {
            if (err) {
                console.error('Error reprogramando solicitud:', err);
                return res.status(500).json({ error: 'Error reprogramando solicitud' });
            }

            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud reprogramada exitosamente.' });
        });
    });
});

router.patch('/anestesia/:id', (req, res) => {
    const id = req.params.id;
    const {
        hi_anestesia,
        tipo_anestesia,
        ht_anestesia
    } = req.body;

    // Crear el objeto con los campos a actualizar
    const updatedFields = {
        hi_anestesia,
        tipo_anestesia,
        ht_anestesia
    };

    // Actualizar los campos en la tabla solicitudes_cirugia
    db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedFields, id], (err, result) => {
        if (err) {
            console.error('Error updating solicitudes_cirugia:', err);
            return res.status(500).json({ error: 'Error updating solicitudes_cirugia', details: err.message });
        }

        res.setHeader('Content-Type', 'application/json');
        res.json({ message: 'Campos actualizados exitosamente en solicitudes_cirugia.' });
    });
});


// Actualizar solicitud programada
router.patch('/actualizar/:id', (req, res) => {
    const id = req.params.id;
    const updatedFields = req.body;

    // Obtener el folio actual y las reprogramaciones
    db.query('SELECT folio, reprogramaciones FROM solicitudes_cirugia WHERE id_solicitud = ?', [id], (err, results) => {
        if (err) {
            console.error('Error obteniendo el folio y las reprogramaciones:', err);
            res.status(500).json({ error: 'Error obteniendo el folio y las reprogramaciones' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ error: 'Solicitud no encontrada' });
            return;
        }

        let folio = results[0].folio;
        let reprogramaciones = results[0].reprogramaciones || 0;

        // Si el folio tiene un sufijo de reprogramación, incrementar el contador de reprogramaciones
        if (/-R\d+$/.test(folio)) {
            reprogramaciones += 1;
            folio = folio.replace(/-R\d+$/, `-R${reprogramaciones}`);
        } else {
            // Si no tiene un sufijo de reprogramación, añadir "-R1"
            folio += '-R1';
            reprogramaciones = 1; // Reiniciar el contador de reprogramaciones
        }

        // Agregar el folio actualizado y el contador de reprogramaciones a los campos a actualizar
        updatedFields.folio = folio;
        updatedFields.reprogramaciones = reprogramaciones;

        // Actualizar la solicitud en la base de datos
        db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedFields, id], (err, result) => {
            if (err) {
                console.error('Error actualizando solicitud:', err);
                res.status(500).json({ error: 'Error actualizando solicitud' });
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.json({ message: 'Solicitud actualizada exitosamente.' });
            }
        });
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
