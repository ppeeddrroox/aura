"""
AURA Device para Raspberry Pi Pico W
-----------------------------------
Librerías necesarias:
1. ssd1306.py - Para la pantalla OLED
   Descargar de: https://github.com/micropython/micropython-lib/blob/master/micropython/drivers/display/ssd1306/ssd1306.py

2. machine.I2S - Para el micrófono I²S (incluida en MicroPython para Pico)

3. dht.py - Para el sensor de temperatura/humedad (incluida en MicroPython)

Instrucciones de instalación:
1. Instalar MicroPython en la Raspberry Pi Pico W
2. Descargar ssd1306.py y copiarla a la Pico W
3. Copiar este archivo como main.py en la Pico W
4. Reiniciar la Pico W

Conexiones de hardware:
- OLED SSD1306: SDA=GP0, SCL=GP1
- DHT11: DATA=GP2 (con resistencia pull-up 4.7kΩ a 3.3V)
- Micrófono I²S: L/R=GP9, SCK/BCLK=GP10, WS/LRCLK=GP11, SD/DOUT=GP12
"""

import network
import urequests
import json
import time
import uasyncio as asyncio
from machine import Pin, I2C, I2S, ADC
import dht
from ssd1306 import SSD1306_I2C  # Importar librería SSD1306
import struct
import math
import gc

# ------------------------------------------------------------------------
# Configuración general
# ------------------------------------------------------------------------
WIFI_SSID = "iPhone de Pedro"
WIFI_PASSWORD = "HolaHoal"
SERVER_URL = "http://172.20.10.3:4000"  # Ajusta a la IP de tu servidor
DEVICE_CODE = "AURA-ABC001"               # Código único del dispositivo
UPDATE_INTERVAL = 30                      # Segundos entre mediciones

# Pines para sensores
DHT_PIN = 2        # GP2 para sensor DHT11
MIC_LR_PIN = 9     # GP9 para selección de canal L/R
MIC_WS_PIN = 11    # GP11 para Word Select
MIC_SCK_PIN = 10   # GP10 para Bit Clock
MIC_SD_PIN = 12    # GP12 para Datos
OLED_SDA_PIN = 0   # GP0 para I2C SDA
OLED_SCL_PIN = 1   # GP1 para I2C SCL

# OLED SSD1306 constantes
OLED_WIDTH = 128
OLED_HEIGHT = 64
OLED_ADDR = 0x3C   # Dirección I2C típica para SSD1306

# Estados emocionales y umbrales
EMOTION_STATES = {
    "Confort": {
        "temp_min": 21, 
        "temp_max": 26, 
        "hum_min": 40, 
        "hum_max": 60,
        "sound_max": 0.3
    },
    "Incomodidad": {
        "temp_min": None, 
        "temp_max": None, 
        "hum_min": None, 
        "hum_max": None,
        "sound_max": None
    },
    "Calma": {
        "temp_min": 19, 
        "temp_max": 28, 
        "hum_min": 30, 
        "hum_max": 70,
        "sound_max": 0.5
    },
    "Estrés": {
        "temp_min": None, 
        "temp_max": None, 
        "hum_min": None, 
        "hum_max": None,
        "sound_max": 0.8  # Por encima de este nivel
    },
    "Expectativa": {
        "temp_min": None, 
        "temp_max": None, 
        "hum_min": None, 
        "hum_max": None,
        "sound_max": 0.1  # Muy silencioso
    },
    "Energía": {
        "temp_min": None, 
        "temp_max": None, 
        "hum_min": None, 
        "hum_max": None,
        "sound_max": None
    },
    "Distracción": {
        "temp_min": None, 
        "temp_max": None, 
        "hum_min": None, 
        "hum_max": None,
        "sound_max": None
    },
    "Monotonía": {
        "temp_min": None, 
        "temp_max": None, 
        "hum_min": None, 
        "hum_max": None,
        "sound_max": None
    },
    "Conflicto": {
        "temp_min": None, 
        "temp_max": None, 
        "hum_min": None, 
        "hum_max": None,
        "sound_max": None
    }
}

# ------------------------------------------------------------------------
# Clase para manejar el micrófono I2S
# ------------------------------------------------------------------------
class AudioSensor:
    def __init__(self, ws_pin, sck_pin, sd_pin, lr_pin=None):
        """
        Inicializa el sensor de audio I2S
        """
        # Configurar pin LR si se proporciona
        if lr_pin is not None:
            self.lr = Pin(lr_pin, Pin.OUT)
            self.lr.value(0)  # 0=Left, 1=Right
        
        try:
            # Usar machine.I2S para el micrófono
            self.audio = I2S(
                0,                  # Instancia I2S 0
                sck=Pin(sck_pin),   # Bit Clock
                ws=Pin(ws_pin),     # Word Select
                sd=Pin(sd_pin),     # Serial Data
                mode=I2S.RX,        # Modo de recepción
                bits=16,            # 16 bits por muestra
                format=I2S.MONO,    # Formato MONO
                rate=16000,         # Frecuencia de muestreo 16kHz
                ibuf=4096           # Buffer interno
            )
            self.buffer = bytearray(1600 * 2)  # Buffer para 100ms de audio a 16kHz
            self.use_i2s = True
            print("I2S inicializado correctamente")
        except (ImportError, AttributeError):
            # Fallback a ADC si I2S no está disponible
            print("I2S no disponible, usando ADC como fallback")
            self.adc = ADC(Pin(26))  # Usamos ADC en GPIO26 como fallback
            self.use_i2s = False

    def read_level(self):
        """
        Lee el nivel de audio y devuelve un valor normalizado entre 0.0 y 1.0
        """
        if self.use_i2s:
            # Usando I2S
            try:
                bytes_read = self.audio.readinto(self.buffer)
                if bytes_read > 0:
                    # Convertir a muestras de 16 bits
                    samples = struct.unpack("<{}h".format(bytes_read // 2), self.buffer[:bytes_read])
                    
                    # Calcular RMS (Root Mean Square)
                    sum_squares = sum(sample * sample for sample in samples)
                    rms = math.sqrt(sum_squares / len(samples))
                    
                    # Normalizar a 0-1 (ajustar según sensibilidad del micrófono)
                    level = min(1.0, rms / 10000)
                    return level
                return 0.0
            except Exception as e:
                print("Error leyendo I2S:", e)
                return 0.0
        else:
            # Usando ADC como fallback
            try:
                # Tomamos varias muestras y promediamos
                samples = [self.adc.read_u16() for _ in range(10)]
                avg = sum(samples) / len(samples)
                # Normalizar a 0-1
                return avg / 65535
            except Exception as e:
                print("Error leyendo ADC:", e)
                return 0.0

# ------------------------------------------------------------------------
# Clase principal del dispositivo AURA
# ------------------------------------------------------------------------
class AuraDevice:
    def __init__(self):
        # Inicializar componentes
        self.i2c = I2C(0, sda=Pin(OLED_SDA_PIN), scl=Pin(OLED_SCL_PIN), freq=400000)
        self.display = SSD1306_I2C(OLED_WIDTH, OLED_HEIGHT, self.i2c, addr=OLED_ADDR)
        self.temp_sensor = dht.DHT11(Pin(DHT_PIN))
        self.audio = AudioSensor(MIC_WS_PIN, MIC_SCK_PIN, MIC_SD_PIN, MIC_LR_PIN)
        self.led = Pin("LED", Pin.OUT)  # LED integrado
        
        # Estado de conexión WiFi
        self.wlan = network.WLAN(network.STA_IF)
        self.connected = False
        self.config = None
        self.last_temp = None
        self.last_hum = None
        self.last_sound = None
        self.last_state = None
        
        # Inicializar pantalla
        self.display.fill(0)
        self.display.text("AURA Device", 20, 0)
        self.display.text(f"ID: {DEVICE_CODE}", 0, 10)
        self.display.text("Iniciando...", 0, 30)
        self.display.show()

    def connect_wifi(self):
        """Establece conexión WiFi"""
        self.display_message("Conectando WiFi...")
        
        # Activar WiFi y conectar
        self.wlan.active(True)
        self.wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        
        attempts = 0
        max_attempts = 20
        while not self.wlan.isconnected() and attempts < max_attempts:
            self.led.toggle()
            time.sleep(1)
            attempts += 1
            self.display.text(f"Intento {attempts}/{max_attempts}", 0, 20)
            self.display.show()
        
        if self.wlan.isconnected():
            self.connected = True
            ip = self.wlan.ifconfig()[0]
            self.display_message(f"Conectado!\nIP: {ip}")
            self.led.on()
            return True
        else:
            self.display_message("Error WiFi\nVerifica credenciales")
            self.led.off()
            return False
    
    def get_config(self):
        """Obtiene configuración del servidor AURA"""
        if not self.connected:
            return False
        
        try:
            self.display_message("Obteniendo config...")
            response = urequests.get(
                f"{SERVER_URL}/api/devices/config",
                headers={"x-device-code": DEVICE_CODE}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.config = data.get('config', {})
                self.display_message(f"Config OK\nIntervalo: {self.config.get('samplingInterval', UPDATE_INTERVAL)}s")
                response.close()
                return True
            else:
                self.display_message(f"Error config: {response.status_code}")
                response.close()
                return False
        except Exception as e:
            self.display_message(f"Error: {str(e)}")
            return False
    
    def send_measurement(self, room_state, measurement):
        """Envía mediciones al servidor AURA"""
        if not self.connected:
            return False
        
        try:
            self.display_message(f"Enviando datos...\n{room_state}: {measurement:.2f}")
            
            # Preparar payload
            data = {
                "code": DEVICE_CODE,
                "measurement": measurement,
                "roomState": room_state
            }
            
            # Enviar datos mediante HTTP POST
            response = urequests.post(
                f"{SERVER_URL}/api/devices/data",
                json=data,
                headers={"Content-Type": "application/json"}
            )
            
            status = "OK" if response.status_code == 200 else f"ERR:{response.status_code}"
            self.display_message(f"Envío: {status}")
            response.close()
            gc.collect()  # Liberamos memoria
            return response.status_code == 200
        except Exception as e:
            self.display_message(f"Error: {str(e)}")
            gc.collect()  # Liberamos memoria en caso de error
            return False
    
    def read_sensors(self):
        """Lee todos los sensores y devuelve los valores normalizados"""
        # Leer sensor DHT11 (temperatura y humedad)
        try:
            self.temp_sensor.measure()
            temp = self.temp_sensor.temperature()
            hum = self.temp_sensor.humidity()
            self.last_temp = temp
            self.last_hum = hum
        except Exception as e:
            temp = self.last_temp
            hum = self.last_hum
            print(f"Error leyendo DHT11: {e}")
        
        # Leer nivel de sonido
        try:
            sound_level = self.audio.read_level()
            self.last_sound = sound_level
        except Exception as e:
            sound_level = self.last_sound
            print(f"Error leyendo audio: {e}")
        
        return temp, hum, sound_level
    
    def determine_state(self, temp, hum, sound_level):
        """
        Determina el estado del ambiente basado en las lecturas de sensores
        según las reglas definidas en el componente Monitor del frontend
        """
        if temp is None or hum is None or sound_level is None:
            if self.last_state:
                return self.last_state, 0.5  # Usamos el último estado conocido
            return "Calma", 0.5  # Estado por defecto si no hay lecturas
        
        # Algoritmo para determinar el estado emocional
        
        # 1. Estrés por sonido alto
        if sound_level > 0.7:
            self.last_state = "Estrés"
            return "Estrés", sound_level
        
        # 2. Incomodidad por temperatura o humedad extremas
        if temp > 27:
            self.last_state = "Incomodidad"
            return "Incomodidad", min(1.0, (temp - 22) / 8)
            
        if temp < 19:
            self.last_state = "Incomodidad"
            return "Incomodidad", min(1.0, (20 - temp) / 5)
            
        if hum > 70:
            self.last_state = "Incomodidad"
            return "Incomodidad", min(1.0, (hum - 60) / 20)
            
        if hum < 30:
            self.last_state = "Incomodidad"
            return "Incomodidad", min(1.0, (40 - hum) / 15)
        
        # 3. Confort en condiciones óptimas
        if 22 <= temp <= 26 and 40 <= hum <= 60 and sound_level < 0.2:
            self.last_state = "Confort"
            return "Confort", 1.0 - sound_level
        
        # 4. Expectativa en silencio
        if sound_level < 0.1:
            self.last_state = "Expectativa"
            return "Expectativa", 1.0 - sound_level
        
        # 5. Energía en situaciones activas pero cómodas
        if 0.3 < sound_level < 0.6 and 20 <= temp <= 27:
            self.last_state = "Energía"
            return "Energía", sound_level + (1 - abs(temp - 23.5) / 6)
            
        # 6. Calma en condiciones moderadas
        comfort_factor = 1.0 - (abs(temp - 23) / 8) - (abs(hum - 50) / 30) - sound_level
        self.last_state = "Calma"
        return "Calma", max(0.1, min(1.0, comfort_factor))
    
    def display_message(self, message):
        """Muestra un mensaje en la pantalla OLED"""
        self.display.fill(0)
        lines = message.split('\n')
        for i, line in enumerate(lines):
            self.display.text(line, 0, i * 10)
        self.display.text(f"AURA-{DEVICE_CODE[-4:]}", 0, 54)
        self.display.show()

    def display_sensor_values(self, temp, hum, sound, state, measurement):
        """Muestra los valores de los sensores y el estado en la pantalla"""
        self.display.fill(0)
        self.display.text(f"T:{temp}C  H:{hum}%", 0, 0)
        self.display.text(f"Sound: {sound:.2f}", 0, 10)
        self.display.text(f"Estado:", 0, 25)
        self.display.text(f"> {state}", 20, 35)
        self.display.text(f"Valor: {measurement:.2f}", 0, 45)
        self.display.text(f"AURA-{DEVICE_CODE[-4:]}", 0, 54)
        self.display.show()

    async def main_loop(self):
        """Bucle principal del dispositivo"""
        # Conectar WiFi
        if not self.connect_wifi():
            for _ in range(10):  # Si no hay WiFi, intentamos cada 10s
                self.led.toggle()
                await asyncio.sleep(1)
            # Intentamos reiniciar
            import machine
            machine.reset()
            
        # Intentar obtener configuración
        self.get_config()
        
        # Determinar intervalo de muestreo (default o del servidor)
        interval = self.config.get('samplingInterval', UPDATE_INTERVAL) if self.config else UPDATE_INTERVAL
        
        # Bucle principal
        while True:
            # 1. Leer sensores
            temp, hum, sound_level = self.read_sensors()
            
            # 2. Determinar estado
            room_state, measurement = self.determine_state(temp, hum, sound_level)
            
            # 3. Mostrar información en pantalla
            self.display_sensor_values(
                temp if temp is not None else "N/A",
                hum if hum is not None else "N/A",
                sound_level if sound_level is not None else 0,
                room_state,
                measurement
            )
            
            # 4. Enviar datos al servidor
            self.send_measurement(room_state, measurement)
            
            # 5. Esperar hasta la próxima medición
            for _ in range(interval):
                self.led.toggle()  # Parpadeo durante espera
                await asyncio.sleep(1)
                # Liberar memoria cada 10 segundos
                if _ % 10 == 0:
                    gc.collect()

# ------------------------------------------------------------------------
# Punto de entrada principal
# ------------------------------------------------------------------------
def main():
    print("Iniciando dispositivo AURA...")
    aura = AuraDevice()
    try:
        asyncio.run(aura.main_loop())
    except KeyboardInterrupt:
        print("Programa interrumpido por el usuario")
    except Exception as e:
        print(f"Error fatal: {e}")
        aura.display_message(f"Error fatal:\n{str(e)}")
        time.sleep(10)  # Mostrar error por 10 segundos
    finally:
        # Reiniciar en caso de error fatal
        import machine
        machine.reset()

# Ejecutar programa principal
if __name__ == "__main__":
    main()