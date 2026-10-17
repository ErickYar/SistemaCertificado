# 🚗 SistemaCertificado

Sistema web para la gestión de certificados vehiculares SUNARP (Modificación, Montaje, Fabricación y Bonificación), con generación automática de correlativos, control de pagos y reportes automáticos por Telegram.

---

## 📋 Descripción

Sistema desarrollado para empresas certificadoras autorizadas por el MTC que necesitan:

- Registrar clientes (Naturales y Jurídicas) con validación de DNI/RUC.
- Registrar vehículos con catálogos oficiales MTC (categorías, carrocerías, marcas, modelos).
- Emitir certificados vehiculares con **correlativo automático** (ej. `26 000457`).
- Generar **código de control interno** (ej. `SA-50-000686`).
- Gestionar pagos y vincularlos a certificados.
- Enviar **reportes automáticos por Telegram** (día, semana, 15 días y mes).
- Auditar todas las acciones del sistema.

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **Express**
- **MySQL** (mysql2)
- **JWT** para autenticación
- **bcrypt** para hash de contraseñas
- **node-cron** para tareas programadas
- **Axios** para integraciones externas (Telegram)

### Frontend
- **React 18** + **Vite**
- **React Router v6**
- **Axios** con interceptores
- **TailwindCSS v4**
- **Context API** para estado global

### Base de Datos
- **MySQL 8** con diseño normalizado
- Herencia de tablas (`certificado` + hijas)
- Borrado lógico (`activo = 0`)

---

## 📁 Estructura del Proyecto
