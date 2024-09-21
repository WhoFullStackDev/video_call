require("dotenv").config();
const express = require("express");
const { ExpressPeerServer } = require("peer");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const { Server } = require("socket.io");
const route = require("express").Router();
const serverless = require("serverless-http");

const app = express();
const server = http.createServer(app); // Properly create HTTP server
const io = new Server(server); // Attach socket.io to the server
const port = process.env.PORT || 4000;

// PeerJS setup with debugging
const peer = ExpressPeerServer(server, {
  debug: true,
});

// Middleware for PeerJS
app.use("/peerjs", peer);

// Setting EJS as the view engine
app.set("view engine", "ejs");

// Serving static files from the 'public' directory
app.use(express.static("public"));

app.use("/.netlify/functions/app", router);

// Generate a new room ID and redirect the user to that room
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

// Rendering the room view when a user joins a specific room
app.get("/:room", (req, res) => {
  res.render("index", { RoomId: req.params.room });
});

// Handle Socket.io connections
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("newUser", (id, room) => {
    socket.join(room);
    socket.to(room).emit("userJoined", id); // Notify others in the room

    // Handle user disconnection
    socket.on("disconnect", () => {
      socket.to(room).emit("userDisconnect", id);
    });
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports.handle = serverless(app);
