const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Set canvas size
canvas.width = 800;
canvas.height = 400;

// Game objects
const paddleWidth = 10;
const paddleHeight = 60;
const ballSize = 8;

// Game state
let playerScore = 0;
let computerScore = 0;
let gameStarted = false;

// Paddle positions
const player = {
    y: canvas.height / 2 - paddleHeight / 2,
    speed: 0,
    moveSpeed: 5
};

const computer = {
    y: canvas.height / 2 - paddleHeight / 2,
    speed: 4
};

// Ball properties
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    speedX: 5,
    speedY: 5,
    reset: function() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speedX = 5 * (Math.random() > 0.5 ? 1 : -1);
        this.speedY = 5 * (Math.random() > 0.5 ? 1 : -1);
    }
};

// Event listeners for paddle movement
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        player.speed = -player.moveSpeed;
    } else if (e.key === 'ArrowDown') {
        player.speed = player.moveSpeed;
    } else if (e.key === ' ' && !gameStarted) {
        gameStarted = true;
        ball.reset();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' && player.speed < 0) {
        player.speed = 0;
    } else if (e.key === 'ArrowDown' && player.speed > 0) {
        player.speed = 0;
    }
});

// Game loop
function update() {
    // Move player paddle
    player.y += player.speed;
    player.y = Math.max(0, Math.min(canvas.height - paddleHeight, player.y));

    if (gameStarted) {
        // Move ball
        ball.x += ball.speedX;
        ball.y += ball.speedY;

        // Ball collision with top and bottom
        if (ball.y <= 0 || ball.y >= canvas.height) {
            ball.speedY = -ball.speedY;
        }

        // Ball collision with paddles
        if (ball.x <= paddleWidth && ball.y >= player.y && ball.y <= player.y + paddleHeight) {
            ball.speedX = -ball.speedX;
            ball.speedX *= 1.1; // Increase speed slightly
        }

        if (ball.x >= canvas.width - paddleWidth && ball.y >= computer.y && ball.y <= computer.y + paddleHeight) {
            ball.speedX = -ball.speedX;
            ball.speedX *= 1.1; // Increase speed slightly
        }

        // Computer AI
        const computerCenter = computer.y + paddleHeight / 2;
        if (computerCenter < ball.y - 35) {
            computer.y += computer.speed;
        } else if (computerCenter > ball.y + 35) {
            computer.y -= computer.speed;
        }

        // Score points
        if (ball.x <= 0) {
            computerScore++;
            updateScore();
            gameStarted = false;
        } else if (ball.x >= canvas.width) {
            playerScore++;
            updateScore();
            gameStarted = false;
        }
    }

    // Draw everything
    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    scoreElement.textContent = `${playerScore} - ${computerScore}`;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = 'white';
    ctx.fillRect(0, player.y, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, computer.y, paddleWidth, paddleHeight);

    // Draw ball
    if (gameStarted) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballSize, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Show "Press SPACE to start" message
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2);
    }
}

// Start the game loop
update(); 
