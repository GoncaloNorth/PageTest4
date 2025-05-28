const canvas1 = document.getElementById('playerCanvas');
const ctx1 = canvas1.getContext('2d');
const canvas2 = document.getElementById('botCanvas');
const ctx2 = canvas2.getContext('2d');

let sharedPipes = [];
const spawnInterval = 140;
let globalFrame = 0;

class Game {
  constructor(ctx, isBot = false, control = 'keyboard') {
    this.ctx = ctx;
    this.isBot = isBot;
    this.control = control;
    this.reset();
    this.bindControls();
  }

  bindControls() {
    if (this.control === 'keyboard') {
      document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
          if (!this.gameOver) {
            this.ball.vy = this.lift;
          } else if (playerGame.gameOver && botGame.gameOver) {
            sharedPipes = [];
            globalFrame = 0;
            playerGame.reset();
            botGame.reset();
          }
        }
      });
    } else if (this.control === 'mouse') {
      document.addEventListener('mousedown', () => {
        if (!this.gameOver) {
          this.ball.vy = this.lift;
        }
      });
    }
  }

  reset() {
    this.ball = { x: 50, y: 150, vy: 0, r: 9 };
    this.gravity = 0.4;
    this.lift = -6.5;
    this.score = 0;
    this.frame = 0;
    this.pipeIndex = 0;
    this.localPipes = [];
    this.gameOver = false;
  }

  drawBall() {
    this.ctx.fillStyle = '#e53935';
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawPipe(pipe) {
    this.ctx.fillStyle = '#42a5f5';
    this.ctx.fillRect(pipe.x, 0, pipe.w, pipe.top);
    this.ctx.fillRect(pipe.x, pipe.top + pipe.gap, pipe.w, canvas1.height - pipe.top - pipe.gap);
  }

  update() {
    if (this.gameOver) return;

    this.frame++;
    this.ball.vy += this.gravity;
    this.ball.y += this.ball.vy;

    if (this.ball.y + this.ball.r > canvas1.height || this.ball.y - this.ball.r < 0) {
      this.gameOver = true;
    }

    if (this.pipeIndex < sharedPipes.length) {
      const shared = sharedPipes[this.pipeIndex];
      if (shared.frame === this.frame) {
        this.localPipes.push({ ...shared });
        this.pipeIndex++;
      }
    }

    this.localPipes.forEach(pipe => {
      pipe.x -= 2;
      if (this.ball.x > pipe.x + pipe.w && !pipe.passed) {
        pipe.passed = true;
        this.score++;
      }

      if (
        this.ball.x + this.ball.r > pipe.x &&
        this.ball.x - this.ball.r < pipe.x + pipe.w &&
        (
          this.ball.y - this.ball.r < pipe.top ||
          this.ball.y + this.ball.r > pipe.top + pipe.gap
        )
      ) {
        this.gameOver = true;
      }
    });

    this.localPipes = this.localPipes.filter(pipe => pipe.x + pipe.w > 0);
  }

  draw() {
    this.ctx.clearRect(0, 0, canvas1.width, canvas1.height);
    this.drawBall();
    this.localPipes.forEach(pipe => this.drawPipe(pipe));
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText(`Score: ${this.score}`, 10, 20);
    if (this.gameOver) {
      this.ctx.fillText('Game Over', 80, 256);
    }
  }

  loop() {
    this.update();
    this.draw();
  }
}

function generateSharedPipes() {
  globalFrame++;
  if (globalFrame % spawnInterval === 0) {
    const gap = 120;
    const top = Math.floor(Math.random() * (canvas1.height - gap - 40)) + 20;
    sharedPipes.push({ x: canvas1.width, top, w: 40, gap, frame: globalFrame });
  }
}

const playerGame = new Game(ctx1, false, 'keyboard');
const botGame = new Game(ctx2, false, 'mouse');

function gameLoop() {
  generateSharedPipes();
  playerGame.loop();
  botGame.loop();
  requestAnimationFrame(gameLoop);
}

gameLoop(); 
