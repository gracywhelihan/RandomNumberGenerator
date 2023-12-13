/*
  MQTT Client sender
  This sketch demonstrates an MQTT client that connects to a broker, subsrcibes to a topic,
  sends messages to it, reading from a SHT31 Temperature & Humidity sensor.
  This sketch uses https://test.mosquitto.org as the MQTT broker.
  This sketch uses an Arduino Nano 33 IoT.
  
  the arduino_secrets.h file:
  #define SECRET_SSID ""    // wifi network name
  #define SECRET_PASS ""    // wifi network password
  #define SECRET_MQTT_USER "public" // broker username
  #define SECRET_MQTT_PASS "public" // broker password
  created April 2023
  modified from code by Tom Igoe
  by Gracy Whelihan
*/

// inclued wifi and MQTT libraries
#include <WiFiNINA.h>
#include <ArduinoMqttClient.h>

// include Wire Library for I2C communication with sensor
#include <Wire.h>

// include SHT31 Temperature & Humidity sensor library
#include "Adafruit_SHT31.h"
//include secrets.h - has the username a password info for the network and broker
#include "secrets.h"

// initialize the sht31 sensor 
Adafruit_SHT31 sht31 = Adafruit_SHT31();

// initialize SSL WiFi connection:
WiFiSSLClient wifi;
//connects the Wi-Fi client to the MQTT client.
MqttClient mqttClient(wifi);

// details for MQTT client:
// broker name
char broker[] = "test.mosquitto.org";

// choose a port to communicate on
int port = 8886; // for test.mosquitto.org
// choose a topic to subscribe to - topic/subtopic
char topic[] = "randomNumberGenerator/tempHum";
// This should be a unique ID 
String clientID = "GW3869";

// last time the client sent a message, in ms:
long lastTimeSent = 0;
// message sending interval:
// how often data is being sent to the broker
// sending data once a second is fine here
int interval = 1000;


void setup() {
  // initialize serial:
  Serial.begin(9600);
  
  // wait for serial monitor to open:
  if (!Serial) delay(3000);

  // initialize WiFi, if not connected:
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print("Connecting to ");
    Serial.println(SECRET_SSID);
    //connects to local Wi-Fi network using the network name and password in the secrets.h file
    WiFi.begin(SECRET_SSID, SECRET_PASS);
    delay(2000);
  }

  // print IP address once connected:
  Serial.print("Connected. My IP address: ");
  Serial.println(WiFi.localIP());


  // set the credentials for the MQTT client:
    mqttClient.setId(clientID);
  // test.mosquitto.org doesn't require a username and password
  // include if using a another broker
  // login to the broker with a username and password:
  //  mqttClient.setUsernamePassword(SECRET_MQTT_USER, SECRET_MQTT_PASS);

  // try to connect to the MQTT broker once you're connected to WiFi:
  while (!connectToBroker()) {
    Serial.println("attempting to connect to broker");
    delay(1000);
  }

  Serial.println("connected to broker");

  // initialize the SHT31 temperature and humidity sensor sensor
   if (! sht31.begin(SHT31_DEFAULT_ADDR)) {
    Serial.println("Couldn't find SHT31");
    while (1) { delay(1); }       // wait forever
  }
}


void loop() {

  
  // if not connected to the broker, try to connect:
  if (!mqttClient.connected()) {
    Serial.println("reconnecting");
    connectToBroker();
  }

// once every interval, send a message:
  if (millis() - lastTimeSent > interval) {
    // start a new message on the topic:
    mqttClient.beginMessage(topic);
    // get the temperature and humidity readings from the sensor and store them in the variables tt, hh
    float tt = sht31.readTemperature();
    float hh = sht31.readHumidity();

    // store the data object as a sting in the variable body
    String body = "{\"temp\": tt, \"hum\": hh}";
    //replace the tt, hh characters in the sting with the tt, hh values as strings from the sensors
    body.replace("tt", String(tt));
    body.replace("hh", String(hh));

    // prints the content of the message
    mqttClient.println(body);
    // send the message to the broker
    mqttClient.endMessage();
    // update the lastTimeSent
    lastTimeSent = millis();
  }

}

boolean connectToBroker() {
  // if the MQTT client is not connected:
  if (!mqttClient.connect(broker, port)) {
    // print out the error message:
    Serial.print("MOTT connection failed. Error no: ");
    Serial.println(mqttClient.connectError());
    // return that you're not connected:
    return false;
  }
  // once you're connected, you
  // return that you're connected:
  return true;
}
