/* const express = require('express');
const router = express.Router();

// Exportar como función que recibe la conexión de base de datos
module.exports = (db) => {
    // Crear instancia del controlador
    const PaqueteController = require('../controllers/paqueteController')(db);

    // Definir rutas
    router.post('/inicializar', (req, res) => 
        PaqueteController.inicializarPaquete(req, res)
    );

    router.put('/modificar-insumos', (req, res) => 
        PaqueteController.modificarInsumosPaquete(req, res)
    );

    router.get('/:solicitudId/insumos', (req, res) => 
        PaqueteController.obtenerInsumosPaquete(req, res)
    );

    return router;
}; */