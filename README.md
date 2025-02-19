# Backend - Express.js

Este es el backend del proyecto, desarrollado con **Node.js y Express.js**. Gestiona la lógica de negocio, la conexión a la base de datos y la exposición de APIs.

## 📂 Estructura del Proyecto
```
backend/
│-- database/      # Archivos para la conexión a la base de datos
│   ├── db.js      # Configuración de conexión a la base de datos
│-- routes/        # Definición de rutas y endpoints
│   ├── auth.js    # Autenticación y gestión de usuarios
│   ├── anestesio.js  # Rutas para la asignación de anestesiólogos
│   ├── solicitudes.js  # Rutas para la programación de cirugías (más extenso)
│   ├── users.js    # Gestión de usuarios y permisos
│   ├── procedures.js  # Gestión de procedimientos quirúrgicos
│   ├── personal.js  # Gestión del personal médico y quirúrgico
│-- server.js      # Archivo principal del servidor Express
│-- package.json   # Dependencias y scripts del proyecto
│-- .env.example   # Variables de entorno
```

## 🚀 Instalación y Configuración

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tuusuario/tu-repo.git
   cd backend_seseq
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   - Copia el archivo `.env.example` y renómbralo a `.env`
   - Edita el archivo `.env` con las credenciales de tu base de datos

4. **Iniciar el servidor**
   ```bash
   npm start
   ```
   El servidor se ejecutará en `http://localhost:4000` (por defecto)

## 📌 Endpoints y APIs

### **Autenticación y Usuarios** (auth.js, users.js)
- `POST /api/login` - Inicia sesión y genera un token
- `POST /api/register` - Registra un nuevo usuario
- `GET /api/users` - Obtiene todos los usuarios
- `PATCH /api/users/:id` - Actualiza información de un usuario
- `PATCH /api/password/:id` - Cambia la contraseña de un usuario
- `DELETE /api/users/:id` - Elimina un usuario
- `GET /api/users/:id/screens` - Obtiene pantallas disponibles para un usuario

### **Gestión de Cirugías y Personal**
- `GET /api/solicitudes` - Obtiene todas las solicitudes de cirugía
- `POST /api/solicitudes` - Crea una nueva solicitud de cirugía
- `PUT /api/solicitudes/:id` - Actualiza una solicitud de cirugía
- `DELETE /api/solicitudes/:id` - Elimina una solicitud de cirugía

### **Procedimientos y Asignaciones**
- `GET /api/procedures` - Obtiene la lista de procedimientos quirúrgicos
- `POST /api/procedures` - Agrega un nuevo procedimiento
- `GET /api/personal` - Obtiene el personal médico disponible
- `POST /api/anestesio` - Asigna un anestesiólogo a una cirugía

### **Ejemplo de uso con cURL**
```bash
curl -X GET http://localhost:4000/api/users
```

## 🛠️ Tecnologías utilizadas
- **Node.js**
- **Express.js**
- **MySQL / PostgreSQL** (según configuración en `database/db.js`)
- **dotenv** (para manejar variables de entorno)
- **cors** (para habilitar solicitudes entre dominios)
