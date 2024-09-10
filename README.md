# Telegram Bot para Restaurante con Node.js y PostgreSQL

Este proyecto es un bot de Telegram desarrollado en Node.js, diseñado para gestionar reservas, consultar menús y ofrecer recomendaciones personalizadas utilizando la API de Hugging Face. El bot se conecta a una base de datos PostgreSQL para almacenar las reservas y manejar el flujo de datos.

## Características

- **Reservas**: Los usuarios pueden realizar reservas para el restaurante directamente desde Telegram.
- **Consultas de Menú**: Permite a los usuarios consultar los platos disponibles en el restaurante.
- **Recomendaciones Personalizadas**: Utiliza la API de Hugging Face para recomendar platos en función de las preferencias y presupuesto del usuario.
- **Flujo Interactivo con Botones**: Evita la entrada de texto libre, utilizando opciones interactivas de botones.
- **Conexión a Base de Datos**: Toda la información, como las reservas, se almacena en PostgreSQL.

## Tecnologías

- **Node.js**: Entorno de ejecución para JavaScript.
- **Telegraf**: Librería para construir bots de Telegram en Node.js.
- **PostgreSQL**: Base de datos relacional para almacenar información.
- **Hugging Face API**: API de IA para ofrecer recomendaciones personalizadas.
  
## Instalación

### 1. Clona el repositorio

Primero, clona este repositorio en tu máquina local:

```bash
git clone https://github.com/TuUsuario/BotTelegram.git
cd BotTelegram


### 2. Instalar dependencias
npm install

### 3. Iniciar protecti
npm start
