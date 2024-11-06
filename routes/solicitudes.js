const express = require('express'); // Importa el módulo express para crear el router y manejar las rutas
const router = express.Router(); // Crea un enrutador de express para manejar las rutas relacionadas con las solicitudes de cirugía
const db = require('../database/db'); // Importa la conexión a la base de datos desde un archivo de configuración
const jwt = require('jsonwebtoken');

// Función para formatear fechas en formato YYYY-MM-DD
const formatDateForDisplay = (date) => {
    if (!date) return null; // Retorna null si la fecha es inválida o no está presente
    const d = new Date(date); // Crea un objeto Date a partir de la fecha proporcionada
    const year = d.getUTCFullYear(); // Obtiene el año en formato UTC
    const month = ('0' + (d.getUTCMonth() + 1)).slice(-2); // Obtiene el mes en formato UTC, asegurando que siempre tenga dos dígitos
    const day = ('0' + d.getUTCDate()).slice(-2); // Obtiene el día en formato UTC, asegurando que siempre tenga dos dígitos
    const formattedDate = `${year}-${month}-${day}`; // Formatea la fecha en formato YYYY-MM-DD
    return formattedDate; // Retorna la fecha formateada
};

// Función para convertir la fecha de yyyy-mm-dd a ddmmaaaa y eliminar guiones
const removeDashes = (dateString) => {
    const [year, month, day] = dateString.split('-'); // Divide la fecha en partes
    return `${day}${month}${year}`; // Reorganiza en formato ddmmaaaa y elimina guiones
};


// Ruta para obtener todas las solicitudes de cirugía
router.get('/', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia', (err, results) => { // Ejecuta una consulta para obtener todas las solicitudes de cirugía
        if (err) {
            console.error('Error fetching solicitudes:', err); // Muestra un error en la consola si ocurre un problema con la consulta
            res.status(500).json({ error: 'Error fetching solicitudes' }); // Envía una respuesta de error al cliente
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud); // Formatea la fecha de solicitud
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada); // Formatea la fecha solicitada
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada); // Formatea la fecha programada
                solicitud.fecha_nacimiento = formatDateForDisplay(solicitud.fecha_nacimiento); // Formatea la fecha de nacimiento
            });
            res.setHeader('Content-Type', 'application/json'); // Establece el tipo de contenido de la respuesta
            res.json(results); // Envía los resultados de la consulta como respuesta
        }
    });
});


// Ruta para verificar si ya existe una solicitud con la misma fecha, hora y sala
// Ruta para verificar conflictos
router.post('/check', (req, res) => {
    const { fecha_solicitada, hora_solicitada, sala_quirofano, tiempo_estimado } = req.body;

    // Validación de campos
    if (!fecha_solicitada || !hora_solicitada || !sala_quirofano || !tiempo_estimado) {
        return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    // Convierte la hora y fecha a una marca de tiempo
    const startTime = new Date(`${fecha_solicitada}T${hora_solicitada}`);
    const endTime = new Date(startTime.getTime() + parseInt(tiempo_estimado, 10) * 60000); // tiempo_estimado en minutos

    // Consulta para encontrar conflictos de horario considerando el estado de la sala
    const query = `
        SELECT s.* FROM solicitudes_cirugia s
        JOIN salas_quirofano sa ON s.sala_quirofano = sa.id
        WHERE sa.estado = true AND s.sala_quirofano = ? AND s.fecha_solicitada = ? AND (
            (s.hora_solicitada < ? AND ADDTIME(s.hora_solicitada, CONCAT(?, ' MINUTE')) > ?)
            OR
            (s.hora_solicitada < ? AND ADDTIME(s.hora_solicitada, CONCAT(?, ' MINUTE')) > ?)
        )
    `;

    db.query(query, [
        sala_quirofano, 
        fecha_solicitada, 
        startTime, 
        tiempo_estimado, 
        startTime, 
        endTime, 
        tiempo_estimado, 
        endTime
    ], (err, results) => {
        if (err) {
            console.error('Error checking for conflicts:', err);
            res.status(500).json({ error: 'Error checking for conflicts' });
        } else {
            res.json({ exists: results.length > 0 });
        }
    });
});


// Ruta para obtener solicitudes de cirugía con estado "Pendiente"
router.get('/pendientes', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = ?', ['Pendiente'], (err, results) => { // Ejecuta una consulta para obtener solicitudes con estado "Pendiente"
        if (err) {
            console.error('Error fetching solicitud by status:', err); // Muestra un error en la consola si ocurre un problema con la consulta
            res.status(500).json({ error: 'Error fetching solicitud by status' }); // Envía una respuesta de error al cliente
        } else if (results.length === 0) {
            res.status(404).json({ error: 'No hay solicitudes pendientes' }); // Envía una respuesta si no se encuentran solicitudes pendientes
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud); // Formatea la fecha de solicitud
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada); // Formatea la fecha solicitada
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada); // Formatea la fecha programada
            });
            res.setHeader('Content-Type', 'application/json'); // Establece el tipo de contenido de la respuesta
            res.json(results); // Envía los resultados de la consulta como respuesta
        }
    });
});

// Ruta para obtener solicitudes de cirugía con estado "Programada"
router.get('/programadas', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = "Programada"', (err, results) => { // Ejecuta una consulta para obtener solicitudes con estado "Programada"
        if (err) {
            console.error('Error fetching programadas:', err); // Muestra un error en la consola si ocurre un problema con la consulta
            res.status(500).json({ error: 'Error fetching programadas' }); // Envía una respuesta de error al cliente
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud); // Formatea la fecha de solicitud
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada); // Formatea la fecha solicitada
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada); // Formatea la fecha programada
            });
            res.setHeader('Content-Type', 'application/json'); // Establece el tipo de contenido de la respuesta
            res.json(results); // Envía los resultados de la consulta como respuesta
        }
    });
});

// Ruta para obtener solicitudes de cirugía con estado "Programada"
router.get('/editables', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = "Editable"', (err, results) => { // Ejecuta una consulta para obtener solicitudes con estado "Programada"
        if (err) {
            console.error('Error fetching editables:', err); // Muestra un error en la consola si ocurre un problema con la consulta
            res.status(500).json({ error: 'Error fetching editables' }); // Envía una respuesta de error al cliente
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud); // Formatea la fecha de solicitud
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada); // Formatea la fecha solicitada
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada); // Formatea la fecha programada
            });
            res.setHeader('Content-Type', 'application/json'); // Establece el tipo de contenido de la respuesta
            res.json(results); // Envía los resultados de la consulta como respuesta
        }
    });
});

// Ruta para obtener solicitudes de cirugía con estado "Suspendida"
router.get('/suspendidas', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = "Suspendida"', (err, results) => { // Ejecuta una consulta para obtener solicitudes con estado "Suspendida"
        if (err) {
            console.error('Error fetching suspendidas:', err); // Muestra un error en la consola si ocurre un problema con la consulta
            res.status(500).json({ error: 'Error fetching suspendidas' }); // Envía una respuesta de error al cliente
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud); // Formatea la fecha de solicitud
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada); // Formatea la fecha solicitada
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada); // Formatea la fecha programada
            });
            res.setHeader('Content-Type', 'application/json'); // Establece el tipo de contenido de la respuesta
            res.json(results); // Envía los resultados de la consulta como respuesta
        }
    });
});

// Ruta para obtener solicitudes de cirugía con estado "Suspendida"
router.get('/reailizadas', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = "Realizada"', (err, results) => { // Ejecuta una consulta para obtener solicitudes con estado "Suspendida"
        if (err) {
            console.error('Error fetching reailizadas:', err); // Muestra un error en la consola si ocurre un problema con la consulta
            res.status(500).json({ error: 'Error fetching reailizadas' }); // Envía una respuesta de error al cliente
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud); // Formatea la fecha de solicitud
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada); // Formatea la fecha solicitada
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada); // Formatea la fecha programada
            });
            res.setHeader('Content-Type', 'application/json'); // Establece el tipo de contenido de la respuesta
            res.json(results); // Envía los resultados de la consulta como respuesta
        }
    });
});

// Ruta para obtener solicitudes de cirugía con estado "Realizada"
router.get('/realizadas', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = "Realizada"', (err, results) => { // Ejecuta una consulta para obtener solicitudes con estado "Realizada"
        if (err) {
            console.error('Error fetching realizadas:', err); // Muestra un error en la consola si ocurre un problema con la consulta
            res.status(500).json({ error: 'Error fetching realizadas' }); // Envía una respuesta de error al cliente
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud); // Formatea la fecha de solicitud
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada); // Formatea la fecha solicitada
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada); // Formatea la fecha programada
            });
            res.setHeader('Content-Type', 'application/json'); // Establece el tipo de contenido de la respuesta
            res.json(results); // Envía los resultados de la consulta como respuesta
        }
    });
});

// Ruta para obtener solicitudes de cirugía con estado "Realizada" en el mes actual
router.get('/realizadasMes', (req, res) => {
    // Obtener la fecha de inicio y fin del mes actual
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Formatear las fechas para MySQL
    const formattedFirstDay = firstDayOfMonth.toISOString().slice(0, 10);
    const formattedLastDay = lastDayOfMonth.toISOString().slice(0, 10);

    const query = `
        SELECT * FROM solicitudes_cirugia 
        WHERE estado_solicitud = "Realizada"
        AND fecha_solicitada BETWEEN ? AND ?`;

    // Ejecutar la consulta
    db.query(query, [formattedFirstDay, formattedLastDay], (err, results) => {
        if (err) {
            console.error('Error fetching realizadasMes:', err); // Muestra un error en la consola si ocurre un problema con la consulta
            res.status(500).json({ error: 'Error fetching realizadasMes' }); // Envía una respuesta de error al cliente
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud); // Formatea la fecha de solicitud
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada); // Formatea la fecha solicitada
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada); // Formatea la fecha programada
            });
            res.setHeader('Content-Type', 'application/json'); // Establece el tipo de contenido de la respuesta
            res.json(results); // Envía los resultados de la consulta como respuesta
        }
    });
});



// Ruta para obtener solicitudes de cirugía con estado "Pre-programada"
router.get('/preprogramadas', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = "Pre-programada"', (err, results) => { // Ejecuta una consulta para obtener solicitudes con estado "Pre-programada"
        if (err) {
            console.error('Error fetching preprogramadas:', err); // Muestra un error en la consola si ocurre un problema con la consulta
            res.status(500).json({ error: 'Error fetching preprogramadas' }); // Envía una respuesta de error al cliente
        } else {
            // Formatear las fechas para visualización
            results.forEach(solicitud => {
                solicitud.fecha_solicitud = formatDateForDisplay(solicitud.fecha_solicitud); // Formatea la fecha de solicitud
                solicitud.fecha_solicitada = formatDateForDisplay(solicitud.fecha_solicitada); // Formatea la fecha solicitada
                solicitud.fecha_programada = formatDateForDisplay(solicitud.fecha_programada); // Formatea la fecha programada
            });
            res.setHeader('Content-Type', 'application/json'); // Establece el tipo de contenido de la respuesta
            res.json(results); // Envía los resultados de la consulta como respuesta
        }
    });
});

router.get('/geturgencias', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia WHERE estado_solicitud = "Urgencia"', (err, results) => {
        if (err) {
            console.error('Error fetching urgencias:', err);
            res.status(500).json({ error: 'Error fetching urgencias' });
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

// Endpoint para obtener los procedimientos con búsqueda
router.get('/personal', (req, res) => {
    const searchQuery = req.query.q || '';

    // Construir la consulta para buscar procedimientos que coincidan con el término de búsqueda
    const sqlQuery = `
        SELECT * FROM personal
        WHERE nombre_completo LIKE ?`;

    // El comodín '%' se usa para buscar cualquier ocurrencia del término de búsqueda
    db.query(sqlQuery, [`%${searchQuery}%`], (err, results) => {
        if (err) {
            console.error('Error fetching personal:', err);
            res.status(500).json({ error: 'Error fetching personal' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});


      
// Endpoint para obtener los diagnosticos con búsqueda
router.get('/diagnosticos', (req, res) => {
    const searchQuery = req.query.q || '';
  
    // Construir la consulta para buscar diagnosticos que coincidan con el término de búsqueda
    const sqlQuery = `
        SELECT * FROM diagnosticos_cie10
        WHERE nombre_diagnostico LIKE ?`;
  
    // El comodín '%' se usa para buscar cualquier ocurrencia del término de búsqueda
    db.query(sqlQuery, [`%${searchQuery}%`], (err, results) => {
        if (err) {
            console.error('Error fetching diagnosticos:', err);
            res.status(500).json({ error: 'Error fetching diagnosticos' });
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
// Crear una nueva solicitud de cirugía
router.post('/', (req, res) => {
    const solicitud = req.body;

    // Convertir campos específicos a mayúsculas
    const camposAMayusculas = [
        'nombre_paciente', 'ap_paterno', 'ap_materno', 'nombre_cirujano',
        'no_expediente', 'curp', 'procedimientos_paciente', 'diagnostico'
    ];

    camposAMayusculas.forEach(campo => {
        if (solicitud[campo]) {
            solicitud[campo] = solicitud[campo].toUpperCase();
        }
    });

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



// Crear una nueva solicitud de cirugía
router.post('/urgencias', (req, res) => {
    const solicitud = req.body;

    // Validar campos requeridos
    const requiredFields = [
        'fecha_solicitud', 'clave_esp', 'nombre_especialidad', 'ap_paterno',
        'ap_materno', 'nombre_paciente', 'tipo_intervencion', 'fecha_programada',
        'turno_solicitado', 'sala_quirofano', 'nombre_cirujano', 'req_insumo', 'estado_solicitud',
        'procedimientos_paciente', 'diagnostico', 'nuevos_procedimientos_extra', 'nombre_anestesiologo',
        'enf_quirurgica', 'enf_circulante'
    ];

    const missingFields = requiredFields.filter(field => !solicitud[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Los siguientes campos son requeridos: ${missingFields.join(', ')}` });
    }

    // Convertir `nuevos_procedimientos_extra` y `tipo_anestesia` a JSON
    solicitud.nuevos_procedimientos_extra = JSON.stringify(solicitud.nuevos_procedimientos_extra);
    solicitud.tipo_anestesia = JSON.stringify(solicitud.tipo_anestesia);

    console.log('Datos a insertar en la base de datos:', solicitud);

    db.query('INSERT INTO solicitudes_cirugia SET ?', solicitud, (err, result) => {
        if (err) {
            console.error('Error creating solicitud de urgencia:', err);
            res.status(500).json({ error: 'Error creating solicitud de urgencia', details: err.message });
        } else {
            const id_solicitud = result.insertId;

            // Generar el folio
            const removeDashes = (str) => str.replace(/-/g, '');
            const formattedFechaSolicitud = removeDashes(solicitud.fecha_solicitud.split(' ')[0]);
            const formattedFechaSolicitada = removeDashes(solicitud.fecha_programada.split(' ')[0]);
            const folio = `${formattedFechaSolicitud}-${solicitud.clave_esp}-${formattedFechaSolicitada}-${solicitud.req_insumo.charAt(0)}-${String(id_solicitud).padStart(5, '0')}-U`;

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
    const { fecha_programada, hora_asignada, turno, sala_quirofano, nombre_anestesiologo } = req.body;

    // Validar campos requeridos
    if (!fecha_programada || !hora_asignada || !turno || !sala_quirofano || !nombre_anestesiologo) {
        return res.status(400).json({ error: 'Todos los campos son requeridos para programar la cita.' });
    }

    // Establecer el estado de la solicitud a "Programada"
    const updatedData = {
        fecha_programada,
        hora_asignada,
        turno,
        sala_quirofano,
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

router.put('/delete/:id', (req, res) => {
    const id = req.params.id;
    db.query('UPDATE solicitudes_cirugia SET estado_solicitud = ? WHERE id_solicitud = ?', ['Eliminada', id], (err, result) => {
        if (err) {
            console.error('Error eliminando solicitud:', err);
            res.status(500).json({ error: 'Error eliminando solicitud' });
        } else {
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Solicitud no encontrada' });
            }
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud eliminada exitosamente' });
        }
    });
});


router.patch('/bitacoraenf/:id', (req, res) => {
    const id = req.params.id;
    const {
        nuevos_procedimientos_extra,
        hora_entrada,
        nombre_cirujano,
        nombre_anestesiologo,
        hora_salida,
        hora_incision,
        hora_cierre,
        egreso,
        sala_quirofano,
        enf_quirurgica,
        enf_circulante,
        comentarios,
        ultimo_editor,
    } = req.body;

    // Validar si todos los campos requeridos están completos
    const allFieldsPresent = hora_entrada && sala_quirofano && nombre_cirujano && nombre_anestesiologo && hora_incision && hora_cierre &&
        hora_salida && egreso && enf_quirurgica && enf_circulante;

    // Asignar el estado en función de si todos los campos están presentes
    const estadoSolicitud = allFieldsPresent ? 'Realizada' : 'Editable';

    // Crear un timestamp para cuando la solicitud se marca como Realizada
    const timestamp_no_editable = allFieldsPresent ? new Date() : null;

    // Actualizar los campos, incluyendo el estado, el nuevo timestamp y el último editor
    const updatedFields = {
        nuevos_procedimientos_extra: nuevos_procedimientos_extra ? JSON.stringify(nuevos_procedimientos_extra) : null,
        hora_entrada: hora_entrada || null,
        nombre_cirujano: nombre_cirujano || null,
        nombre_anestesiologo: nombre_anestesiologo || null,
        hora_salida: hora_salida || null,
        sala_quirofano: sala_quirofano || null,
        egreso: egreso || null,
        hora_incision: hora_incision || null,
        hora_cierre: hora_cierre || null,
        enf_quirurgica: enf_quirurgica || null,
        enf_circulante: enf_circulante || null,
        comentarios: comentarios || null,
        estado_solicitud: estadoSolicitud,
        timestamp_no_editable: timestamp_no_editable,
        ultimo_editor: ultimo_editor || null, // Asegurarse de que se guarde incluso si es null
    };

    // Realizar la actualización en la base de datos
    db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedFields, id], (err, result) => {
        if (err) {
            console.error('Error updating bitacoraenf:', err);
            return res.status(500).json({ error: 'Error updating bitacoraenf', details: err.message });
        }

        res.setHeader('Content-Type', 'application/json');
        res.json({
            message: `Registro actualizado exitosamente en bitacoraenf y el estado de la solicitud a ${estadoSolicitud}.`,
            timestamp_no_editable: timestamp_no_editable,
            ultimo_editor: ultimo_editor
        });
    });
});

  // Crear un endpoint PATCH para actualizar las columnas en la tabla bitacoraenf
router.patch('/bitacoranes/:id', (req, res) => {
    const id = req.params.id;
    const {
      hi_anestesia,
      tipo_anestesia,
      ht_anestesia
    } = req.body;
    
    // Convertimos tipo_anestesia a una cadena separada por comas
    const tipo_anestesia_str = Array.isArray(tipo_anestesia) ? tipo_anestesia.join(',') : tipo_anestesia;
  
    const updatedFields = {
      hi_anestesia,
      tipo_anestesia: tipo_anestesia_str,
      ht_anestesia,

    };
  
    // Actualizar los campos en la tabla solicitudes_cirugia
    db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedFields, id], (err, result) => {
      if (err) {
        console.error('Error updating bitacoranes:', err);
        return res.status(500).json({ error: 'Error updating bitacoranes', details: err.message });
      }
  
      res.setHeader('Content-Type', 'application/json');
      res.json({ message: 'Registro actualizado exitosamente en bitacoranes.' });
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
  
// Actualizar solicitud programada
router.patch('/actualizarevaluacion/:id', (req, res) => {
    const id = req.params.id;
    const updatedFields = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID de solicitud no proporcionado' });
    }

    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedFields, id], (err, result) => {
        if (err) {
            console.error('Error actualizando solicitud:', err);
            res.status(500).json({ error: 'Error actualizando solicitud' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Solicitud no encontrada' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud actualizada exitosamente.' });
        }
    });
});

router.patch('/editarrealizadas/:id', (req, res) => {
    const id = req.params.id;
    const updatedFields = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID de solicitud no proporcionado' });
    }

    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    // Verificar y corregir el campo nuevos_procedimientos_extra si está vacío
    if (updatedFields.nuevos_procedimientos_extra === '') {
        updatedFields.nuevos_procedimientos_extra = '[ "" ]'; // JSON vacío
    }

    // Eliminar el campo 'timestamp_no_editable' para que no se actualice
    if ('timestamp_no_editable' in updatedFields) {
        delete updatedFields.timestamp_no_editable;
    }

    // Realizar la actualización de los campos permitidos
    db.query('UPDATE solicitudes_cirugia SET ? WHERE id_solicitud = ?', [updatedFields, id], (err, result) => {
        if (err) {
            console.error('Error actualizando solicitud:', err);
            res.status(500).json({ error: 'Error al actualizar la solicitud.' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Solicitud no encontrada.' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Solicitud actualizada exitosamente.' });
        }
    });
});



module.exports = router;