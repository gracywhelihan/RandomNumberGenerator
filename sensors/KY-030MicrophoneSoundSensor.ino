/*
  This code demonstrates an MQTT arduino client that connects to a broker, subsrcibes to a topic,
  and sends data from a KY-030 Micorphone Sound sensor.
  This code uses https://randomnumbergenerator.cloud.shiftr.io/ as the MQTT broker.
  To get the broker username and password please email vgw3869@nyu.edu
  the arduino_secrets.h file:
  #define SECRET_SSID ""    // network name
  #define SECRET_PASS ""    // network password
  #define SECRET_MQTT_USER "public" // broker username
  #define SECRET_MQTT_PASS "public" // broker password

  created 5 March 2024
  Sourse code modified from code written by Tom Igoe https://github.com/tigoe/mqtt-examples/blob/main/arduino-clients/ArduinoMqttClient/ArduinoMqttClient.ino
*/


// include libraries
#include <WiFiNINA.h>
#include <ArduinoMqttClient.h>
#include <Wire.h>

// include the secrets file with the wifi name and password and the broker name and passwork
#include "secrets.h"


//initialize sound sensor pins
int soundPin = A0;  
int sensorValue = 0;

// initialize WiFi connection:
WiFiSSLClient wifi; // secure wifi client
// WiFiClient wifi; // unsecure wifi client
MqttClient mqttClient(wifi);

// details for MQTT client:
char broker[] = "randomnumbergenerator.cloud.shiftr.io";

//int port = 1883; // unsecure port for shiftr
int port = 8883; // secure port for shiftr
// Always send sensor data through the incomingSensorData topic
char topic[] = "incomingSensorData";
// This part of the client id can be what ever you want
// Later on in set up the last 3 digits of MAC Address are added to insure a unique client ID
String clientID = "KY-030MicSoundSensorClient-";

// last time the client sent a message, in ms:
long lastTimeSent = 0;
// message sending interval:
int interval = 1000;


void setup() {
  // initialize serial:
  Serial.begin(9600);

  // set builtin LED to output
  pinMode(LED_BUILTIN, OUTPUT);
  //turn the built in LED on arduino on 
  digitalWrite(LED_BUILTIN, HIGH);
  
  // wait for serial monitor to open:
  if (!Serial) delay(3000);

  // initialize WiFi, if not connected:
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print("Connecting to ");
    Serial.println(SECRET_SSID);
    WiFi.begin(SECRET_SSID, SECRET_PASS);
    delay(2000);
  }

  // print when connected to wifi
  Serial.println("Connected to wifi.");

  // make the clientID unique by adding the last three digits of the MAC address:
  byte mac[6];
  WiFi.macAddress(mac);
  for (int i = 0; i < 3; i++) {
    clientID += String(mac[i], HEX);
  }
  // set the credentials for the MQTT client:
  mqttClient.setId(clientID);
  // login to the broker with a username and password for randomnumbergenerator.cloud.shiftr.io:
  mqttClient.setUsernamePassword(SECRET_MQTT_USER, SECRET_MQTT_PASS);

  // try to connect to the MQTT broker once you're connected to WiFi:
  while (!connectToBroker()) {
    Serial.println("attempting to connect to broker");
    delay(1000);
  }
  Serial.println("Connected to randomnumbergenerator broker.");

}

void loop() {
  // if not connected to wifi, try again
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_BUILTIN, HIGH); 
    WiFi.begin(SECRET_SSID, SECRET_PASS);
    delay(2000);
  }
  
  // if not connected to the broker, try to connect:
  if (!mqttClient.connected()) {
    digitalWrite(LED_BUILTIN, HIGH); 
    Serial.println("reconnecting");
    connectToBroker();
  }

// once every interval, send a message:
  if (millis() - lastTimeSent > interval) {
    // start a new message on the topic:
    mqttClient.beginMessage(topic);
    // add a random number as a numeric string (print(), not write()):
    float ss = analogRead(soundPin);

    String body = "{\"sound\": ss}";

    body.replace("ss", String(ss));

    mqttClient.println(body);
 
    digitalWrite(LED_BUILTIN, LOW);
    // send the message:
    mqttClient.endMessage();
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
