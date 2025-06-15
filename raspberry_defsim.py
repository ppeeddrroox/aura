"""
main.py – AURA Pico W  (sin tildes)
-----------------------------------
• measurement = XXXYYYZZZ  (T×10 | H×10 | dB×10)  → 9 digitos
• Todos los textos en pantalla y roomState quedan SIN tildes.
"""

# ---------------- IMPORTS ---------------------------------------------
import time, gc, math, struct, uasyncio as asyncio
try:
    import random
except ImportError:
    import urandom as random
import network, urequests
from machine import Pin, I2C, ADC
try:
    from machine import I2S
except ImportError:
    I2S = None
try:
    import dht
except ImportError:
    dht = None
from ssd1306 import SSD1306_I2C

# ---------------- CONFIG ----------------------------------------------
SIMULATE   = True
WIFI_SSID  = "iPhone de Pedro"
WIFI_PASS  = "HolaHoal"
SERVER_URL = "http://172.20.10.3:4000"
DEVICE_CODE = "AURA-ABC001"

UPDATE_INTERVAL             = 10   # s
UNREGISTERED_RETRY_INTERVAL = 1    # s

# Pines
DHT_PIN = 2
MIC_LR_PIN, MIC_SCK_PIN, MIC_WS_PIN, MIC_SD_PIN = 9, 10, 11, 12
ADC_PIN = 26
OLED_SDA_PIN, OLED_SCL_PIN, OLED_ADDR = 0, 1, 0x3C
OLED_W, OLED_H = 128, 64

# ---------------- AUDIO -----------------------------------------------
class AudioSensor:
    def __init__(self, ws,sck,sd,lr=None):
        self.use_i2s = False
        if I2S:
            try:
                if lr is not None:
                    Pin(lr, Pin.OUT).value(1)      # canal Right
                self.i2s = I2S(0, sck=Pin(sck), ws=Pin(ws), sd=Pin(sd),
                               mode=I2S.RX, bits=16, format=I2S.MONO,
                               rate=16000, ibuf=4096)
                self.buf = bytearray(1600*2)
                self.use_i2s = True
            except Exception as e:
                print("I2S init err:", e)
        if not self.use_i2s:
            self.adc = ADC(Pin(ADC_PIN))

    def level_and_db(self):
        if self.use_i2s:
            n = self.i2s.readinto(self.buf)
            if n:
                samp = struct.unpack("<{}h".format(n//2), self.buf[:n])
                rms = math.sqrt(sum(s*s for s in samp)/len(samp))
                lvl = min(1.0, rms/10000)
            else:
                lvl = 0.0
        else:
            vals = [self.adc.read_u16() for _ in range(10)]
            lvl  = sum(vals)/(len(vals)*65535)
        db = 30 + lvl*15
        return lvl, db

# ---------------- DEVICE ----------------------------------------------
class AuraDevice:
    def __init__(self):
        self.i2c  = I2C(0, sda=Pin(OLED_SDA_PIN), scl=Pin(OLED_SCL_PIN),
                        freq=400000)
        self.disp = SSD1306_I2C(OLED_W, OLED_H, self.i2c, addr=OLED_ADDR)
        self.led  = Pin("LED", Pin.OUT)

        self.dht   = None if SIMULATE else dht.DHT11(Pin(DHT_PIN))
        self.audio = AudioSensor(MIC_WS_PIN, MIC_SCK_PIN, MIC_SD_PIN,
                                 MIC_LR_PIN)

        self.wlan       = network.WLAN(network.STA_IF)
        self.connected  = False
        self.registered = False

        # Valores demo iniciales
        self.t, self.h, self.db = 22.35, 42.0, 37.0
        self.last_t = self.last_h = None

        self.msg("AURA\n"+DEVICE_CODE+"\nInit...")

    # -------- OLED helpers --------------------------------------------
    def msg(self, text, show_code=True):
        self.disp.fill(0)
        for i, line in enumerate(text.split("\n")):
            self.disp.text(line, 0, i*10)
        if show_code and not self.registered:
            self.disp.text(DEVICE_CODE, 0, 54)
        self.disp.show()

    def big_code(self):
        self.disp.fill(0)
        half = len(DEVICE_CODE)//2
        self.disp.text(DEVICE_CODE[:half], (OLED_W-half*4)//2, 18)
        self.disp.text(DEVICE_CODE[half:], (OLED_W-half*4)//2, 34)
        self.disp.show()

    # -------- Wi-Fi ----------------------------------------------------
    def wifi(self):
        self.msg("Conectando WiFi...", False)
        self.wlan.active(True)
        self.wlan.connect(WIFI_SSID, WIFI_PASS)
        for _ in range(20):
            if self.wlan.isconnected():
                self.connected = True
                self.msg("WiFi OK\n"+self.wlan.ifconfig()[0], False)
                self.led.on(); return True
            time.sleep(1); self.led.toggle()
        self.msg("Error WiFi", False); return False

    # -------- Lectura de sensores -------------------------------------
    def sensors(self):
        if SIMULATE:
            self.t  = max(22.30, min(22.40, self.t+random.uniform(-0.02,0.02)))
            self.h  = max(39.0,  min(45.0,  self.h+random.uniform(-0.4,0.4)))
            self.db = max(30.0,  min(45.0,  self.db+random.uniform(-1,1)))
            lvl = (self.db-30)/15
            return round(self.t,1), round(self.h,1), round(self.db,1), lvl
        try:
            self.dht.measure()
            t = self.dht.temperature(); h = self.dht.humidity()
            self.last_t, self.last_h = t, h
        except Exception as e:
            print("DHT err:", e); t, h = self.last_t, self.last_h
        lvl, db = self.audio.level_and_db()
        return round(t,1), round(h,1), round(db,1), lvl

    # -------- Estado ---------------------------------------------------
    def state(self, t, h, lvl):
        if t is None or h is None:           return "Calma",        0.5
        if lvl > 0.7:                        return "Estres",       lvl
        if t>27 or t<19 or h>70 or h<30:     return "Incomodidad",  0.8
        if 22<=t<=26 and 40<=h<=60 and lvl<0.2: return "Confort", 1-lvl
        if lvl < 0.1:                        return "Expectativa",  1-lvl
        if 0.3 < lvl < 0.6:                  return "Energia",      lvl
        return "Calma", max(0.1,1-abs(t-23)/8-abs(h-50)/30-lvl)

    # -------- Encode XXXYYYZZZ ----------------------------------------
    @staticmethod
    def encode(t,h,db):
        part = lambda x: f"{int(round(x*10))%1000:03d}"
        return int(part(t)+part(h)+part(db))

    # -------- Envio ----------------------------------------------------
    def send(self, st, val_num):
        if not self.connected:
            print("⇢ sin WiFi"); return "net_err"
        payload = {"code": DEVICE_CODE,
                   "measurement": val_num,
                   "roomState": st}
        print("⇢ POST", SERVER_URL+"/api/devices/data")
        print("  payload:", payload)
        try:
            r = urequests.post(SERVER_URL+"/api/devices/data",
                               json=payload,
                               headers={"Content-Type":"application/json"})
            print("  status:", r.status_code)
            body = {}
            if r.headers.get("Content-Type","").startswith("application/json"):
                body = r.json()
            print("  body:", body)
            status = body.get("status","unknown")
            r.close(); gc.collect()
            return "http_"+str(r.status_code) if r.status_code!=200 else status
        except Exception as e:
            print("  EXC:", e); return "net_err"

    # -------- Mostrar --------------------------------------------------
    def show(self, t, h, db, st, val):
        self.disp.fill(0)
        self.disp.text(f"T:{t}C", 0, 0)
        self.disp.text(f"H:{h}%", 64, 0)
        self.disp.text(f"S:{db}dB", 0, 10)
        self.disp.text("> "+st, 0, 25)
        self.disp.text(f"Val:{val:.2f}", 0, 45)
        self.disp.show()

    # -------- Bucle principal -----------------------------------------
    async def loop(self):
        if not self.wifi():
            await asyncio.sleep(5); import machine; machine.reset()

        # Registro
        while not self.registered:
            self.big_code()
            status = self.send("Calma", 0)
            if status == "ok":
                self.registered = True
                self.msg("Registrado!", False)
                await asyncio.sleep(2)
            elif status == "no_registrado":
                await asyncio.sleep(UNREGISTERED_RETRY_INTERVAL)
            else:
                self.msg(f"ERR {status}", True)
                await asyncio.sleep(2)

        # Operacion normal
        while True:
            t,h,db,lvl = self.sensors()
            st,val     = self.state(t,h,lvl)
            encoded    = self.encode(t,h,db)
            self.show(t,h,db,st,val)
            status     = self.send(st, encoded)
            if status not in ("ok","no_registrado"):
                self.msg(f"ERR {status}", False)
            for _ in range(UPDATE_INTERVAL):
                self.led.toggle(); await asyncio.sleep(1)
                if _%10 == 0: gc.collect()

# ---------------- MAIN -------------------------------------------------
def main():
    dev = AuraDevice()
    try:
        asyncio.run(dev.loop())
    except KeyboardInterrupt:
        pass
    finally:
        import machine; machine.reset()

if __name__ == "__main__":
    main()
