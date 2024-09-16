const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const solicitudesRoutes = require('./routes/solicitudes'); // Importar rutas de solicitudes
const programacionRoutes = require('./routes/programacion');
const eventsRoutes = require('./routes/events');
const usersRouter = require('./routes/users');
const db = require('./database/db'); // Importar la conexión a la base de datos local
const anestesioRoutes = require('./routes/anestesio');
const salasRoutes = require('./routes/salas')
const path = require('path');

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

// Usar las rutas de anestesio
app.use('/api/anestesio', anestesioRoutes);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'build'))); // O 'dist' dependiendo de tu herramienta de construcción

// Redirigir todas las rutas al archivo index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html')); // O 'dist' si es aplicable
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});