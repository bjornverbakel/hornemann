document.addEventListener("DOMContentLoaded", () => {
  const socket = io(); // Connect to the WebSocket server

  const waitScreen = document.getElementById("waitScreen");
  const leaveRoomBtn = document.getElementById("leaveRoomBtn");
  const btnScreen = document.querySelector(".btn-container");
  const header = document.querySelector("header");
  const errorMessage = document.getElementById("errorMessage"); // Add an element to display error messages
  const roomIdInputs = document.querySelectorAll("#roomIdInput input");
  const startScreen = document.getElementById("startScreen");
  const submitButton = document.getElementById("submit");
  const roomIdDisplay = document.getElementById("roomId");

  // Function to get URL parameters
  function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  // Automatically fill in the room ID
  const roomId = getUrlParameter('roomId');

  if (roomId && roomIdInputs.length === 5) {
    roomId.split('').forEach((char, index) => {
      roomIdInputs[index].value = char;
    });
  }

  // Listen for voting toggle events
  socket.on("toggleVoting", (data) => {
    console.log(`Voting ${data.enabled ? "enabled" : "disabled"}`);
    if (data.enabled) {
      waitScreen.classList.remove("visible"); // Enable voting
      btnScreen.classList.add("visible")
    } else {
      waitScreen.classList.add("visible"); // Disable voting
      btnScreen.classList.remove("visible")
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

  // Room code input ----------------------------------------------------------
  roomIdInputs.forEach((input, index) => {
    input.setAttribute("maxlength", 1); // Limit input to a single character
    input.addEventListener("input", (e) => {
      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // only allow uppercase letters and numbers
      e.target.value = value;

      if (value.length === 1 && index < roomIdInputs.length - 1) {
        roomIdInputs[index + 1].focus();
      }
    });

    // Handle navigation with arrow keys and backspace on room code input
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && e.target.value.length === 0 && index > 0) {
        roomIdInputs[index - 1].focus();
        setTimeout(() => roomIdInputs[index - 1].setSelectionRange(roomIdInputs[index - 1].value.length, roomIdInputs[index - 1].value.length), 0);
      } else if (e.key === "ArrowLeft" && index > 0) {
        roomIdInputs[index - 1].focus();
        setTimeout(() => roomIdInputs[index - 1].setSelectionRange(roomIdInputs[index - 1].value.length, roomIdInputs[index - 1].value.length), 0);
      } else if (e.key === "ArrowRight" && index < roomIdInputs.length - 1) {
        roomIdInputs[index + 1].focus();
        setTimeout(() => roomIdInputs[index + 1].setSelectionRange(roomIdInputs[index + 1].value.length, roomIdInputs[index + 1].value.length), 0);
      }
    });

    // Add paste event to the first input
    if (index === 0) {
      input.addEventListener("paste", (e) => {
        const pasteData = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (pasteData.length > 0) {
          for (let i = 0; i < roomIdInputs.length; i++) {
            roomIdInputs[i].value = pasteData[i] || "";
          }
          // Focus the last filled input or the next available input
          const nextIndex = Math.min(pasteData.length, roomIdInputs.length - 1);
          roomIdInputs[nextIndex].focus();
        }
        e.preventDefault(); // Prevent default paste behavior
      });
    }
  });

  // Join room button
  submitButton.addEventListener("click", () => {
    const roomId = Array.from(roomIdInputs).map(input => input.value).join("");
    if (roomId) {
      socket.emit("joinRoom", roomId, (response) => { // Use a callback to handle the server's response
        if (response.success) {
          // If the room exists, change the screens
          startScreen.classList.remove("visible");
          waitScreen.classList.add("visible");
          header.classList.add("visible");
          roomIdDisplay.textContent = roomId;
        } else {
          // If the room does not exist, show an error message
          errorMessage.textContent = response.message || "Room does not exist.";
          errorMessage.classList.add("visible");
          roomIdInputs.forEach(input => input.value = ""); // Clear room ID inputs
        }
      });
    }
  });

  // Leave room button
  leaveRoomBtn.addEventListener("click", () => {
    const roomId = roomIdDisplay.textContent;
    if (roomId) {
      socket.emit("leaveRoom", roomId);
      startScreen.classList.add("visible");
      waitScreen.classList.remove("visible");
      header.classList.remove("visible");
      btnScreen.classList.remove("visible");
      roomIdDisplay.textContent = "";
      roomIdInputs.forEach(input => input.value = ""); // Clear room ID inputs
    }
  });

});