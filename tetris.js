const cvs = document.getElementById("tetris");
const ctx = cvs.getContext("2d");
const scoreElement = document.getElementById("score");

const ROW = 20;
const COL = (COLUMN = 10);
const SQ = (squareSize = 20);
const VACANT = "WHITE"; // color of an empty square

// draw a square
function drawSquare(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * SQ, y * SQ, SQ, SQ);

  ctx.strokeStyle = "BLACK";
  ctx.strokeRect(x * SQ, y * SQ, SQ, SQ);
}

// create the board

let board = [];
for (r = 0; r < ROW; r++) {
  board[r] = [];
  for (c = 0; c < COL; c++) {
    board[r][c] = VACANT;
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
  const modal = document.getElementById("pauseModal");
  const title = document.getElementById("pauseTitle");
  const message = document.getElementById("pauseMessage");

  if (isAutoPaused) {
    title.textContent = "JOGO PAUSADO";
    message.innerHTML =
      'Janela perdeu foco<br>Pressione <span class="pause-key">P</span> para retomar';
  } else if (isPaused) {
    title.textContent = "JOGO PAUSADO";
    message.innerHTML =
      'Pressione <span class="pause-key">P</span> para continuar';
  }

  modal.style.display = "block";
}

function hidePauseModal() {
  const modal = document.getElementById("pauseModal");
  modal.style.display = "none";
}

// controlar modal de game over
function showGameOverModal() {
  const modal = document.getElementById("gameOverModal");
  const finalScoreElement = document.getElementById("finalScore");
  const linesClearedElement = document.getElementById("linesCleared");
  const gameTimeElement = document.getElementById("gameTime");

  // Calcular tempo de jogo
  const gameEndTime = Date.now();
  const totalTime = Math.floor((gameEndTime - gameStartTime) / 1000);
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Atualizar elementos
  finalScoreElement.textContent = score;
  linesClearedElement.textContent = linesCleared;
  gameTimeElement.textContent = timeString;

  modal.style.display = "block";
}

function hideGameOverModal() {
  const modal = document.getElementById("gameOverModal");
  modal.style.display = "none";
}

drawBoard();

// the pieces and their colors

const PIECES = [
  [Z, "red"],
  [S, "green"],
  [T, "yellow"],
  [O, "blue"],
  [L, "purple"],
  [I, "cyan"],
  [J, "orange"],
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
  this.fill(VACANT);
};

// move Down the piece

Piece.prototype.moveDown = function () {
  if (!this.collision(0, 1, this.activeTetromino)) {
    this.unDraw();
    this.y++;
    this.draw();
  } else {
    // we lock the piece and generate a new one
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
  }
};

let score = 0;

Piece.prototype.lock = function () {
  for (r = 0; r < this.activeTetromino.length; r++) {
    for (c = 0; c < this.activeTetromino.length; c++) {
      // we skip the vacant squares
      if (!this.activeTetromino[r][c]) {
        continue;
      }
      // pieces to lock on top = game over
      if (this.y + r < 0) {
        // Parar o jogo e mostrar modal de Game Over
        gameOver = true;
        showGameOverModal();
        break;
      }
      // we lock the piece
      board[this.y + r][this.x + c] = this.color;
    }
  }
  // remove full rows
  for (r = 0; r < ROW; r++) {
    let isRowFull = true;
    for (c = 0; c < COL; c++) {
      isRowFull = isRowFull && board[r][c] != VACANT;
    }
    if (isRowFull) {
      // if the row is full
      // we move down all the rows above it
      for (y = r; y > 1; y--) {
        for (c = 0; c < COL; c++) {
          board[y][c] = board[y - 1][c];
        }
      }
      // the top row board[0][..] has no row above it
      for (c = 0; c < COL; c++) {
        board[0][c] = VACANT;
      }
      // increment the score and line counter
      score += 10;
      linesCleared++;
    }
  }
  // update the board
  drawBoard();

  // update the score
  scoreElement.innerHTML = score;
};

// collision fucntion

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
      if (board[newY][newX] != VACANT) {
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
  // Tecla P (keyCode 80) - Pausar/Despausar o jogo
  if (event.keyCode == 80) {
    if (isPaused) {
      // Despausar jogo (pausa manual)
      isPaused = false;
      // Esconder modal e redesenhar o jogo
      hidePauseModal();
      drawBoard();
      p.draw();
    } else if (isAutoPaused) {
      // Retomar após pausa automática
      isAutoPaused = false;
      // Esconder modal e redesenhar o jogo
      hidePauseModal();
      drawBoard();
      p.draw();
    } else {
      // Pausar manualmente
      isPaused = true;
      showPauseModal();
    }
    return; // Não executa outros controles quando pausando/despausando
  }

  // Só permite outros controles se o jogo não estiver pausado
  if (isPaused || isAutoPaused) {
    return;
  }

  if (event.keyCode == 37) {
    p.moveLeft();
    dropStart = Date.now();
  } else if (event.keyCode == 38) {
    p.rotate();
    dropStart = Date.now();
  } else if (event.keyCode == 39) {
    p.moveRight();
    dropStart = Date.now();
  } else if (event.keyCode == 40) {
    p.moveDown();
  }
}

// drop the piece every 1sec

let dropStart = Date.now();
let gameStartTime = Date.now(); // tempo de início do jogo
let gameOver = false;
let isPaused = false; // controla pausa manual
let isWindowBlurred = false; // controla se janela perdeu foco
let isAutoPaused = false; // controla se está pausado automaticamente
let linesCleared = 0; // contador de linhas limpas
function drop() {
  let now = Date.now();
  let delta = now - dropStart;

  // Só move a peça se o jogo não estiver pausado (manual ou automaticamente)
  if (!isPaused && !isAutoPaused && delta > 1000) {
    p.moveDown();
    dropStart = Date.now();
  }

  // Se o jogo estiver pausado, resetar o contador para evitar queda rápida ao despausar
  if (isPaused || isAutoPaused) {
    dropStart = Date.now();
    // Mostrar modal de pausa
    showPauseModal();
  }

  if (!gameOver) {
    requestAnimationFrame(drop);
  }
}

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
      board[r][c] = VACANT;
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

  // Reiniciar o loop do jogo
  drop();
}
