const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const solicitudesRoutes = require('./routes/solicitudes');
const apiRemotas = require('./routes/apiremotas');
const programacionRoutes = require('./routes/programacion');
const eventsRoutes = require('./routes/events');
const anestesioRoutes = require('./routes/anestesio');
const usersRoutes = require('./routes/users'); // Importar las rutas de usuarios

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api', eventsRoutes);
app.use('/api', apiRemotas);
app.use('/api/anestesio', anestesioRoutes);
app.use('/api', usersRoutes); // Añadir la ruta de usuarios

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
