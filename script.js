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
let firstPipeTimeoutId = null;


/*
  Prevent duplicate mobile button events.
*/

let lastButtonTouchTime = 0;


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


  /* -------------------------------------------------------
     DRAW BIRD
  ------------------------------------------------------- */

  draw() {
    if (
      !birdImg.complete ||
      birdImg.naturalWidth === 0
    ) {
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


  /* -------------------------------------------------------
     FLAP
  ------------------------------------------------------- */

  flap() {
    if (!gameRunning) {
      return;
    }

    this.velocity = this.jump;

    playFlapSound();
  },


  /* -------------------------------------------------------
     UPDATE BIRD
  ------------------------------------------------------- */

  update() {
    this.velocity += this.gravity;

    this.y += this.velocity;


    /*
      Top boundary
    */

    if (this.y < this.radius) {
      this.y = this.radius;

      this.velocity = 0;
    }


    /*
      Bottom boundary
    */

    if (
      this.y >
      GAME_HEIGHT - this.radius
    ) {
      this.y =
        GAME_HEIGHT - this.radius;

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
    Pipe opening position
  */

  const minimumGapPosition = 65;

  const maximumGapPosition =
    GAME_HEIGHT -
    pipeGap -
    65;


  this.gap =
    Math.random() *
      (
        maximumGapPosition -
        minimumGapPosition
      ) +
    minimumGapPosition;


  this.passed = false;


  /* -------------------------------------------------------
     DRAW PIPE
  ------------------------------------------------------- */

  this.draw = function () {
    if (
      !pipeImg.complete ||
      pipeImg.naturalWidth === 0
    ) {
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

      GAME_HEIGHT -
        (
          this.gap +
          pipeGap
        )
    );
  };


  /* -------------------------------------------------------
     UPDATE PIPE
  ------------------------------------------------------- */

  this.update = function () {
    this.x -= pipeSpeed;


    /*
      Bird collision area
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


    /*
      Horizontal collision
    */

    const horizontalCollision =
      birdRight > this.x &&
      birdLeft < pipeRight;


    /*
      Vertical collision
    */

    const topPipeCollision =
      birdTop < this.gap;

    const bottomPipeCollision =
      birdBottom >
      this.gap + pipeGap;


    /*
      End game
    */

    if (
      horizontalCollision &&
      (
        topPipeCollision ||
        bottomPipeCollision
      )
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
  if (scoreDisplay) {
    scoreDisplay.textContent =
      String(score);
  }


  if (score > bestScore) {
    bestScore = score;


    if (bestScoreDisplay) {
      bestScoreDisplay.textContent =
        String(bestScore);
    }


    localStorage.setItem(
      "flyingBirdBestScore",
      String(bestScore)
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


  try {
    flapSound.currentTime = 0;

    const playPromise =
      flapSound.play();


    if (
      playPromise &&
      typeof playPromise.catch ===
        "function"
    ) {
      playPromise.catch(() => {
        /*
          Browser may block audio.
        */
      });
    }

  } catch (error) {
    console.log(
      "Audio playback unavailable."
    );
  }
}


/* =========================================================
   PIPE CREATION
========================================================= */

function createPipe() {
  if (!gameRunning) {
    return;
  }

  pipes.push(
    new Pipe()
  );
}


/* =========================================================
   DRAW
========================================================= */

function draw() {

  /*
    Background
  */

  if (
    backgroundImg.complete &&
    backgroundImg.naturalWidth > 0
  ) {

    ctx.drawImage(
      backgroundImg,

      0,
      0,

      GAME_WIDTH,
      GAME_HEIGHT
    );

  } else {

    ctx.fillStyle =
      "#66b7e8";

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

  pipes.forEach(
    (pipe) => {
      pipe.draw();
    }
  );


  /*
    Bird
  */

  bird.draw();
}


/* =========================================================
   UPDATE
========================================================= */

function update() {
  if (!gameRunning) {
    return;
  }


  bird.update();


  /*
    Update pipes.
  */

  for (const pipe of pipes) {

    if (!gameRunning) {
      break;
    }

    pipe.update();
  }


  /*
    Remove pipes that left screen.
  */

  while (
    pipes.length > 0 &&
    pipes[0].x +
      pipeWidth <
      0
  ) {
    pipes.shift();
  }
}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop() {

  if (!gameRunning) {
    animationId = null;

    return;
  }


  update();

  draw();


  if (gameRunning) {

    animationId =
      window.requestAnimationFrame(
        gameLoop
      );
  }
}


/* =========================================================
   OVERLAY FUNCTIONS
========================================================= */

function showStartOverlay() {

  /*
    Hide game over.
  */

  gameOverModal.classList.add(
    "hidden"
  );


  /*
    Show start overlay.
  */

  startOverlay.classList.remove(
    "hidden"
  );


  /*
    Interaction states.
  */

  startOverlay.style.pointerEvents =
    "auto";

  gameOverModal.style.pointerEvents =
    "none";
}


function showGameOverOverlay() {

  /*
    Hide start overlay.
  */

  startOverlay.classList.add(
    "hidden"
  );


  /*
    Show game over.
  */

  gameOverModal.classList.remove(
    "hidden"
  );


  /*
    Interaction states.
  */

  startOverlay.style.pointerEvents =
    "none";

  gameOverModal.style.pointerEvents =
    "auto";
}


function hideAllOverlays() {

  startOverlay.classList.add(
    "hidden"
  );

  gameOverModal.classList.add(
    "hidden"
  );


  startOverlay.style.pointerEvents =
    "none";

  gameOverModal.style.pointerEvents =
    "none";
}


/* =========================================================
   RESET GAME STATE
========================================================= */

function resetGameState() {

  /*
    Stop timers.
  */

  stopGameLoop();


  /*
    Clear pipes.
  */

  pipes.length = 0;


  /*
    Reset score.
  */

  score = 0;

  updateScore();


  /*
    Reset bird.
  */

  bird.x = 120;

  bird.y =
    GAME_HEIGHT / 2;

  bird.velocity = 0;


  /*
    Reset flags.
  */

  gameRunning = false;

  gameStarted = false;

  gameOver = false;


  /*
    Reset final score.
  */

  if (finalScore) {
    finalScore.textContent =
      "0";
  }
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

  /*
    Stop previous game.
  */

  stopGameLoop();


  /*
    Clear old pipes.
  */

  pipes.length = 0;


  /*
    Reset score.
  */

  score = 0;

  updateScore();


  /*
    Reset bird.
  */

  bird.x = 120;

  bird.y =
    GAME_HEIGHT / 2;

  bird.velocity = 0;


  /*
    Reset state.
  */

  gameOver = false;

  gameStarted = true;

  gameRunning = true;


  /*
    Hide overlays.
  */

  hideAllOverlays();


  /*
    Pipe interval.
  */

  pipeIntervalId =
    window.setInterval(
      createPipe,
      pipeInterval
    );


  /*
    First pipe.
  */

  firstPipeTimeoutId =
    window.setTimeout(
      () => {

        if (gameRunning) {
          createPipe();
        }

        firstPipeTimeoutId =
          null;

      },
      700
    );


  /*
    Start animation.
  */

  animationId =
    window.requestAnimationFrame(
      gameLoop
    );
}


/* =========================================================
   STOP GAME
========================================================= */

function stopGameLoop() {

  /*
    Stop pipe interval.
  */

  if (
    pipeIntervalId !== null
  ) {

    window.clearInterval(
      pipeIntervalId
    );

    pipeIntervalId = null;
  }


  /*
    Stop first pipe timeout.
  */

  if (
    firstPipeTimeoutId !== null
  ) {

    window.clearTimeout(
      firstPipeTimeoutId
    );

    firstPipeTimeoutId = null;
  }


  /*
    Stop animation.
  */

  if (
    animationId !== null
  ) {

    window.cancelAnimationFrame(
      animationId
    );

    animationId = null;
  }
}


/* =========================================================
   GAME OVER
========================================================= */

function endGame() {

  /*
    Prevent duplicate game over.
  */

  if (gameOver) {
    return;
  }


  /*
    Change state first.
  */

  gameOver = true;

  gameRunning = false;


  /*
    Stop timers.
  */

  stopGameLoop();


  /*
    Final score.
  */

  if (finalScore) {

    finalScore.textContent =
      String(score);
  }


  /*
    Best score.
  */

  if (score > bestScore) {

    bestScore = score;

    localStorage.setItem(
      "flyingBirdBestScore",
      String(bestScore)
    );
  }


  if (bestScoreDisplay) {

    bestScoreDisplay.textContent =
      String(bestScore);
  }


  /*
    Show game over modal.
  */

  showGameOverOverlay();
}


/* =========================================================
   FLAP
========================================================= */

function flap() {

  /*
    Start game if not started.
  */

  if (!gameStarted) {

    startGame();

    bird.flap();

    return;
  }


  /*
    Don't flap after game over.
  */

  if (gameOver) {
    return;
  }


  /*
    Normal flap.
  */

  bird.flap();
}


/* =========================================================
   BUTTON HANDLER
========================================================= */

function handleButtonPress(
  button,
  action
) {

  if (!button) {
    return;
  }


  /*
    Mobile / touch / pointer.
  */

  button.addEventListener(
    "pointerdown",
    function (event) {

      event.preventDefault();

      event.stopPropagation();


      lastButtonTouchTime =
        Date.now();


      action();

    },
    {
      passive: false,
    }
  );


  /*
    Desktop / keyboard fallback.
  */

  button.addEventListener(
    "click",
    function (event) {

      event.preventDefault();

      event.stopPropagation();


      const timeSincePointer =
        Date.now() -
        lastButtonTouchTime;


      /*
        Prevent duplicate execution.
      */

      if (
        timeSincePointer <
        500
      ) {
        return;
      }


      action();
    }
  );
}


/* =========================================================
   START BUTTON
========================================================= */

handleButtonPress(
  startButton,
  function () {

    startGame();

    /*
      Give the bird its first flap.
    */

    bird.flap();
  }
);


/* =========================================================
   PLAY AGAIN BUTTON
========================================================= */

handleButtonPress(
  retryButton,
  function () {

    /*
      Completely reset previous game.
    */

    resetGameState();


    /*
      Start fresh game.
    */

    startGame();


    /*
      Immediately fly.
    */

    bird.flap();
  }
);


/* =========================================================
   CLOSE BUTTON
========================================================= */

handleButtonPress(
  closeButton,
  function () {

    /*
      Stop and reset.
    */

    resetGameState();


    /*
      Return to ready screen.
    */

    showStartOverlay();
  }
);


/* =========================================================
   CANVAS POINTER
========================================================= */

canvas.addEventListener(
  "pointerdown",
  function (event) {

    event.preventDefault();


    /*
      Ignore canvas when game over.
    */

    if (
      !gameRunning ||
      gameOver
    ) {
      return;
    }


    bird.flap();

  },
  {
    passive: false,
  }
);


/* =========================================================
   MOBILE TAP TO FLY
========================================================= */

handleButtonPress(
  flapButton,
  function () {
    flap();
  }
);


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  function (event) {

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
   PREVENT TOUCH SCROLLING
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
   PREVENT DOUBLE TAP ZOOM
========================================================= */

canvas.addEventListener(
  "dblclick",
  function (event) {

    event.preventDefault();

  }
);


/* =========================================================
   INITIAL STATE
========================================================= */

if (bestScoreDisplay) {

  bestScoreDisplay.textContent =
    String(bestScore);
}

if (scoreDisplay) {

  scoreDisplay.textContent =
    "0";
}


/*
  Start with Ready screen.
*/

resetGameState();

showStartOverlay();