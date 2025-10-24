const cvs = document.getElementById("tetris");
const ctx = cvs.getContext("2d");
const scoreElement = document.getElementById("score");

const ROW = 20;
const COL = (COLUMN = 10);
const SQ = (squareSize = 20);

// ==========================================
// CONFIGURAÇÕES DE CONTROLES (KEY CODES)
// ==========================================
const KEY_CODES = {
  // Controles de movimento
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_RIGHT: 39,
  ARROW_DOWN: 40,

  // Controles de jogo
  PAUSE: 80, // Tecla P
  RESTART: 82, // Tecla R
  THEME: 84, // Tecla T
  MUTE: 77, // Tecla M
};

// ==========================================
// CONFIGURAÇÕES DE VELOCIDADE DO JOGO
// ==========================================
const GAME_SPEED = {
  INITIAL_DROP_INTERVAL: 1000, // 1 segundo (em milissegundos)
  MIN_DROP_INTERVAL: 200, // Velocidade máxima: 200ms
  SPEED_INCREASE_THRESHOLD: 50, // A cada 50 pontos, aumenta velocidade
  SPEED_INCREASE_AMOUNT: 50, // Reduz 50ms a cada threshold
};

// SISTEMA DE TEMAS VISUAIS - Definir antes de usar
const THEMES = {
  classic: {
    name: "Clássico",
    vacant: "WHITE",
    stroke: "BLACK",
    ui: {
      background: "#ffffff",
      text: "#000000",
      accent: "#333333",
      score: "#000000",
    },
    pieces: {
      Z: "red",
      S: "green",
      T: "yellow",
      O: "blue",
      L: "purple",
      I: "cyan",
      J: "orange",
    },
  },
  neon: {
    name: "Neon",
    vacant: "#0a0a0a",
    stroke: "#333",
    ui: {
      background: "#000000",
      text: "#00ffff",
      accent: "#ff0080",
      score: "#00ff00",
    },
    pieces: {
      Z: "#ff0080",
      S: "#00ff80",
      T: "#ffff00",
      O: "#0080ff",
      L: "#8000ff",
      I: "#00ffff",
      J: "#ff8000",
    },
  },
  pastel: {
    name: "Pastel",
    vacant: "#f8f8f8",
    stroke: "#ddd",
    ui: {
      background: "#fff5f5",
      text: "#8b5a5a",
      accent: "#d4a6a6",
      score: "#8b5a5a",
    },
    pieces: {
      Z: "#ffb3ba",
      S: "#baffc9",
      T: "#ffffba",
      O: "#bae1ff",
      L: "#d4baff",
      I: "#baffff",
      J: "#ffdfba",
    },
  },
  dark: {
    name: "Sombrio",
    vacant: "#1a1a1a",
    stroke: "#444",
    ui: {
      background: "#0d1117",
      text: "#c9d1d9",
      accent: "#f0f6fc",
      score: "#58a6ff",
    },
    pieces: {
      Z: "#8b0000",
      S: "#006400",
      T: "#8b8b00",
      O: "#000080",
      L: "#4b0082",
      I: "#008b8b",
      J: "#8b4500",
    },
  },
};

// --- AUDIO ---
let isMuted = false;
// Música de fundo
const backgroundMusic = new Audio("sounds/music.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.4;

const stageClearAudio = new Audio("sounds/stage_clear.mp3");
stageClearAudio.volume = 0.6;

const rotateAudio = new Audio("sounds/rotate.mp3");
stageClearAudio.volume = 0.6;

const collisionAudio = new Audio("sounds/collision.mp3");
stageClearAudio.volume = 0.6;

// Função para tocar música de fundo
function playMusic() {
  backgroundMusic.play().catch((e) => {
    console.warn("🎵 Audio bloqueado pelo navegador:", e);
  });
}

// Função para pausar música de fundo
function pauseMusic() {
  backgroundMusic.pause();
}

const audios = [backgroundMusic, stageClearAudio, rotateAudio];

// Tocar música na primeira interação do usuário (tecla ou botão)
function startMusicOnInteraction() {
  const startMusic = () => {
    playMusic();
    document.removeEventListener("keydown", startMusic);
    document.removeEventListener("click", startMusic);
  };
  document.addEventListener("keydown", startMusic);
  document.addEventListener("click", startMusic);
}

startMusicOnInteraction();

// Função para aplicar mute/unmute
function toggleMute() {
  isMuted = !isMuted;

  audios.forEach((audio) => {
    if (isMuted) {
      audio.pause();
    } else {
      // Só tocar se não for música de efeito já pausada
      if (audio === backgroundMusic) {
        audio.play().catch((e) => console.warn("🎵 Audio bloqueado:", e));
      }
    }
  });

  console.log(isMuted ? "🔇 Mudo" : "🔊 Som ativado");
}

// Tema atual e controles
let currentThemeIndex = 0;
const themeNames = Object.keys(THEMES);
let currentTheme = THEMES[themeNames[currentThemeIndex]];

// draw a square with theme support
function drawSquare(x, y, color) {
  // Se a cor é um identificador de peça (Z, S, T, etc), usar a cor do tema
  if (typeof color === "string" && currentTheme.pieces[color]) {
    ctx.fillStyle = currentTheme.pieces[color];
  } else if (color === "VACANT" || color === currentTheme.vacant) {
    ctx.fillStyle = currentTheme.vacant;
  } else {
    // Para cores específicas ou cores antigas
    ctx.fillStyle = color;
  }

  ctx.fillRect(x * SQ, y * SQ, SQ, SQ);
  ctx.strokeStyle = currentTheme.stroke;
  ctx.strokeRect(x * SQ, y * SQ, SQ, SQ);
}

// create the board

let board = [];
for (r = 0; r < ROW; r++) {
  board[r] = [];
  for (c = 0; c < COL; c++) {
    board[r][c] = "VACANT";
  }
}

// draw the board
function drawBoard() {
  for (r = 0; r < ROW; r++) {
    for (c = 0; c < COL; c++) {
      drawSquare(c, r, board[r][c]);
    }
  }
}

// controlar modal de pausa
function showPauseModal() {
  const elements = getElements([
    "pauseTitle",
    "pauseMessage",
    "pauseModalContent",
  ]);

  if (isAutoPaused) {
    elements.pauseTitle.textContent = "⏸️ PAUSADO";
    elements.pauseMessage.innerHTML = `
      Janela perdeu foco<br>Pressione <span class="pause-key">P</span> para retomar<br><br>
      Pressione <span class="pause-key">R</span> para reiniciar
    `;
  } else if (isPaused) {
    elements.pauseTitle.textContent = "⏸️ PAUSADO";
    elements.pauseMessage.innerHTML = `
      Pressione <span class="pause-key">P</span> para continuar<br><br>
      Pressione <span class="pause-key">R</span> para reiniciar
    `;
  }

  // Aplicar cores do tema atual
  const pauseKeys = document.querySelectorAll(".pause-key");

  if (elements.pauseModalContent) {
    elements.pauseModalContent.style.borderColor = currentTheme.ui.accent;
    elements.pauseModalContent.style.boxShadow = `0 0 20px ${currentTheme.ui.accent}50`;
  }

  if (elements.pauseTitle) {
    elements.pauseTitle.style.color = currentTheme.ui.accent;
  }

  pauseKeys.forEach((key) => {
    key.style.backgroundColor = currentTheme.ui.accent;
  });

  showModal("pauseModal");
}

function hidePauseModal() {
  hideModal("pauseModal");
}

// controlar modal de game over
function showGameOverModal() {
  const elements = getElements(["finalScore", "linesCleared", "gameTime"]);

  // Calcular tempo de jogo
  const gameEndTime = Date.now();
  const totalTime = Math.floor((gameEndTime - gameStartTime) / 1000);
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Atualizar elementos
  elements.finalScore.textContent = score;
  elements.linesCleared.textContent = linesCleared;
  elements.gameTime.textContent = timeString;

  showModal("gameOverModal");

  if (!isMuted) {
    const gameOverMusic = new Audio("sounds/game_over.mp3");
    gameOverMusic.volume = 0.6;
    pauseMusic();
    gameOverMusic.play().catch((e) => console.warn("Audio bloqueado:", e));
  }
}

function hideGameOverModal() {
  hideModal("gameOverModal");
}

drawBoard();

// ==========================================
// FUNÇÕES UTILITÁRIAS PARA MANIPULAÇÃO DE MODAIS
// ==========================================

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "block";
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

function getElements(elementIds) {
  const elements = {};
  elementIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      elements[id] = element;
    }
  });
  return elements;
}

// Função para aplicar cores da interface
function applyUITheme() {
  const body = document.body;
  const scoreElement = document.getElementById("score");
  const allDivs = document.querySelectorAll("div");
  const allLinks = document.querySelectorAll("a");

  // Aplicar cor de fundo
  body.style.backgroundColor = currentTheme.ui.background;
  body.style.color = currentTheme.ui.text;

  // Aplicar cor do score especificamente
  if (scoreElement) {
    scoreElement.style.color = currentTheme.ui.score;
  }

  // Aplicar cor dos textos gerais
  allDivs.forEach((div) => {
    if (div.id !== "score") {
      div.style.color = currentTheme.ui.text;
    }
  });

  // Manter links com cor de destaque
  allLinks.forEach((link) => {
    link.style.color = currentTheme.ui.accent;
  });
}

// Função para alternar tema
function switchTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % themeNames.length;
  currentTheme = THEMES[themeNames[currentThemeIndex]];

  // Aplicar cores da interface
  applyUITheme();

  // Redesenhar tudo com novo tema
  drawBoard();
  if (!gameOver && p) {
    p.draw();
  }

  // Mostrar notificação do tema atual
  showThemeNotification();
}

// Mostrar notificação do tema atual
function showThemeNotification() {
  // Criar elemento de notificação se não existir
  let notification = document.getElementById("themeNotification");
  if (!notification) {
    notification = document.createElement("div");
    notification.id = "themeNotification";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      z-index: 1000;
      transition: opacity 0.3s ease;
      border: 2px solid;
    `;
    document.body.appendChild(notification);
  }

  // Aplicar cores do tema atual à notificação
  notification.style.backgroundColor = currentTheme.ui.accent;
  notification.style.color = currentTheme.ui.background;
  notification.style.borderColor = currentTheme.ui.text;

  // Atualizar conteúdo e mostrar
  notification.textContent = `🎨 Tema: ${currentTheme.name}`;
  notification.style.opacity = "1";

  // Esconder após 2 segundos
  setTimeout(() => {
    notification.style.opacity = "0";
  }, 2500);
}

// the pieces and their colors (agora usando tema dinâmico)
const PIECES = [
  [Z, "Z"],
  [S, "S"],
  [T, "T"],
  [O, "O"],
  [L, "L"],
  [I, "I"],
  [J, "J"],
];

// generate random pieces

function randomPiece() {
  let r = (randomN = Math.floor(Math.random() * PIECES.length)); // 0 -> 6
  return new Piece(PIECES[r][0], PIECES[r][1]);
}

let p = randomPiece();

// The Object Piece

function Piece(tetromino, color) {
  this.tetromino = tetromino;
  this.color = color;

  this.tetrominoN = 0; // we start from the first pattern
  this.activeTetromino = this.tetromino[this.tetrominoN];

  // we need to control the pieces
  this.x = 3;
  this.y = -2;
}

// fill function

Piece.prototype.fill = function (color) {
  for (r = 0; r < this.activeTetromino.length; r++) {
    for (c = 0; c < this.activeTetromino.length; c++) {
      // we draw only occupied squares
      if (this.activeTetromino[r][c]) {
        drawSquare(this.x + c, this.y + r, color);
      }
    }
  }
};

// draw a piece to the board

Piece.prototype.draw = function () {
  this.fill(this.color);
};

// undraw a piece

Piece.prototype.unDraw = function () {
  this.fill("VACANT");
};

// move Down the piece

Piece.prototype.moveDown = function () {
  if (!this.collision(0, 1, this.activeTetromino)) {
    this.unDraw();
    this.y++;
    this.draw();
  } else {
    // toca som de colisão se não estiver mutado
    if (!isMuted) {
      collisionAudio.currentTime = 0; // reinicia o áudio
      collisionAudio.play().catch((e) => console.warn("Audio bloqueado:", e));
    }

    // travar peça e gerar nova
    this.lock();
    p = randomPiece();
  }
};

// move Right the piece
Piece.prototype.moveRight = function () {
  if (!this.collision(1, 0, this.activeTetromino)) {
    this.unDraw();
    this.x++;
    this.draw();
  }
};

// move Left the piece
Piece.prototype.moveLeft = function () {
  if (!this.collision(-1, 0, this.activeTetromino)) {
    this.unDraw();
    this.x--;
    this.draw();
  }
};

// rotate the piece
Piece.prototype.rotate = function () {
  let nextPattern =
    this.tetromino[(this.tetrominoN + 1) % this.tetromino.length];
  let kick = 0;

  if (this.collision(0, 0, nextPattern)) {
    if (this.x > COL / 2) {
      // it's the right wall
      kick = -1; // we need to move the piece to the left
    } else {
      // it's the left wall
      kick = 1; // we need to move the piece to the right
    }
  }

  if (!this.collision(kick, 0, nextPattern)) {
    this.unDraw();
    this.x += kick;
    this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length; // (0+1)%4 => 1
    this.activeTetromino = this.tetromino[this.tetrominoN];
    this.draw();
    if (this.tetromino.length > 1 && !isMuted) {
      rotateAudio.currentTime = 0;
      rotateAudio.play().catch((e) => console.warn("Audio bloqueado:", e));
    }
  }
};

let score = 0;

Piece.prototype.lock = function () {
  let lineClearedThisTurn = false; // flag para tocar áudio apenas uma vez

  for (r = 0; r < this.activeTetromino.length; r++) {
    for (c = 0; c < this.activeTetromino.length; c++) {
      if (!this.activeTetromino[r][c]) continue;

      if (this.y + r < 0) {
        gameOver = true;
        showGameOverModal();
        break;
      }

      board[this.y + r][this.x + c] = this.color;
    }
  }

  // remove full rows
  for (r = 0; r < ROW; r++) {
    let isRowFull = true;
    for (c = 0; c < COL; c++) {
      isRowFull = isRowFull && board[r][c] != "VACANT";
    }
    if (isRowFull) {
      lineClearedThisTurn = true; // marca que pelo menos uma linha foi limpa

      // move todas as linhas acima para baixo
      for (y = r; y > 1; y--) {
        for (c = 0; c < COL; c++) {
          board[y][c] = board[y - 1][c];
        }
      }

      // limpar top row
      for (c = 0; c < COL; c++) {
        board[0][c] = "VACANT";
      }

      score += 10;
      linesCleared++;
    }
  }

  // toca áudio apenas uma vez se alguma linha foi limpa
  if (lineClearedThisTurn && !isMuted) {
    stageClearAudio.currentTime = 0;
    stageClearAudio.play().catch((e) => console.warn("Audio bloqueado:", e));
  }

  drawBoard();
  scoreElement.innerHTML = score;
};

// collision function

Piece.prototype.collision = function (x, y, piece) {
  for (r = 0; r < piece.length; r++) {
    for (c = 0; c < piece.length; c++) {
      // if the square is empty, we skip it
      if (!piece[r][c]) {
        continue;
      }
      // coordinates of the piece after movement
      let newX = this.x + c + x;
      let newY = this.y + r + y;

      // conditions
      if (newX < 0 || newX >= COL || newY >= ROW) {
        return true;
      }
      // skip newY < 0; board[-1] will crush our game
      if (newY < 0) {
        continue;
      }
      // check if there is a locked piece alrady in place
      if (board[newY][newX] != "VACANT") {
        return true;
      }
    }
  }
  return false;
};

// CONTROL the piece

document.addEventListener("keydown", CONTROL);

// SISTEMA DE PAUSA AUTOMÁTICA - Detectar perda/retorno de foco da janela
window.addEventListener("blur", function () {
  // Janela perdeu foco - ativar pausa automática
  if (!gameOver && !isPaused) {
    isWindowBlurred = true;
    isAutoPaused = true;
  }
});

window.addEventListener("focus", function () {
  // Janela recuperou foco - marcar que não está mais desfocada
  // mas manter pausado até o jogador pressionar P manualmente
  isWindowBlurred = false;
});

function CONTROL(event) {
  // Tecla P - Pausar/Despausar o jogo
  if (event.keyCode === KEY_CODES.PAUSE) {
    if (isPaused && !gameOver) {
      // Despausar jogo (pausa manual)
      isPaused = false;
      hidePauseModal();
      drawBoard();
      p.draw();

      // Retomar música
      playMusic();
    } else if (isAutoPaused && !gameOver) {
      // Retomar após pausa automática
      isAutoPaused = false;
      hidePauseModal();
      drawBoard();
      p.draw();

      // Retomar música
      playMusic();
    } else if (!isPaused && !isAutoPaused && !gameOver) {
      // Pausar manualmente
      isPaused = true;
      showPauseModal();
      pauseMusic();
    }
    return; // Não executa outros controles quando pausando/despausando
  }

  // Tecla R - Reiniciar jogo
  if (event.keyCode === KEY_CODES.RESTART) {
    hidePauseModal();
    restartGame();
    return;
  }

  // Tecla T - Alternar tema visual
  if (event.keyCode === KEY_CODES.THEME) {
    switchTheme();
    return;
  }

  // Tecla M - mute/unmute
  if (event.keyCode === KEY_CODES.MUTE) {
    toggleMute();
    return;
  }

  // Só permite outros controles se o jogo não estiver pausado
  if (isPaused || isAutoPaused || gameOver) {
    return;
  }

  // Controles de movimento
  if (event.keyCode === KEY_CODES.ARROW_LEFT) {
    p.moveLeft();
  } else if (event.keyCode === KEY_CODES.ARROW_UP) {
    p.rotate();
  } else if (event.keyCode === KEY_CODES.ARROW_RIGHT) {
    p.moveRight();
  } else if (event.keyCode === KEY_CODES.ARROW_DOWN) {
    p.moveDown();
    dropStart = Date.now();
  }
}

// drop the piece every 1sec

let dropStart = Date.now();
let gameStartTime = Date.now(); // tempo de início do jogo
let dropInterval = GAME_SPEED.INITIAL_DROP_INTERVAL;
let gameOver = false;
let isPaused = false; // controla pausa manual
let isWindowBlurred = false; // controla se janela perdeu foco
let isAutoPaused = false; // controla se está pausado automaticamente
let linesCleared = 0; // contador de linhas limpas

function updateDropInterval() {
  const speedReduction =
    Math.floor(score / GAME_SPEED.SPEED_INCREASE_THRESHOLD) *
    GAME_SPEED.SPEED_INCREASE_AMOUNT;
  dropInterval = Math.max(
    GAME_SPEED.MIN_DROP_INTERVAL,
    GAME_SPEED.INITIAL_DROP_INTERVAL - speedReduction
  );
}

function drop() {
  let now = Date.now();
  let delta = now - dropStart;

  // Só move a peça se o jogo não estiver pausado (manual ou automaticamente)
  if (!isPaused && !isAutoPaused && delta > GAME_SPEED.INITIAL_DROP_INTERVAL) {
    p.moveDown();
    dropStart = Date.now();
  }

  // Se o jogo estiver pausado, resetar o contador para evitar queda rápida ao despausar
  if (isPaused || (isAutoPaused && !gameOver)) {
    dropStart = Date.now();
    // Mostrar modal de pausa
    showPauseModal();
    if (!backgroundMusic.paused) backgroundMusic.pause();
  }

  if (!gameOver) {
    requestAnimationFrame(drop);
  }
}

// Aplicar tema inicial
applyUITheme();
drop();

// função para reiniciar o jogo
function restartGame() {
  // Resetar variáveis do jogo
  gameOver = false;
  isPaused = false;
  isAutoPaused = false;
  isWindowBlurred = false;
  score = 0;
  linesCleared = 0;
  dropStart = Date.now();
  gameStartTime = Date.now();

  // Limpar o board
  for (r = 0; r < ROW; r++) {
    for (c = 0; c < COL; c++) {
      board[r][c] = "VACANT";
    }
  }

  // Gerar nova peça
  p = randomPiece();

  // Redesenhar o board e a peça
  drawBoard();
  p.draw();

  // Atualizar pontuação na tela
  scoreElement.innerHTML = score;

  // Esconder modal de Game Over
  hideGameOverModal();

  // Aplicar tema atual
  applyUITheme();
  if (!isMuted) {
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
  }
  // Reiniciar o loop do jogo
  drop();
}
