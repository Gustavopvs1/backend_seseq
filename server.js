const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const fs = require('fs');
const http = require('http');
const https = require('https');
const authRoutes = require('./routes/auth');
const solicitudesRoutes = require('./routes/solicitudes');
const programacionRoutes = require('./routes/programacion');
const eventsRoutes = require('./routes/events');
const usersRouter = require('./routes/users');
const db = require('./database/db');
const anestesioRoutes = require('./routes/anestesio');
const salasRoutes = require('./routes/salas');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const HTTPS_PORT = process.env.HTTPS_PORT || 4443;

// Cargar certificados SSL
const privateKey = fs.readFileSync('/etc/letsencrypt/live/gestionquirofanoseseq.org/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/gestionquirofanoseseq.org/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/gestionquirofanoseseq.org/chain.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

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

// Rutas...
app.use('/api/auth', authRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api', eventsRoutes);
app.use('/api/users', usersRouter);
app.use('/api/salas', salasRoutes);
app.use('/api/anestesio', anestesioRoutes);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'build')));

// Redirigir todas las rutas al archivo index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Crear servidores HTTP y HTTPS
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

// Redirigir HTTP a HTTPS
httpServer.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
});

httpsServer.listen(HTTPS_PORT, () => {
    console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
});

// Middleware para redirigir HTTP a HTTPS
app.use((req, res, next) => {
    if (!req.secure) {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    next();
});