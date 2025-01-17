document.addEventListener("DOMContentLoaded", () => {
  const socket = io({ query: { role: "admin" } });
  const generateRoomBtn = document.getElementById("generateRoomBtn");
  const roomIdElements = document.querySelectorAll(".roomId");
  const qrCodeElement = document.getElementById("qrcode");

  const url = "https://hornemann-production.up.railway.app/"

  // Function to generate a unique room ID
  function generateRoomId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let roomId = "";
    for (let i = 0; i < 5; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    roomIdElements.forEach((element) => {
      element.textContent = roomId;
    });
    socket.emit("joinRoom", roomId); // Join the room

    // Generate QR code
    const QrUrl = url + roomId;
    qrCodeElement.innerHTML = ""; // Clear previous QR code
    new QRCode(qrCodeElement, QrUrl);
  }

  generateRoomId();

  // Generate Room ID and display it
  generateRoomBtn.addEventListener("click", () => {
    generateRoomId();
  });

  socket.emit("resetVotes");
  socket.emit("toggleVoting", { enabled: false }); // Disable voting
  socket.emit("requestUserCount"); // Fetch user count when the page is loaded

  // DOM Elements
  const startBtn = document.getElementById("startBtn");
  const startScreen = document.getElementById("startScreen");

  const videoPlayer = document.getElementById("videoPlayer");
  const overlay = document.getElementById("overlay");
  const question = document.querySelector(".question");
  const timerWrapper = document.querySelector(".timer-wrapper");

  const progressBar = document.getElementById("progressBar");
  const progress = document.getElementById("progress");
  const pauseBtn = document.querySelector(".fa-pause").parentNode;
  const skipBtn = document.querySelector(".fa-forward").parentNode;
  const repeatBtn = document.querySelector(".fa-repeat").parentNode;

  const resultsContainer = document.getElementById("resultsContainer");

  // Global Variables
  const questionDuration = 10;
  let countdownIntervalId; // Track the countdown interval globally

  // Events listeners and stuff --------------------------------------------------------

  // Starts the video and hide the start screen
  startBtn.addEventListener("click", () => {
    startScreen.classList.remove("visible");
    // Start the first video (assuming the first video is '1.mov')
    currentPath = ""; // Reset the path to ensure the first video is loaded correctly
    choiceCount = 0; // Reset the choice count

    socket.emit("resetVotes"); // Reset voting

    // Call nextVideo to set the first video and question
    nextVideo(0, 0); // Initial call with dummy percentages
    videoPlayer.play();
  });

  // Update the upper progress bar as the video plays
  videoPlayer.addEventListener("timeupdate", () => {
    progress.style.width = `${
      (videoPlayer.currentTime / videoPlayer.duration) * 100
    }%`;
  });

  // Show question overlay and start countdown after video ends
  videoPlayer.addEventListener("ended", () => {
    const videoSrc = videoPlayer.src; // Get the full video source URL
    const videoFile = videoSrc.split("/").pop(); // Extract the filename (e.g., "1.mov")

    const questionData = videoQuestionMap[videoFile] || {};

    if (questionData.isEnding) {
      // If the current video is an ending video, show the ending screen
      setTimeout(() => {
        showEndingScreen();
      }, 1000);
    } else {
      // Otherwise, show the question overlay
      showQuestion();
    }
  });

  // Toggle play/pause
  pauseBtn.addEventListener("click", () => {
    if (overlay.classList.contains("visible")) return; // Prevent action when overlay is visible

    const isPaused = videoPlayer.paused;
    videoPlayer[isPaused ? "play" : "pause"]();
    pauseBtn.innerHTML = `<i class="fa-solid fa-${
      isPaused ? "pause" : "play"
    } fa-xl"></i>`; // Toggle icon
  });

  // Skip to the end of the video
  skipBtn.addEventListener("click", () => {
    if (overlay.classList.contains("visible")) return; // Prevent action when overlay is visible

    videoPlayer.currentTime = videoPlayer.duration;
    videoPlayer.play(); // Ensure video still properly reaches its true end if paused
  });

  // Replay the video and reset progress and countdown
  repeatBtn.addEventListener("click", () => {
    videoPlayer.currentTime = 0; // Reset video to start
    videoPlayer.play(); // Start playing
    pauseBtn.innerHTML = '<i class="fa-solid fa-pause fa-xl"></i>'; // Set icon to "pause"

    if (overlay.classList.contains("visible")) toggleOverlay();

    // Remove the `animateQuestion` class explicitly
    question.classList.remove("animateQuestion");
    void question.offsetWidth; // Trigger reflow to reset animations

    // Ensure the timer and other states are reset
    timerWrapper.classList.remove("visible"); // Restart timer animation
    resetCountdownProgress(); // Reset countdown
    noTransition(); // Remove transitions for a clean restart
    socket.emit("toggleVoting", { enabled: false }); // Disable voting
  });

  document.getElementById("restartBtn").addEventListener("click", () => {
    const endingScreen = document.getElementById("endingScreen");
    const startScreen = document.getElementById("startScreen");

    endingScreen.classList.remove("visible");
    startScreen.classList.remove("visible");
    currentPath = ""; // Reset the story path
    choiceCount = 0; // Reset choice counter
    videoPlayer.src = "assets/vid/1.mov"; // Reset to the first video
    socket.emit("resetVotes"); // Reset voting

    // Call nextVideo to set the first video and question
    nextVideo(0, 0); // Initial call with dummy percentages
    videoPlayer.play();
  });

  socket.on("updateUserCount", (userCount) => {
    // console.log(`Connected users: ${userCount}`);
    // Update all elements with the class "userCount"
    document.querySelectorAll(".userCount").forEach((element) => {
      element.innerText = userCount;
    });
  });

  socket.emit("requestUserCount"); // Ensure count is up to date when the page is loaded

  // Playing the correct video/question sequence ---------------------------------------

  // Display the correct question
  function showQuestion() {
    toggleOverlay(); // Show overlay
    question.classList.add("animateQuestion"); // Trigger the animation
    question.addEventListener("animationend", () => {
      document.querySelector(".inform").classList.add("visible");
    });
  }

  function showResults() {
    document.querySelector(".inform").classList.remove("visible");
    resultsContainer.classList.add("visible");
    // ...existing code...

    // Find all elements with result values
    const resultElements = resultsContainer.querySelectorAll(".result-value");

    // Extract target values for the results
    const resultA = document.getElementById("countA");
    const resultB = document.getElementById("countB");

    let targetA = parseInt(resultA.dataset.target, 10);
    let targetB = parseInt(resultB.dataset.target, 10);

    // Handle 0 votes case by assigning 100% to a random winner and 0% to the loser
    if (targetA === 0 && targetB === 0) {
      if (Math.random() < 0.5) {
        targetA = 100;
        targetB = 0;
      } else {
        targetA = 0;
        targetB = 100;
      }
    }
    // Handle 50/50 case by assigning 51% to a random winner and 49% to the loser
    if (targetA === targetB) {
      if (Math.random() < 0.5) {
        targetA = 51;
        targetB = 49;
      } else {
        targetA = 49;
        targetB = 51;
      }
    }

    // Use setTimeout to ensure the count animation has finished
    setTimeout(() => {
      // Animate the count for both result elements
      countUp(resultA, targetA);
      countUp(resultB, targetB);

      // Add classes after the animation finishes (delay by animation duration)
      setTimeout(() => {
        // Compare the two percentages and add appropriate classes
        if (targetA > targetB) {
          resultB.parentNode.classList.add("fade");
        } else if (targetB > targetA) {
          resultA.parentNode.classList.add("fade");
        }

        // Proceed to the next video after a short delay
        setTimeout(() => {
          nextVideo(targetA, targetB);

          resultB.parentNode.classList.remove("fade");
          resultB.style.transform = "scale(0.6)";
          resultA.parentNode.classList.remove("fade");
          resultA.style.transform = "scale(0.6)";
        }, 4000); // Delay to allow the results to be visible
      }, countUpDuration);
    }, 1000); // Add a slight delay before starting the count animation
  }

  function showEndingScreen() {
    const endingScreen = document.getElementById("endingScreen");
    const startScreen = document.getElementById("startScreen");

    endingScreen.classList.add("visible");
    startScreen.classList.remove("visible"); // Ensure the start screen is hidden
  }

  // Socket.io ------------------------------------------------------------------------------------
  socket.on("updateVotes", (votes) => {
    // Ensure totalVotes is not zero to avoid division by zero
    const totalVotes = votes.A + votes.B || 1;

    // Calculate percentages
    const calculatePercentage = (count, total) =>
      Math.round((count / total) * 100);

    const percentageA = calculatePercentage(votes.A, totalVotes);
    const percentageB = calculatePercentage(votes.B, totalVotes);

    // Function to update DOM elements
    const updatePercentageAttribute = (elementId, percentage) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.setAttribute("data-target", percentage);
      }
    };

    // Update DOM for both A and B
    updatePercentageAttribute("countA", percentageA);
    updatePercentageAttribute("countB", percentageB);

    // Save percentages globally if needed
    window.percentageA = percentageA;
    window.percentageB = percentageB;
  });

  // Functions for the countdowns and progress bar logic ------------------------------------------
  const progressRing = document.querySelector(".progress-ring__circle");
  const timer = document.getElementById("timer");
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  function startCountdown(totalTime) {
    // Clear any existing countdown interval
    if (countdownIntervalId) clearInterval(countdownIntervalId);

    // Initialize progress
    progressRing.style.strokeDasharray = circumference;
    progressRing.style.strokeDashoffset = circumference;
    progress.style.width = "100%";

    // Animate the ring to fill completely first
    progressRing.style.transition = "stroke-dashoffset 3s ease";
    progressRing.style.strokeDashoffset = 0;

    // Wait for the ring fill animation to finish
    progressRing.addEventListener(
      "transitionend",
      () => {
        progressRing.style.transition = ""; // Reset the transition for subsequent animations

        let remainingTime = totalTime;
        timer.textContent = remainingTime;

        // Start countdown logic
        socket.emit("toggleVoting", { enabled: true }); // Enable voting
        countdownIntervalId = setInterval(() => {
          remainingTime -= 1;

          const offset =
            circumference - (remainingTime / totalTime) * circumference;
          progressRing.style.strokeDashoffset = offset;
          timer.textContent = remainingTime;
          progress.style.width = `${(remainingTime / totalTime) * 100}%`;

          if (remainingTime <= 0) {
            clearInterval(countdownIntervalId);
            timer.textContent = "0";
            progressRing.style.strokeDashoffset = circumference;

            setTimeout(() => {
              socket.emit("toggleVoting", { enabled: false }); // Disable voting
              timerWrapper.classList.remove("visible");
              showResults();
            }, 2000);
          }
        }, 1000);
      },
      { once: true }
    );
  }

  // Reset countdown progress to prevent conflicts after replays or skips
  function resetCountdownProgress() {
    progressRing.style.strokeDashoffset = circumference;
    if (timer) timer.textContent = questionDuration;
    if (countdownIntervalId) clearInterval(countdownIntervalId);
  }

  // Animation keyframe pain -------------------------------------------------------------

  // Removes the transition on certain elements for instant changes to prevent overlap
  function noTransition() {
    const elements = [overlay, timerWrapper, progress, resultsContainer];

    elements.forEach((el) => el.classList.add("noTransition"));
    question.classList.remove("animateQuestion");

    setTimeout(() => {
      elements.forEach((el) => el.classList.remove("noTransition"));
    }, 100);
  }

  // Timer animation should play after that of the question
  question.addEventListener("animationend", () => {
    timerWrapper.classList.add("visible");
    timer.textContent = questionDuration;
    startCountdown(questionDuration);
  });

  let isToggling = false;

  function toggleOverlay() {
    if (isToggling) return; // Skip if already toggling
    isToggling = true;

    if (overlay.classList.contains("visible")) {
      overlay.classList.remove("visible");
      resultsContainer.classList.remove("visible");
    } else {
      overlay.classList.add("visible");
    }

    // Allow toggling again after a brief delay
    setTimeout(() => (isToggling = false), 100);
  }

  const countUpDuration = 5000;
  function countUp(element, targetValue, duration = countUpDuration) {
    const startValue = 0;
    const startTime = performance.now(); // Record the start time

    function easeInQuad(t) {
      return t * t; // Ease-in function
    }

    function scaleBasedOnValue(value) {
      // Scale linearly between min 1and max based on the value
      const minScale = 0.6;
      const maxScale = 1;
      const scale = minScale + ((maxScale - minScale) * value) / 100;
      return scale;
    }

    function step(currentTime) {
      const elapsedTime = currentTime - startTime; // Calculate elapsed time
      const progress = Math.min(elapsedTime / duration, 1); // Ensure progress doesn't exceed 1
      const easedProgress = easeInQuad(progress); // Apply the easing function

      const currentValue = Math.floor(
        startValue + (targetValue - startValue) * easedProgress
      );
      element.textContent = currentValue + "%";

      // Dynamically adjust the scale based on the current value
      const currentScale = scaleBasedOnValue(currentValue);
      element.style.transform = `scale(${currentScale})`;

      if (progress < 1) {
        requestAnimationFrame(step); // Continue animation
      } else {
        element.textContent = targetValue + "%"; // Ensure exact target value at the end
        element.style.transform = `scale(${scaleBasedOnValue(targetValue)})`; // Final scale adjustment
      }
    }

    requestAnimationFrame(step); // Start the animation
  }

  let currentPath = ""; // Track the current path
  let choiceCount = 0; // Track the choice count in the current branch

  function nextVideo(percentageA, percentageB) {
    // Determine next branch based on user votes, starting from the second video
    let random = Math.random() < 0.5;
    const nextBranch =
      percentageA === percentageB
        ? random
          ? "a"
          : "b" // Randomly choose "a" or "b" if percentages are equal
        : percentageA > percentageB
        ? "a"
        : "b";

    let nextVideoFile; // Placeholder for the next video filename

    if (currentPath === "") {
      // First video (1.mov)
      nextVideoFile = "1.mov";
      currentPath = "1"; // Start the path
      choiceCount++;
      // console.log(`Starting video: ${currentPath}`);
    } else if (currentPath === "1") {
      // Second video (1a.mov or 1b.mov)
      nextVideoFile = `1${nextBranch}.mov`;
      currentPath += nextBranch; // Update path with branch
      choiceCount++;
      // console.log(`Second video: ${currentPath}`);
    } else {
      // Handle subsequent videos dynamically
      currentPath += choiceCount + nextBranch; // Append branch
      choiceCount++;
      nextVideoFile = `${currentPath}.mov`;
      // console.log(`Subsequent video: ${currentPath}`);
    }

    // Handle path merging (e.g., 1a2b and 1b2a merging into 1a2a)
    if (currentPath === "1a2b" || currentPath === "1b2a") {
      currentPath = "1a2a"; // Merge paths into 1a2a
      // console.log(`Merged path into: ${currentPath}`);
    }

    // Handle specific redirect for 1b2b3b4a to 1b2b3a4b
    if (currentPath === "1b2b3b4a") {
      currentPath = "1b2b3a4b";
      nextVideoFile = `${currentPath}.mov`;
      // console.log(`Redirected path to: ${currentPath}`);
    }

    // Check if the next video exists
    if (!doesVideoExist(nextVideoFile)) {
      console.error(`Video not found: ${nextVideoFile}`);
      return;
    }

    // Update the video source and reset progress
    videoPlayer.src = `assets/vid/${nextVideoFile}`;
    videoPlayer.load();
    videoPlayer.play();

    // Update the question for the next video
    updateQuestion(nextVideoFile);

    // Reset the votes and UI for the next round
    socket.emit("resetVotes");
    document.getElementById("countA").textContent = "0%";
    document.getElementById("countB").textContent = "0%";

    noTransition(); // Ensure transitions reset cleanly
    if (nextVideoFile !== "1.mov") {
      toggleOverlay(); // Hide the overlay after the video starts, but only after the first video
    }
  }

  const videoQuestionMap = {
    "1.mov": {
      question: "Zou je jezelf registreren?",
      answers: ["Ja", "Nee"],
      isEnding: false,
    },
    "1a.mov": {
      question:
        "Ga je ondanks de avondklok toch naar buiten om het eten te halen?",
      answers: ["Ja", "Nee"],
      isEnding: false,
    },
    "1b.mov": {
      question: "Maak je de deur open of vlucht je door de achterdeur?",
      answers: ["Vluchten", "Deur openen"],
      isEnding: false,
    },
    "1a2a.mov": {
      question: "Ga je onderduiken of jezelf melden?",
      answers: ["Onderduiken", "Melden"],
      isEnding: false,
    },
    "1a2b.mov": {
      question: "Ga je onderduiken of jezelf melden?",
      answers: ["Onderduiken", "Melden"],
      isEnding: false,
    },
    "1b2a.mov": {
      question: "Ga je onderduiken of jezelf melden?",
      answers: ["Onderduiken", "Melden"],
      isEnding: false,
    },
    "1b2b.mov": {
      question: "Geef je informatie?",
      answers: ["Ja", "Nee"],
      isEnding: false,
    },
    "1a2a3a.mov": {
      // ending
      question: "",
      answers: ["", ""],
      isEnding: true,
    },
    "1a2a3b.mov": {
      // ending
      question: "",
      answers: ["", ""],
      isEnding: true,
    },
    "1b2b3a.mov": {
      question: "Ga je liegen",
      answers: ["Ja", "Nee"],
      isEnding: false,
    },
    "1b2b3b.mov": {
      question: "Geef je toch informatie?",
      answers: ["Ja", "Nee"],
      isEnding: false,
    },
    "1b2b3a4a.mov": {
      // ending
      question: "",
      answers: ["", ""],
      isEnding: true,
    },
    "1b2b3a4b.mov": {
      // ending
      question: "",
      answers: ["", ""],
      isEnding: true,
    },
    "1b2b3b4b.mov": {
      // ending
      question: "",
      answers: ["", ""],
      isEnding: true,
    },
  };

  function doesVideoExist(videoFile) {
    return videoQuestionMap.hasOwnProperty(videoFile);
  }

  function updateQuestion(videoFile) {
    const questionData = videoQuestionMap[videoFile] || {
      question: "What happens next?",
      answers: ["Option A", "Option B"],
    };

    const questionElement = document.querySelector(".question");
    if (questionElement) {
      questionElement.textContent = questionData.question;
    }

    // Update the result options
    const resultOptions = resultsContainer.querySelectorAll(".result-option");
    if (resultOptions.length === 2) {
      resultOptions[0].textContent = questionData.answers[0]; // Update Option A
      resultOptions[1].textContent = questionData.answers[1]; // Update Option B
    }

    // Send answers to the vote screen via socket
    socket.emit("updateAnswers", questionData.answers);
  }
});
