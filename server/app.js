const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // Serve static files from "public" directory

// Initialize vote counts
let votes = {};

// Initialize user count
let connectedUsers = {};

// WebSocket connection
io.on("connection", (socket) => {
  const role = socket.handshake.query.role;
  let currentRoomId = null;

  // Handle room joining
  socket.on("joinRoom", (roomId, callback) => {
    if (!votes[roomId] && role !== "admin") { // Check if the room exists
      console.log(`Room ${roomId} does not exist.`);
      if (typeof callback === "function") {
        callback({ success: false, message: "Game ID bestaat niet" }); // Send error response
      }
      return; // Stop further execution
    }

    socket.join(roomId);
    currentRoomId = roomId;

    if (!votes[roomId]) {
      votes[roomId] = { A: 0, B: 0 };
      connectedUsers[roomId] = 0;
    }

    if (role !== "admin") {
      connectedUsers[roomId]++;
    }

    console.log(`A user joined room ${roomId}. Connected users: ${connectedUsers[roomId]}`);
    io.to(roomId).emit("updateUserCount", connectedUsers[roomId]); // Broadcast to all clients in the room

    // Emit current vote counts when a new client connects
    socket.emit("updateVotes", votes[roomId]);

    // Send success response
    if (typeof callback === "function") {
      callback({ success: true });
    }

    // Respond to 'requestUserCount' with the current count
    socket.on("requestUserCount", () => {
      socket.emit("updateUserCount", connectedUsers[roomId]); // Send count to the requesting client
    });

    // Toggle voting
    socket.on("toggleVoting", (data) => {
      console.log(`Voting toggle requested in room ${roomId}: ${data.enabled}`);
      io.to(roomId).emit("toggleVoting", data); // Notify all clients in the room to toggle voting
    });

    // Listen for updates to the answers
    socket.on("updateAnswers", (answers) => {
      console.log(`Updating answers in room ${roomId}:`, answers);
      io.to(roomId).emit("updateAnswers", answers); // Broadcast the new answers to all connected clients in the room
    });

    // Handle voting events
    socket.on("vote", (choice) => {
      if (choice === "A") {
        votes[roomId].A += 1; // Increment vote for A
      } else if (choice === "B") {
        votes[roomId].B += 1; // Increment vote for B
      }
      io.to(roomId).emit("updateVotes", votes[roomId]); // Emit the updated vote counts to all clients in the room
    });

    // Listen for a resetVotes event to reset the vote counts
    socket.on("resetVotes", () => {
      votes[roomId] = { A: 0, B: 0 }; // Reset vote counts to 0
      io.to(roomId).emit("updateVotes", votes[roomId]); // Emit the reset vote counts to all clients in the room
      console.log(`Votes have been reset to 0 in room ${roomId}`);
    });

    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      if (connectedUsers[roomId] > 0) {
        connectedUsers[roomId]--;
      }
      console.log(`A user left room ${roomId}. Connected users: ${connectedUsers[roomId]}`);
      io.to(roomId).emit("updateUserCount", connectedUsers[roomId]); // Broadcast to all clients in the room
      currentRoomId = null;
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      if (currentRoomId && connectedUsers[currentRoomId] > 0) {
        connectedUsers[currentRoomId]--;
        console.log(`A user disconnected from room ${currentRoomId}. Connected users: ${connectedUsers[currentRoomId]}`);
        io.to(currentRoomId).emit("updateUserCount", connectedUsers[currentRoomId]); // Broadcast to all clients in the room
      }
    });
  });
});

// Start the server
server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});