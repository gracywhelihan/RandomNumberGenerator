/*
   MQTT Node.js client. 
   Connects to shiftr.io broker, reads a given topic. Serves an HTML page with JavaScript that also acts as an MQTT client.
   Uses a LCG function and the raw sensor values as the seed number
*/

const mqtt = require("mqtt");
const express = require("express");

const server = express(); // create a server using express
server.use("/", express.static("public")); // serve static files from /public
server.listen(process.env.PORT || 8080); // start the server

// initiate the empty seed number array
let seedString = "";
let seedLength = -1;
let makeSeed = false;

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
  username: "", // username of the broker
  password: "", // password for the broker
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

    // random number generation:
    if (!makeSeed) {
      seedLength = Math.round(new Date().getMilliseconds() / 100);
      makeSeed = true;
    }

    if (makeSeed && seedString.length < seedLength) {
      for (let propName in data) {
        if (data.hasOwnProperty(propName) && propName !== "id") {
          let propValue = data[propName];
          seedString += propValue;
        }
      }
    } else if (makeSeed && seedString.length >= seedLength) {
      console.log(seedString);
      // remove all non-digit characters
      let seedNumString = seedString.replace(/[^0-9]/g, "");
      // remove leading zeros
      seedNumString = seedNumString.replace(/^0+(?=\d)/, "");
      // console.log(seedNumString);
      let rn = randomAlgorithm(seedNumString);
      let payload = JSON.stringify({
        randomNumber: rn
      });
      client.publish(publishTopic, payload);
      randomNums.push(rn);
      seedString = "";
      makeSeed = false;
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

// random number generator function
function randomAlgorithm(seed) {
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);
  let currentSeed = seed;
  currentSeed = (a * currentSeed + c) % m;
  let scaledSeed = currentSeed * Math.PI * 2;
  randomNumber = scaledSeed - Math.floor(scaledSeed);
  return randomNumber;
}

