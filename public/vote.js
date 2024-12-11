document.addEventListener("DOMContentLoaded", () => {
  const socket = io(); // Connect to the WebSocket server

  const waitScreen = document.getElementById("waitScreen");

  // Listen for voting toggle events
  socket.on("toggleVoting", (data) => {
    console.log(`Voting ${data.enabled ? "enabled" : "disabled"}`);
    if (data.enabled) {
      waitScreen.classList.remove("visible"); // Enable voting
    } else {
      waitScreen.classList.add("visible"); // Disable voting
      voteA.classList.remove("fade");
      voteB.classList.remove("fade");
      console.log("fade removed");
      voteA.classList.remove("expand");
      voteB.classList.remove("expand");
      console.log("expand removed");
    }
  });

  // Voting button interactions
  const voteA = document.getElementById("voteA");
  const voteB = document.getElementById("voteB");

  socket.on("updateAnswers", (answers) => {
    if (voteA && voteB) {
      voteA.textContent = answers[0]; // Set text for Option A
      voteB.textContent = answers[1]; // Set text for Option B
    }
  });

  voteA.addEventListener("click", () => {
    if (!voteA.classList.contains("expand")) {
      handleVote(voteA, voteB);
      socket.emit("vote", "A"); // Emit vote for A
    }
  });

  voteB.addEventListener("click", () => {
    if (!voteA.classList.contains("expand")) {
      handleVote(voteB, voteA);
      socket.emit("vote", "B"); // Emit vote for B
    }
  });

  function handleVote(clickedButton, otherButton) {
    clickedButton.classList.add("expand");
    otherButton.classList.add("fade");
  }
});
