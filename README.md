AURA - Sistema de Monitorización de Estados Emocionales Ambientales
AURA (Ambient Understanding and Response Analyzer) es un sistema IoT que captura y analiza factores ambientales para determinar el "estado emocional" de espacios físicos. Este proyecto ha sido desarrollado como práctica para la asignatura "Internet de las Cosas" del Grado en Ingeniería Informática de la Universidad Politécnica de Valencia (UPV).

Descripción
AURA utiliza sensores ambientales (temperatura, humedad, sonido) para determinar diferentes estados emocionales en espacios físicos. El sistema también ofrece una alternativa basada en detección facial mediante webcam para simular la funcionalidad de los sensores físicos.

El proyecto implementa una arquitectura IoT completa, desde dispositivos embebidos hasta una plataforma en la nube con frontend interactivo.

Características principales
Dispositivo físico basado en Raspberry Pi Pico W (temperatura, humedad, sonido)
Simulador mediante webcam con análisis facial
Backend con API REST y comunicación en tiempo real
Dashboard para visualización de datos
Despliegue mediante Docker y Docker Compose
Tecnologías utilizadas
Hardware:

Raspberry Pi Pico W con MicroPython
Sensores: DHT11 (temperatura/humedad), Micrófono I²S
Pantalla OLED SSD1306
Backend:

Node.js y Express
TypeScript
Socket.IO para comunicación en tiempo real
Prisma ORM con PostgreSQL
Frontend:

React con TypeScript
Tailwind CSS
Biblioteca face-api.js para análisis facial
Despliegue:

Docker y Docker Compose
Nginx (opcional para producción)
Instalación y despliegue rápido
Requisitos previos:

Docker y Docker Compose
Node.js v18+
Git
Clonar el repositorio:

Configurar variables de entorno:

Iniciar el sistema completo:

Acceder al sistema:

Frontend: http://localhost:5173
Backend API: http://localhost:4000
Estructura del proyecto
Uso básico
1. Registrar un usuario
Accede a http://localhost:5173/register
Completa el formulario
2. Añadir un dispositivo AURA
En el dashboard, selecciona "Añadir dispositivo"
Introduce el código del dispositivo (ej. AURA-ABC001)
3. Simulador con webcam
Accede a http://localhost:5173/monitor
Introduce el código del dispositivo a simular
Permite acceso a la cámara
4. Configurar dispositivo físico (Pico W)
Copia raspberry.py a la Pico W como main.py
Configura las credenciales WiFi y servidor en el código
Conecta los sensores según el diagrama de pines
Estados emocionales detectados
El sistema detecta diferentes estados emocionales basados en parámetros ambientales:

Confort: Condiciones óptimas de temperatura, humedad y sonido
Calma: Niveles estables y moderados en todos los parámetros
Energía: Actividad moderada con niveles de sonido medios
Estrés: Niveles de sonido altos o condiciones ambientales adversas
Expectativa: Ambientes silenciosos con baja actividad
Monotonía: Condiciones sin variación durante periodos largos
Incomodidad: Temperatura o humedad fuera de rangos confortables
Distracción: Cambios rápidos en los parámetros ambientales
Trabajo académico
Este proyecto ha sido desarrollado como trabajo práctico para la asignatura "Internet de las Cosas" del Grado en Ingeniería Informática de la UPV. Implementa conceptos como:

Sistemas embebidos y programación de microcontroladores
Arquitecturas IoT de extremo a extremo
Comunicación en tiempo real
Almacenamiento y visualización de datos
Detección y procesamiento de señales
Licencia
Este proyecto es académico y está disponible bajo licencia MIT.

Autores
Desarrollado por Pedro Pina Martínez, Héctor García-Romeu Cebellán y Alfonso Carrascosa Cutanda como práctica para la asignatura "Internet de las Cosas" del Grado en Ingeniería Informática, Universidad Politécnica de Valencia (UPV).
