const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // Serve static files from "public" directory

// Initialize vote counts
let votes = { A: 0, B: 0 };

// WebSocket connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Emit current vote counts when a new client connects
  socket.emit("updateVotes", votes);

  // Toggle voting (the same as before)
  socket.on("toggleVoting", (data) => {
    console.log(`Voting toggle requested: ${data.enabled}`);
    io.emit("toggleVoting", data); // Notify all clients to toggle voting
  });

  // Listen for updates to the answers
  socket.on("updateAnswers", (answers) => {
    console.log("Updating answers:", answers);

    // Broadcast the new answers to all connected clients
    io.emit("updateAnswers", answers);
  });

  // Handle voting events
  socket.on("vote", (choice) => {
    if (choice === "A") {
      votes.A += 1; // Increment vote for A
    } else if (choice === "B") {
      votes.B += 1; // Increment vote for B
    }

    // Emit the updated vote counts to all clients
    io.emit("updateVotes", votes);
  });

  // Listen for a resetVotes event to reset the vote counts
  socket.on("resetVotes", () => {
    // Reset vote counts to 0
    votes = { A: 0, B: 0 };

    // Emit the reset vote counts to all clients
    io.emit("updateVotes", votes);
    console.log("Votes have been reset to 0");
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
