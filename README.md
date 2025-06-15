AURA - Sistema de Monitorización de Estados Emocionales Ambientales
AURA (Ambient Understanding and Response Analyzer) es un sistema IoT que permite monitorizar y visualizar estados emocionales en espacios físicos mediante el análisis de factores ambientales (temperatura, humedad, nivel sonoro) y expresiones faciales de sus ocupantes.

AURA Logo

📋 Características principales
Monitorización ambiental mediante dispositivos físicos basados en Raspberry Pi Pico W
Análisis facial a través de la cámara web para simular sensores en cualquier dispositivo
Dashboard en tiempo real para visualizar el estado emocional de espacios
Comunicación bidireccional entre dispositivos y plataforma central
API REST para integración con otros sistemas
Despliegue sencillo mediante Docker Compose
🧩 Componentes del sistema
El proyecto AURA consta de tres componentes principales:

1. AURA-CAM (Dispositivo físico)
Hardware basado en Raspberry Pi Pico W que incorpora:

Sensor de temperatura y humedad DHT11
Micrófono para monitorización de nivel sonoro
Pantalla OLED SSD1306 para visualización de estado
Conectividad WiFi para comunicación con el backend
2. Backend (Node.js/Express/TypeScript)
Servidor que gestiona:

Autenticación y gestión de usuarios
Recepción y procesamiento de datos de dispositivos
API REST para consumo desde el frontend
Comunicación en tiempo real mediante Socket.IO
Persistencia de datos con PostgreSQL y Prisma ORM
3. Frontend (React/TypeScript/Tailwind)
Interfaz web que ofrece:

Dashboard de visualización en tiempo real
Gestión de dispositivos AURA
Simulador AURA-CAM mediante cámara web
Histórico de mediciones y análisis
🛠️ Tecnologías utilizadas
Backend: Node.js, Express, TypeScript, Socket.IO, Prisma ORM
Frontend: React, TypeScript, Tailwind CSS, Vite, face-api.js
Base de datos: PostgreSQL
Dispositivo: MicroPython, Raspberry Pi Pico W
Despliegue: Docker, Docker Compose
🚀 Instalación y despliegue
Requisitos previos
Docker y Docker Compose
Node.js (v18+) y npm
Git
Pasos para despliegue
Clonar el repositorio

Configurar variables de entorno

Ejecutar script de despliegue

Acceder a la aplicación

Frontend: http://localhost:5173
Backend API: http://localhost:4000
📱 Guía de uso
Registrar un usuario
Accede a http://localhost:5173/register
Completa el formulario con tus datos
Inicia sesión con las credenciales creadas
Añadir un dispositivo AURA-CAM
En el Dashboard, haz clic en "➕ Añadir nuevo Aura"
Introduce el código único del dispositivo (ej. AURA-ABC001)
Opcionalmente añade un nombre y descripción
Haz clic en "Reclamar dispositivo"
Usar el simulador AURA Monitor
Accede a http://localhost:5173/monitor
Introduce el código del dispositivo que deseas simular
Concede permiso para usar la cámara
El sistema detectará expresiones faciales y enviará datos al backend
Ver mediciones en tiempo real
Accede al Dashboard principal
Las tarjetas de dispositivos se actualizarán automáticamente
Los nuevos estados emocionales aparecerán destacados momentáneamente
📁 Estructura del proyecto
🌐 Estados emocionales detectados
AURA analiza el ambiente para determinar uno de los siguientes estados emocionales:

Estado	Descripción	Sensor físico	Cámara web
Confort	Bienestar general	Temperatura y sonido óptimos	Expresión feliz dominante
Calma	Tranquilidad	Condiciones estables	Expresión neutral dominante
Energía	Actividad moderada	Nivel medio de sonido	Expresión de miedo o grupo pequeño
Incomodidad	Condiciones subóptimas	Temperatura/humedad extremas	Expresión triste dominante
Estrés	Tensión o nerviosismo	Nivel alto de sonido	Expresión de enojo dominante
Expectativa	Atención concentrada	Nivel muy bajo de sonido	Expresión de sorpresa dominante
Monotonía	Falta de variación	Condiciones sin cambios	Grupo grande sin expresión dominante
Distracción	Dispersión atencional	Cambios rápidos	Expresión de disgusto dominante
Conflicto	Disonancia o fricción	Patrones irregulares	Expresión de desprecio dominante
📄 Licencia
Este proyecto está licenciado bajo MIT License.

🤝 Contribuciones
Las contribuciones son bienvenidas. Para contribuir:

Haz un fork del proyecto
Crea una rama para tu funcionalidad (git checkout -b feature/nueva-funcionalidad)
Realiza tus cambios y haz commit (git commit -m 'Añadir nueva funcionalidad')
Sube tus cambios (git push origin feature/nueva-funcionalidad)
Abre un Pull Request
Desarrollado como parte del proyecto AURA para la monitorización de estados emocionales en espacios inteligentes.
