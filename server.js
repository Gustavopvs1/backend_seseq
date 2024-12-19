const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const solicitudesRoutes = require('./routes/solicitudes'); // Importar rutas de solicitudes
const programacionRoutes = require('./routes/programacion');
const eventsRoutes = require('./routes/events');
const usersRouter = require('./routes/users');
const pdfRoutes = require('./routes/pdf')
const db = require('./database/db'); // Importar la conexión a la base de datos local
const anestesioRoutes = require('./routes/anestesio');
const salasRoutes = require('./routes/salas')
const personalRoutes = require('./routes/personal'); // Importar rutas de personal
const path = require('path');
const insumosRoutes = require('./routes/insumos');
/* const paqueteRoutes = require('./routes/paqueteRoutes')(db);
 */
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Ruta base para verificar que el servidor está corriendo
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Ruta para health-check y mantener activo el backend
app.get('/api/health-check', (req, res) => {
    res.status(200).send('Backend is active');
});

// Ruta base para las rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api', eventsRoutes);
app.use('/api/users', usersRouter);
app.use('/api/salas', salasRoutes);
/* app.use('/api/paquetes', paqueteRoutes); */

// Usar las rutas de anestesio
app.use('/api/anestesio', anestesioRoutes);
// Usar las rutas de personal
app.use('/api/personal', personalRoutes);

app.use ('/api/insumos', insumosRoutes);    

app.use('/api/pdf', pdfRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});