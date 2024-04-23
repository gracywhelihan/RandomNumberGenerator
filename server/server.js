
// include the MQTT library, fetch library, and express library:
const mqtt = require("mqtt");
const express = require("express");

const server = express(); // create a server using express
server.use("/", express.static("public")); // serve static files from /public
server.listen(process.env.PORT || 8080); // start the server

const fs = require("fs"); // include fs library



// initiate the empty seed number array
let seedString = "";
let seedLength = -1;
let makeSeed = false;

//create formatted string for writing data to a file
let randomNums = [];
const numbersPerLine = 14;

// global variable for the random number
let randomNumber;




//////// shiftr.io, requires username and password
// (see options variable below):
const broker = "wss://randomnumbergenerator.cloud.shiftr.io";


// connection options:
let options = {
  // Clean session
  clean: true,
  // connect timeout in ms:
  connectTimeout: 10000,
  // Authentication
  clientId: "nodeClient",
  // add these in for public.cloud.shiftr.io:
  username: "randomnumbergenerator",
  password: "UKspKVF8tgbjf7uA",
};

// topic and message payload:
let topic = "incomingSensorData";
// let subscribeTopic = "incomingSensorData";
let publishTopic = "randomNumber";

// whether the client should be publishing or not:
let publishing = true;

// make a client and connect:
const client = mqtt.connect(broker, options);
client.on("connect", setupClient);

// connect handler:
function setupClient() {
  console.log("connected to broker");
  // read all the subtopics:
  client.subscribe(topic);

  // set a handler for when new messages arrive:
  client.on("message", readMqttMessage);
}

// new message handler:
function readMqttMessage(topic, message) {
  // message is a Buffer, so convert to a string:
  let dataString = message.toString();

  let data;
  try {
    data = JSON.parse(dataString);
    console.log(data);
    // random number generation:
    // make the seed array for the algorithm
    if (!makeSeed) {
      // get the length of the seed array by getting the current milliseconds and dividing it by 100
      seedLength = Math.round(new Date().getMilliseconds() / 100); // Can change this if needed --> right now it is making the seed length be between 1-10 but this mean 1 - 10 messages of data, not actual length of the number
      // set make seed to true
      makeSeed = true;
    }

    // json parse the payload
    //let data = JSON.parse(payload.toString());

    // add the data to the make seed array
    if (makeSeed && seedString.length < seedLength) {
      // get the values from the key value pairs from the messages
      for (let propName in data) {
        if (data.hasOwnProperty(propName)) {
          let propValue = data[propName];
          // do something with each element here
          seedString += propValue;
        }
      }
    } else if (makeSeed && seedString.length >= seedLength) {
      // once the seedArray is 'full' call the ranomdom number generator algorithm, clear the seedArray and set makeSeed back to false
      // remove decimal points and commas from numbers
      let seedNumString = seedString.replace(/\./g, "").replace(/,/g, "");

      // call random number algoithm function
      let rn = randomAlgorithm(seedNumString);

      // publish the random number to the broker
      client.publish(publishTopic, rn.toString());

      // reset seed sting
      // set the seed string back to an empty string
      seedString = "";
      // set makeSeed back to false
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
    // Set CORS headers to allow cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  // Send the random number as JSON response
  res.json({ randomNumber: randomNumber });
  console.log("GET: "+ randomNumber);
  
});



// random number generator function
function randomAlgorithm(seed) {
  // Constants for generating random numbers
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);

  // Initialize the seed
  let currentSeed = seed;

  // Generate a pseudo-random number using Math.PI
  // function randoNumber() {
  currentSeed = (a * currentSeed + c) % m;
  // Incorporate Math.PI for additional randomness
  let scaledSeed = currentSeed * Math.PI * 2;
  randomNumber = scaledSeed - Math.floor(scaledSeed); // Normalize to [0, 1]
  //console.log(randomNumber);
  return randomNumber;
}
