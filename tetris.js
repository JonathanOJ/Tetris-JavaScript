const cvs = document.getElementById("tetris");
const ctx = cvs.getContext("2d");
const scoreElement = document.getElementById("score");

const ROW = 20;
const COL = 10;
const SQ = 20;

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
  HELP: 72, // Tecla H
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

// ==========================================
// CONSTANTES PARA SUBSTITUIR NÚMEROS MÁGICOS
// ==========================================
const GAME_CONSTANTS = {
  POINTS_PER_LINE: 10,
  INITIAL_PIECE_X: 3,
  INITIAL_PIECE_Y: -2,
  BOARD_LIMIT_TOP: 0,
  BOARD_LIMIT_BOTTOM: 1,
  FADE_STEPS: 10,
  THEME_NOTIFICATION_TIMEOUT: 2500,
  AUDIO_VOLUME_BACKGROUND: 0.4,
  AUDIO_VOLUME_EFFECTS: 0.6
};

const gameKeyHandlers = {
  [KEY_CODES.PAUSE]: handlePauseControl,
  [KEY_CODES.RESTART]: handleRestartControl,
  [KEY_CODES.THEME]: switchTheme,
  [KEY_CODES.MUTE]: toggleMute,
  [KEY_CODES.HELP]: handleHelpControl
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
backgroundMusic.volume = GAME_CONSTANTS.AUDIO_VOLUME_BACKGROUND;

const stageClearAudio = new Audio("sounds/stage_clear.mp3");
stageClearAudio.volume = GAME_CONSTANTS.AUDIO_VOLUME_EFFECTS;

const rotateAudio = new Audio("sounds/rotate.mp3");
rotateAudio.volume = GAME_CONSTANTS.AUDIO_VOLUME_EFFECTS;

const collisionAudio = new Audio("sounds/collision.mp3");
collisionAudio.volume = GAME_CONSTANTS.AUDIO_VOLUME_EFFECTS;

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

const audios = [backgroundMusic, stageClearAudio, rotateAudio, collisionAudio];

// Consolidate Duplicate Conditional Fragments - função para tocar áudios com reset
function playAudioEffect(audio, shouldWarnOnError = true) {
  audio.currentTime = 0;
  if (shouldWarnOnError) {
    audio.play().catch((e) => console.warn("Audio bloqueado:", e));
  } else {
    audio.play();
  }
}

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
  updateMuteButtonUI();
}

// Função para atualizar a interface do botão de mudo
function updateMuteButtonUI() {
  const muteButton = document.getElementById("muteButton");
  const muteIcon = document.getElementById("muteIcon");

  if (muteButton && muteIcon) {
    if (isMuted) {
      muteButton.classList.add("muted");
      muteIcon.textContent = "🔇";
      muteButton.title = "Ligar Som";
    } else {
      muteButton.classList.remove("muted");
      muteIcon.textContent = "🔊";
      muteButton.title = "Desligar Som";
    }
  }
}

// Função para ser chamada pelo clique do botão
function toggleMuteButton() {
  toggleMute();
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
for (let r = 0; r < ROW; r++) {
  board[r] = [];
  for (let c = 0; c < COL; c++) {
    board[r][c] = "VACANT";
  }
}

// draw the board
function drawBoard() {
  for (let r = 0; r < ROW; r++) {
    for (let c = 0; c < COL; c++) {
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

  // Consolidate Duplicate Conditional Fragments - título comum
  elements.pauseTitle.textContent = "⏸️ PAUSADO";
  
  if (gameState.isAutoPaused) {
    elements.pauseMessage.innerHTML = `
      Janela perdeu foco<br>Pressione <span class="pause-key">P</span> para retomar<br><br>
      Pressione <span class="pause-key">R</span> para reiniciar
    `;
  } else if (gameState.isPaused) {
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

// #Extract Method
// Calcula o tempo de jogo formatado em MM:SS Refator #1 Jonathan
function calculateGameTime(startTime) {
  const gameEndTime = Date.now();
  const totalTime = Math.floor((gameEndTime - startTime) / 1000);
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// controlar modal de game over
function showGameOverModal() {
  const elements = getElements(["finalScore", "linesCleared", "gameTime"]);

  // Atualizar elementos
  elements.finalScore.textContent = gameState.score;
  elements.linesCleared.textContent = gameState.linesCleared;
  elements.gameTime.textContent = calculateGameTime(gameState.gameStartTime);

  showModal("gameOverModal");

  if (!isMuted) {
    const gameOverMusic = new Audio("sounds/game_over.mp3");
    gameOverMusic.volume = GAME_CONSTANTS.AUDIO_VOLUME_EFFECTS;
    pauseMusic();
    gameOverMusic.play().catch((e) => console.warn("Audio bloqueado:", e));
  }
}

function hideGameOverModal() {
  hideModal("gameOverModal");
}

// controlar modal de controles
function showControlsModal() {
  const controlsModalContent = document.getElementById("controlsModalContent");
  
  // Aplicar cores do tema atual
  if (controlsModalContent) {
    controlsModalContent.style.borderColor = currentTheme.ui.accent;
    controlsModalContent.style.boxShadow = `0 0 25px ${currentTheme.ui.accent}50`;
  }

  // Aplicar tema nas teclas de controle
  const controlKeys = document.querySelectorAll(".control-key");
  controlKeys.forEach((key) => {
    key.style.background = `linear-gradient(135deg, ${currentTheme.ui.accent}, ${currentTheme.ui.accent}cc)`;
  });

  showModal("controlsModal");
}

function hideControlsModal() {
  hideModal("controlsModal");
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
  const muteButton = document.getElementById("muteButton");
  const allDivs = document.querySelectorAll("div");
  const allLinks = document.querySelectorAll("a");
  const controlsHelpBtn = document.querySelector(".controls-help-btn");

  // Aplicar cor de fundo
  body.style.backgroundColor = currentTheme.ui.background;
  body.style.color = currentTheme.ui.text;

  // Aplicar cor do score especificamente
  if (scoreElement) {
    scoreElement.style.color = currentTheme.ui.score;
  }

  // Aplicar tema ao botão de mudo
  if (muteButton) {
    if (!isMuted) {
      muteButton.style.background = `linear-gradient(135deg, ${currentTheme.ui.accent}, ${adjustColorBrightness(currentTheme.ui.accent, -20)})`;
      muteButton.style.borderColor = "rgba(255, 255, 255, 0.3)";
      muteButton.style.boxShadow = `0 4px 12px ${currentTheme.ui.accent}40`;
    }
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

  // Aplicar tema no botão de controles
  if (controlsHelpBtn) {
    controlsHelpBtn.style.background = `linear-gradient(135deg, ${currentTheme.ui.accent}, ${currentTheme.ui.accent}cc)`;
    controlsHelpBtn.style.boxShadow = `0 2px 8px ${currentTheme.ui.accent}50`;
  }
}

// Função auxiliar para ajustar brilho de cores
function adjustColorBrightness(hex, percent) {
  // Remove o # se presente
  hex = hex.replace(/^#/, '');
  
  // Converte para RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Ajusta o brilho
  const newR = Math.round(Math.min(255, Math.max(0, r + (r * percent / 100))));
  const newG = Math.round(Math.min(255, Math.max(0, g + (g * percent / 100))));
  const newB = Math.round(Math.min(255, Math.max(0, b + (b * percent / 100))));
  
  // Converte de volta para hex
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

// Função para alternar tema
function switchTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % themeNames.length;
  currentTheme = THEMES[themeNames[currentThemeIndex]];

  // Aplicar cores da interface
  applyUITheme();

  // Redesenhar tudo com novo tema
  drawBoard();
  if (!gameState.gameOver && p) {
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
  }, GAME_CONSTANTS.THEME_NOTIFICATION_TIMEOUT);
}

// the pieces and their colors (agora usando tema dinâmico)
const PIECES = [
  [TETROMINOS.Z, "Z"],
  [TETROMINOS.S, "S"],
  [TETROMINOS.T, "T"],
  [TETROMINOS.O, "O"],
  [TETROMINOS.L, "L"],
  [TETROMINOS.I, "I"],
  [TETROMINOS.J, "J"],
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
  this.x = GAME_CONSTANTS.INITIAL_PIECE_X;
  this.y = GAME_CONSTANTS.INITIAL_PIECE_Y;
}

// fill function

Piece.prototype.fill = function (color) {
  for (let r = 0; r < this.activeTetromino.length; r++) {
    for (let c = 0; c < this.activeTetromino.length; c++) {
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

Piece.prototype.moveDown = async function () {
  if (!this.collision(0, 1, this.activeTetromino)) {
    this.unDraw();
    this.y++;
    this.draw();
  } else {
    // toca som de colisão se não estiver mutado
    if (!isMuted) {
      playAudioEffect(collisionAudio);
    }

    // travar peça e gerar nova
    await this.lock();
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

// #Decompose Conditional

// Verifica se a peça está perto da parede direita
function isNearRightWall(piece) {
  return piece.x > COL / 2;
}

// Verifica se a rotação causará colisão

function willCollideOnRotation(piece, pattern) {
  return piece.collision(0, 0, pattern);
}

// Verifica se a peça pode ser rotacionada
function canRotate(piece, kick, pattern) {
  return !piece.collision(kick, 0, pattern);
}

// Verifica se deve tocar som de rotação
function shouldPlayRotateSound(piece) {
  return piece.tetromino.length > 1;
}

// rotate the piece
Piece.prototype.rotate = function () {
  let nextPattern =
    this.tetromino[(this.tetrominoN + 1) % this.tetromino.length];
  let kick = 0;

  if (willCollideOnRotation(this, nextPattern)) {
    if (isNearRightWall(this)) {
      kick = -1; // Mover para esquerda
    } else {
      kick = 1; // Mover para direita
    }
  }

  if (canRotate(this, kick, nextPattern)) {
    this.unDraw();
    this.x += kick;
    this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length;
    this.activeTetromino = this.tetromino[this.tetrominoN];
    this.draw();

    return true;
  }
  return false;
};

let isLineClearing = false; // controla se está executando animação de limpeza

// ==========================================
// SISTEMA DE ANIMAÇÃO DE LIMPEZA DE LINHAS
// ==========================================

// Configurações da animação
const ANIMATION_CONFIG = {
  FLASH_DURATION: 300, // duração do flash em ms
  FLASH_COUNT: 3, // número de piscadas
  FADE_DURATION: 200, // duração do fade out em ms
  CLEAR_DELAY: 100 // delay antes de mover linhas para baixo
};

// Função para desenhar linha com efeito especial
function drawLineWithEffect(row, alpha = 1, effectColor = null) {
  for (let col = 0; col < COL; col++) {
    const color = effectColor || board[row][col];
    
    ctx.globalAlpha = alpha;
    
    // Se effectColor for especificado, usar cor destacada baseada no tema atual
    if (effectColor === '#FFFFFF') {
      // Usar cor de destaque do tema atual para o flash
      const flashColor = currentTheme.ui.accent;
      ctx.fillStyle = flashColor;
      ctx.fillRect(col * SQ, row * SQ, SQ, SQ);
      ctx.strokeStyle = currentTheme.stroke;
      ctx.strokeRect(col * SQ, row * SQ, SQ, SQ);
    } else {
      drawSquare(col, row, color);
    }
    
    ctx.globalAlpha = 1;
  }
}

// Função para criar efeito de flash na linha
function flashLine(row, flashCount = ANIMATION_CONFIG.FLASH_COUNT) {
  return new Promise(resolve => {
    let currentFlash = 0;
    const flashInterval = ANIMATION_CONFIG.FLASH_DURATION / (flashCount * 2);
    
    const flash = () => {
      if (currentFlash >= flashCount * 2) {
        resolve();
        return;
      }
      
      // Alternar entre cor destacada e normal
      const isHighlighted = currentFlash % 2 === 0;
      const effectColor = isHighlighted ? '#FFFFFF' : null;
      
      // Redesenhar apenas a linha específica
      drawLineWithEffect(row, 1, effectColor);
      
      currentFlash++;
      setTimeout(flash, flashInterval);
    };
    
    flash();
  });
}

// Função para criar efeito de fade out na linha
function fadeOutLine(row) {
  return new Promise(resolve => {
    const fadeSteps = GAME_CONSTANTS.FADE_STEPS;
    const fadeInterval = ANIMATION_CONFIG.FADE_DURATION / fadeSteps;
    let currentStep = 0;
    
    const fade = () => {
      if (currentStep >= fadeSteps) {
        resolve();
        return;
      }
      
      const alpha = 1 - (currentStep / fadeSteps);
      
      // Redesenhar linha com transparência
      drawLineWithEffect(row, alpha);
      
      currentStep++;
      setTimeout(fade, fadeInterval);
    };
    
    fade();
  });
}

// Função principal para animar limpeza de linhas
async function animateLineClearing(completedRows) {
  if (completedRows.length === 0) return;
  
  isLineClearing = true;
  
  // Fase 1: Flash em todas as linhas simultaneamente
  const flashPromises = completedRows.map(row => flashLine(row));
  await Promise.all(flashPromises);
  
  // Fase 2: Fade out em todas as linhas
  const fadePromises = completedRows.map(row => fadeOutLine(row));
  await Promise.all(fadePromises);
  
  // Pequeno delay antes de mover as linhas
  await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.CLEAR_DELAY));
  
  isLineClearing = false;
}

// #Extract Method + Introduce Explaining Variable

// Verifica se uma linha está completamente preenchida
function isRowComplete(rowIndex) {
  for (let col = 0; col < COL; col++) {
    if (board[rowIndex][col] === "VACANT") {
      return false;
    }
  }
  return true;
}

//  Move todas as linhas acima de uma posição para baixo
function moveRowsDown(rowIndex) {
  for (let row = rowIndex; row > GAME_CONSTANTS.BOARD_LIMIT_BOTTOM; row--) {
    for (let col = 0; col < COL; col++) {
      board[row][col] = board[row - 1][col];
    }
  }
  // Limpar linha superior
  for (let col = 0; col < COL; col++) {
    board[GAME_CONSTANTS.BOARD_LIMIT_TOP][col] = "VACANT";
  }
}

// Identifica quais linhas estão completas
function getCompletedRows() {
  const completedRows = [];
  for (let row = 0; row < ROW; row++) {
    if (isRowComplete(row)) {
      completedRows.push(row);
    }
  }
  return completedRows;
}

// Remove linhas específicas e move as superiores para baixo
function removeRows(rowsToRemove) {
  // Ordenar em ordem decrescente para remover de baixo para cima
  rowsToRemove.sort((a, b) => b - a);
  
  rowsToRemove.forEach(rowIndex => {
    moveRowsDown(rowIndex);
    gameState.score += GAME_CONSTANTS.POINTS_PER_LINE;
    gameState.linesCleared++;
  });
}

// Remove linhas completas e atualiza pontuação (versão assíncrona)
async function clearCompletedRows() {
  const completedRows = getCompletedRows();
  
  if (completedRows.length === 0) {
    return 0;
  }
  
  // Executar animação se linhas foram encontradas
  await animateLineClearing(completedRows);
  
  // Remover as linhas após a animação
  removeRows(completedRows);
  
  return completedRows.length;
}

Piece.prototype.lock = async function () {
  // Travar peça no tabuleiro
  for (let r = 0; r < this.activeTetromino.length; r++) {
    for (let c = 0; c < this.activeTetromino.length; c++) {
      if (!this.activeTetromino[r][c]) continue;

      const pieceRow = this.y + r;
      const pieceCol = this.x + c;

      // Game Over: peça está acima do tabuleiro visível
      if (pieceRow < 0) {
        gameState.gameOver = true;
        showGameOverModal();
        break;
      }

      board[pieceRow][pieceCol] = this.color;
    }
  }

  // Limpar linhas completas com animação
  const rowsCleared = await clearCompletedRows();

  // Tocar áudio se alguma linha foi limpa
  if (rowsCleared > 0 && !isMuted) {
    playAudioEffect(stageClearAudio);
  }

  drawBoard();
  scoreElement.innerHTML = gameState.score;
};

// collision function

Piece.prototype.collision = function (x, y, piece) {
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece.length; c++) {
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
      if (board[newY][newX] !== "VACANT") {
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
  if (!gameState.gameOver && !gameState.isPaused) {
    gameState.isWindowBlurred = true;
    gameState.isAutoPaused = true;
  }
});

window.addEventListener("focus", function () {
  // Janela recuperou foco - marcar que não está mais desfocada
  // mas manter pausado até o jogador pressionar P manualmente
  gameState.isWindowBlurred = false;
});

// #Consolidate Conditional Expression
function isGamePaused() {
  return gameState.isPaused || gameState.isAutoPaused;
}

// Despausar o jogo e retomar estado normal
function resumeGame() {
  gameState.isPaused = false;
  gameState.isAutoPaused = false;
  hidePauseModal();
  drawBoard();
  p.draw();
  playMusic();
}

//  Pausar o jogo manualmente
function pauseGame() {
  gameState.isPaused = true;
  showPauseModal();
  pauseMusic();
}

function handlePauseControl() {
  if (isGamePaused() && !gameState.gameOver) {
    resumeGame();
  } else if (!gameState.gameOver) {
    pauseGame();
  }
}

function handleRestartControl() {
  hidePauseModal();
  restartGame();
}

function handleHelpControl() {
  const controlsModal = document.getElementById("controlsModal");
  if (controlsModal.style.display === "block") {
    hideControlsModal();
  } else {
    showControlsModal();
  }
}

function handleMovementControls(keyCode) {
  if (keyCode === KEY_CODES.ARROW_LEFT) {
    p.moveLeft();
  } else if (keyCode === KEY_CODES.ARROW_UP) {
    const rotated = p.rotate();
    if (rotated && shouldPlayRotateSound(p) && !isMuted) {
      playAudioEffect(rotateAudio);
    }
  } else if (keyCode === KEY_CODES.ARROW_RIGHT) {
    p.moveRight();
  } else if (keyCode === KEY_CODES.ARROW_DOWN) {
    p.moveDown();
    gameState.dropStart = Date.now();
  }
}

function CONTROL(event) {
  const keyCode = event.keyCode;
  const gameHandler = gameKeyHandlers[keyCode];

  if (gameHandler) {
    gameHandler(); // Chama a função correspondente (ex: handlePauseControl)
    return;
  }
  
  // Só permite outros controles se o jogo não estiver pausado ou limpando linhas
  if (isGamePaused() || gameState.gameOver || isLineClearing) {
    return;
  }

  // Controles de movimento
  handleMovementControls(event.keyCode);
}

// drop the piece every 1sec

// Game State Parameter Object
const gameState = {
  dropStart: Date.now(),
  gameStartTime: Date.now(),
  dropInterval: GAME_SPEED.INITIAL_DROP_INTERVAL,
  gameOver: false,
  isPaused: false,
  isWindowBlurred: false,
  isAutoPaused: false,
  linesCleared: 0,
  score: 0
};

function updateDropInterval() {
  const speedReduction =
    Math.floor(gameState.score / GAME_SPEED.SPEED_INCREASE_THRESHOLD) *
    GAME_SPEED.SPEED_INCREASE_AMOUNT;
  gameState.dropInterval = Math.max(
    GAME_SPEED.MIN_DROP_INTERVAL,
    GAME_SPEED.INITIAL_DROP_INTERVAL - speedReduction
  );
}

function drop() {
  let now = Date.now();
  let delta = now - gameState.dropStart;

  // Só move a peça se o jogo não estiver pausado e não estiver limpando linhas
  if (!isGamePaused() && !isLineClearing && delta > GAME_SPEED.INITIAL_DROP_INTERVAL) {
    p.moveDown();
    gameState.dropStart = Date.now();
  }

  // Se o jogo estiver pausado, resetar o contador para evitar queda rápida ao despausar
  if (isGamePaused() && !gameState.gameOver) {
    gameState.dropStart = Date.now();
    // Mostrar modal de pausa
    showPauseModal();
    if (!backgroundMusic.paused) backgroundMusic.pause();
  }

  if (!gameState.gameOver) {
    requestAnimationFrame(drop);
  }
}

// Aplicar tema inicial
applyUITheme();
updateMuteButtonUI();
drop();

// função para reiniciar o jogo
function restartGame() {
  // Resetar variáveis do jogo
  gameState.gameOver = false;
  gameState.isPaused = false;
  gameState.isAutoPaused = false;
  gameState.isWindowBlurred = false;
  isLineClearing = false;
  gameState.score = 0;
  gameState.linesCleared = 0;
  gameState.dropStart = Date.now();
  gameState.gameStartTime = Date.now();

  // Limpar o board
  for (let r = 0; r < ROW; r++) {
    for (let c = 0; c < COL; c++) {
      board[r][c] = "VACANT";
    }
  }

  // Gerar nova peça
  p = randomPiece();

  // Redesenhar o board e a peça
  drawBoard();
  p.draw();

  // Atualizar pontuação na tela
  scoreElement.innerHTML = gameState.score;

  // Esconder modal de Game Over
  hideGameOverModal();

  // Aplicar tema atual
  applyUITheme();
  if (!isMuted) {
    playAudioEffect(backgroundMusic, false);
  }
  // Reiniciar o loop do jogo
  drop();
}
