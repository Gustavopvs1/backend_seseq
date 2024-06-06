const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Cargar las variables de entorno
const authRoutes = require('./routes/auth');
const solicitudesRoutes = require('./routes/solicitudes'); // Importar rutas de solicitudes

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Ruta base para las rutas de autenticación
app.use('/api/auth', authRoutes);

// Ruta base para las rutas de solicitudes
app.use('/api/solicitudes', solicitudesRoutes); // Añadir ruta de solicitudes

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
