/* =========================================================
   CANVAS
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const startOverlay = document.getElementById("start-overlay");
const gameOverModal = document.getElementById("game-over-modal");

const startButton = document.getElementById("start-button");
const retryButton = document.getElementById("retry-button");
const closeButton = document.getElementById("close-button");
const flapButton = document.getElementById("flap-button");

const scoreDisplay = document.getElementById("scoreDisplay");
const bestScoreDisplay = document.getElementById("bestScoreDisplay");
const finalScore = document.getElementById("finalScore");

const flapSound = document.getElementById("flapSound");


/* =========================================================
   IMAGES
========================================================= */

const birdImg = new Image();

birdImg.src =
  "https://i.postimg.cc/x1jpLrpG/flappybird2.png";


const pipeImg = new Image();

pipeImg.src =
  "https://i.postimg.cc/c4Sb4tQb/pipe3.png";


const backgroundImg = new Image();

backgroundImg.src =
  "https://i.postimg.cc/J45dy7x4/bg6.jpg";


/* =========================================================
   GAME SETTINGS
========================================================= */

const pipeGap = 170;
const pipeWidth = 42;

const pipeInterval = 1500;
const pipeSpeed = 2.5;


/* =========================================================
   GAME STATE
========================================================= */

const pipes = [];

let score = 0;

let bestScore =
  Number(localStorage.getItem("flyingBirdBestScore")) || 0;

let gameRunning = false;
let gameStarted = false;
let gameOver = false;

let pipeIntervalId = null;
let animationId = null;


/* =========================================================
   BIRD
========================================================= */

const bird = {
  x: 120,

  y: GAME_HEIGHT / 2,

  radius: 17,

  velocity: 0,

  gravity: 0.48,

  jump: -9.5,

  draw() {
    if (!birdImg.complete) {
      return;
    }

    ctx.drawImage(
      birdImg,

      this.x - this.radius,
      this.y - this.radius,

      this.radius * 2,
      this.radius * 2
    );
  },

  flap() {
    if (!gameRunning) {
      return;
    }

    this.velocity = this.jump;

    playFlapSound();
  },

  update() {
    this.velocity += this.gravity;

    this.y += this.velocity;

    /*
      Keep bird inside the top boundary.
    */

    if (this.y < this.radius) {
      this.y = this.radius;

      this.velocity = 0;
    }

    /*
      Bottom boundary.
    */

    if (this.y > GAME_HEIGHT - this.radius) {
      this.y = GAME_HEIGHT - this.radius;

      this.velocity = 0;
    }
  },
};


/* =========================================================
   PIPE
========================================================= */

function Pipe() {
  this.x = GAME_WIDTH;

  /*
    Leave enough room above and below
    the pipe opening.
  */

  const minimumGapPosition = 65;

  const maximumGapPosition =
    GAME_HEIGHT - pipeGap - 65;

  this.gap =
    Math.random() *
      (maximumGapPosition - minimumGapPosition) +
    minimumGapPosition;

  this.passed = false;


  this.draw = function () {
    if (!pipeImg.complete) {
      return;
    }

    /*
      Top pipe
    */

    ctx.drawImage(
      pipeImg,

      this.x,
      0,

      pipeWidth,
      this.gap
    );


    /*
      Bottom pipe
    */

    ctx.drawImage(
      pipeImg,

      this.x,

      this.gap + pipeGap,

      pipeWidth,

      GAME_HEIGHT - (this.gap + pipeGap)
    );
  };


  this.update = function () {
    this.x -= pipeSpeed;


    /*
      Collision detection
    */

    const birdRight =
      bird.x + bird.radius;

    const birdLeft =
      bird.x - bird.radius;

    const birdTop =
      bird.y - bird.radius;

    const birdBottom =
      bird.y + bird.radius;


    const pipeRight =
      this.x + pipeWidth;


    const horizontalCollision =
      birdRight > this.x &&
      birdLeft < pipeRight;


    const topPipeCollision =
      birdTop < this.gap;


    const bottomPipeCollision =
      birdBottom >
      this.gap + pipeGap;


    if (
      horizontalCollision &&
      (topPipeCollision || bottomPipeCollision)
    ) {
      endGame();

      return;
    }


    /*
      Score
    */

    if (
      !this.passed &&
      bird.x > pipeRight
    ) {
      this.passed = true;

      score++;

      updateScore();
    }
  };
}


/* =========================================================
   SCORE
========================================================= */

function updateScore() {
  scoreDisplay.textContent = score;

  if (score > bestScore) {
    bestScore = score;

    bestScoreDisplay.textContent = bestScore;

    localStorage.setItem(
      "flyingBirdBestScore",
      bestScore
    );
  }
}


/* =========================================================
   AUDIO
========================================================= */

function playFlapSound() {
  if (!flapSound) {
    return;
  }

  /*
    The original code tried to call .play()
    on the <source> element.

    Now the <audio> element itself has the ID,
    so this works correctly.
  */

  try {
    flapSound.currentTime = 0;

    const playPromise = flapSound.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        /*
          Browsers can block audio until the user
          interacts with the page.
        */
      });
    }
  } catch (error) {
    console.log("Audio playback unavailable.");
  }
}


/* =========================================================
   PIPE CREATION
========================================================= */

function createPipe() {
  if (!gameRunning) {
    return;
  }

  pipes.push(new Pipe());
}


/* =========================================================
   DRAW
========================================================= */

function draw() {
  /*
    Background
  */

  if (backgroundImg.complete) {
    ctx.drawImage(
      backgroundImg,

      0,
      0,

      GAME_WIDTH,
      GAME_HEIGHT
    );
  } else {
    ctx.fillStyle = "#66b7e8";

    ctx.fillRect(
      0,
      0,
      GAME_WIDTH,
      GAME_HEIGHT
    );
  }


  /*
    Pipes
  */

  pipes.forEach((pipe) => {
    pipe.draw();
  });


  /*
    Bird
  */

  bird.draw();
}


/* =========================================================
   UPDATE
========================================================= */

function update() {
  bird.update();

  pipes.forEach((pipe) => {
    pipe.update();
  });


  /*
    Remove pipes that have left the screen.

    This prevents the pipes array from growing forever.
  */

  while (
    pipes.length > 0 &&
    pipes[0].x + pipeWidth < 0
  ) {
    pipes.shift();
  }
}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop() {
  if (!gameRunning) {
    return;
  }

  update();

  draw();

  animationId =
    requestAnimationFrame(gameLoop);
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {
  stopGameLoop();

  pipes.length = 0;

  score = 0;

  updateScore();

  bird.x = 120;

  bird.y = GAME_HEIGHT / 2;

  bird.velocity = 0;

  gameOver = false;

  gameStarted = true;

  gameRunning = true;

  startOverlay.classList.add("hidden");

  gameOverModal.classList.add("hidden");


  /*
    Start generating pipes.
  */

  pipeIntervalId =
    setInterval(
      createPipe,
      pipeInterval
    );


  /*
    Create the first pipe sooner,
    so the player doesn't wait too long.
  */

  setTimeout(() => {
    if (gameRunning) {
      createPipe();
    }
  }, 700);


  animationId =
    requestAnimationFrame(gameLoop);
}


/* =========================================================
   STOP GAME
========================================================= */

function stopGameLoop() {
  if (pipeIntervalId !== null) {
    clearInterval(pipeIntervalId);

    pipeIntervalId = null;
  }

  if (animationId !== null) {
    cancelAnimationFrame(animationId);

    animationId = null;
  }
}


/* =========================================================
   GAME OVER
========================================================= */

function endGame() {
  if (gameOver) {
    return;
  }

  gameOver = true;

  gameRunning = false;

  stopGameLoop();


  /*
    Update final score.
  */

  finalScore.textContent = score;


  /*
    Update best score.
  */

  if (score > bestScore) {
    bestScore = score;

    localStorage.setItem(
      "flyingBirdBestScore",
      bestScore
    );
  }

  bestScoreDisplay.textContent =
    bestScore;


  /*
    Show modal.
  */

  gameOverModal.classList.remove(
    "hidden"
  );
}


/* =========================================================
   FLAP
========================================================= */

function flap() {
  if (!gameStarted) {
    startGame();

    return;
  }

  if (gameOver) {
    return;
  }

  bird.flap();
}


/* =========================================================
   CANVAS CLICK / TOUCH
========================================================= */

canvas.addEventListener(
  "pointerdown",
  function (event) {
    /*
      Prevent accidental scrolling/selection.
    */

    event.preventDefault();

    flap();
  }
);


/* =========================================================
   MOBILE BUTTON
========================================================= */

flapButton.addEventListener(
  "pointerdown",
  function (event) {
    event.preventDefault();

    flap();
  }
);


/* =========================================================
   START BUTTON
========================================================= */

startButton.addEventListener(
  "click",
  function () {
    startGame();

    /*
      Immediately flap so the player
      sees movement.
    */

    bird.flap();
  }
);


/* =========================================================
   RETRY BUTTON
========================================================= */

retryButton.addEventListener(
  "click",
  function () {
    startGame();

    bird.flap();
  }
);


/* =========================================================
   CLOSE BUTTON
========================================================= */

closeButton.addEventListener(
  "click",
  function () {
    gameOverModal.classList.add(
      "hidden"
    );

    startOverlay.classList.remove(
      "hidden"
    );

    gameStarted = false;
  }
);


/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

document.addEventListener(
  "keydown",
  function (event) {
    /*
      Space
    */

    if (
      event.code === "Space" ||
      event.code === "ArrowUp"
    ) {
      event.preventDefault();

      flap();
    }
  }
);


/* =========================================================
   PREVENT DOUBLE-TAP ZOOM ON GAME
========================================================= */

canvas.addEventListener(
  "touchstart",
  function (event) {
    event.preventDefault();
  },
  {
    passive: false,
  }
);


/* =========================================================
   INITIAL UI
========================================================= */

bestScoreDisplay.textContent =
  bestScore;

scoreDisplay.textContent = "0";


/*
  The game intentionally does NOT start
  automatically anymore.

  The player gets a clean Start Game screen.
*/