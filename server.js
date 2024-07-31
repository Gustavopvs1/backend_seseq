const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const solicitudesRoutes = require('./routes/solicitudes'); // Importar rutas de solicitudes
const programacionRoutes = require('./routes/programacion');
const eventsRoutes = require('./routes/events');
const anestesioRoutes = require('./routes/anestesio');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Ruta base para verificar que el servidor está corriendo
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Ruta base para las rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api', eventsRoutes);

// Usar las rutas de anestesio
app.use('/api/anestesio', anestesioRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
