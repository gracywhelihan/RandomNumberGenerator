/*
  Node.js client. 
 Serves an HTML page with JavaScript that acts as an MQTT client.
  
*/

const express = require("express");

const server = express(); // create a server using express
server.use("/", express.static("public")); // serve static files from /public
server.listen(process.env.PORT || 8080); // start the server

