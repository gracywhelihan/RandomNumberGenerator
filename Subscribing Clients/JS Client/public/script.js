/*
  mqtt.js client

  On document load, this script gets two divs from the HTML
  for local and remote messages. 
  
*/

//////// shiftr.io, requires username and password
// (see options variable below):
const broker = "wss://randomnumbergenerator.cloud.shiftr.io:443";


// MQTT client:
let client;

// connection options:
let options = {
  // Clean session
  clean: true,
  // connect timeout in ms:
  connectTimeout: 10000,
  // Authentication
  // add a random number for a unique client ID:
  clientId: "getRandomNumber",

  // add these in the username and password for randomnumbergenerator.cloud.shiftr.io
  username: "username",
  password: "password",
};
// topic to subscribe to when you connect:
let subscribeTopic = "randomNumber";


// divs to show messages:
let localDiv, remoteDiv, numberDiv;



function setup() {
  // put the divs in variables for ease of use:
  localDiv = document.getElementById("local");
  remoteDiv = document.getElementById("remote");
  numberDiv = document.getElementById("number");

  // set text of localDiv:
  localDiv.innerHTML = "trying to connect";
  // attempt to connect:
  client = mqtt.connect(broker, options);
  // set listeners:
  client.on("connect", onConnect);
  client.on("close", onDisconnect);
  client.on("message", onMessage);
  client.on("error", onError);
  console.log("setup hi");
}


// handler for mqtt connect event:
function onConnect() {
  console.log("im connected");
  // update localDiv text:
  localDiv.innerHTML = "connected to broker. Subscribing...";
  // subscribe to the topic:
  client.subscribe(subscribeTopic, onSubscribe);
}

// handler for mqtt disconnect event:
function onDisconnect() {
  // update localDiv text:
  localDiv.innerHTML = "disconnected from broker.";
}

// handler for mqtt error event:
function onError(error) {
  console.log(error);
  // update localDiv text:
  localDiv.innerHTML = error;
}

// handler for mqtt subscribe event:
function onSubscribe(response, error) {
  if (!error) {
    // update localDiv text:
    localDiv.innerHTML = "subscribed to broker.";
  } else {
    // update localDiv text with the error:
    // this line of code is not working correctly
    // localDiv.innerHTML = error;
    localDiv.innerHTML = "subscribed to broker.";
    console.log(error);
  }
}

// handler for mqtt message received event:
function onMessage(topic, payload, packet) {
  let result = "received a message on topic:  " + topic;
  // message is  a Buffer, so convert to a string:
  let randomNumber = payload.toString();
  // The random number is a number between 0 and 1 as a string.
  // To format the number, do so here. For example to get a number between 0 and 9:
  // randomNumber = Math.floor(Number(randomNumber)*10);
  
  
  // update the remote div text:
  remoteDiv.innerHTML = result;
  numberDiv.innerHTML = randomNumber;
}


// on page load, call the setup function:
document.addEventListener("DOMContentLoaded", setup);
