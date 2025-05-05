/*
   MQTT Node.js client. 
   Connects to shiftr.io broker, reads a given topic. Serves an HTML page with JavaScript that also acts as an MQTT client.
   Uses a SHA-256 hash from the crypto module as an extra level of entropy for the seed number
*/

const mqtt = require("mqtt");
const express = require("express");
const crypto = require("crypto"); // Node.js built-in crypto module for SHA-256

const server = express(); // create a server using express
server.use("/", express.static("public")); // serve static files from /public
server.listen(process.env.PORT || 8080); // start the server

// initiate the empty sensor data array
let sensorDataArray = [];
let collectingData = false;
let dataPointsToCollect = 5; // Number of sensor readings to collect before generating a random number

// store random numbers
let randomNums = [];

// global variable for the random number
let randomNumber;

// MQTT broker
const broker = "wss://randomnumbergenerator.cloud.shiftr.io";

let options = {
  clean: true,
  connectTimeout: 10000,
  clientId: "nodeClient",
  username: "randomnumbergenerator",
  password: "UKspKVF8tgbjf7uA",
};

// topic and message payload
let topic = "incomingSensorData";
let publishTopic = "randomNumber";

// make a client and connect
const client = mqtt.connect(broker, options);
client.on("connect", setupClient);

function setupClient() {
  console.log("connected to broker");
  client.subscribe(topic);
  client.on("message", readMqttMessage);
}

function readMqttMessage(topic, message) {
  let dataString = message.toString();

  let data;
  try {
    data = JSON.parse(dataString);

    // Remove client ID so it's not part of the seed
    delete data.id;
    
    // Add timestamp for additional entropy
    data.timestamp = Date.now();

    // Random number generation process
    if (!collectingData) {
      // Reset collection and start collecting new data points
      sensorDataArray = [];
      collectingData = true;
    }

    if (collectingData && sensorDataArray.length < dataPointsToCollect) {
      sensorDataArray.push(data);
    }
    
    if (collectingData && sensorDataArray.length >= dataPointsToCollect) {
      // We have enough data points, generate the random number
      let rn = generateRandomWithSHA256(sensorDataArray);
      let payload = JSON.stringify({
        randomNumber: rn
      });
      client.publish(publishTopic, payload);
      randomNums.push(rn);
      console.log("Published random number: " + rn);
      
      // Reset for next cycle
      collectingData = false;
      sensorDataArray = [];
    }
  } catch (error) {
    console.log(error);
  }
}

server.get("/random-number", (req, res) => {
  if (!randomNumber) {
    randomNumber = "no data";
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.json({ randomNumber: randomNumber });
  console.log("GET: " + randomNumber);
});

// SHA-256 based random number generator
function generateRandomWithSHA256(sensorDataArray) {
  // Each item in sensorDataArray can have multiple readings
  // For example: [{temp: 22.5, humidity: 65.3}, {temp: 22.6, humidity: 65.1}, ...]
  
  // Convert the sensor data array to a string - all properties are included
  const dataString = JSON.stringify(sensorDataArray);
  
  // Log a sample of what's being hashed
  console.log("Sample of sensor data being hashed:");
  console.log(JSON.stringify(sensorDataArray[0], null, 2)); // Pretty print the first data point
  
  // Create SHA-256 hash of the sensor data
  const hash = crypto.createHash('sha256').update(dataString).digest('hex');
  
  // Use the first 16 characters of the hash (64 bits) to create a seed number
  const seedHex = hash.substring(0, 16);
  const seedNumber = parseInt(seedHex, 16);
  
  // Use the seed to generate a random number between 0 and 1
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);
  
  // Use your existing LCG algorithm with our strong seed
  let currentSeed = seedNumber;
  currentSeed = (a * currentSeed + c) % m;
  
  // Scale to [0,1) range
  randomNumber = currentSeed / m;
  
  console.log("Sensor data hash: " + hash);
  console.log("Seed from hash: " + seedNumber);
  
  return randomNumber;
}
