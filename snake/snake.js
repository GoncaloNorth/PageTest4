// Get the canvas elements and their contexts
const canvas1 = document.getElementById('gameCanvas1');
const canvas2 = document.getElementById('gameCanvas2');
const ctx1 = canvas1.getContext('2d');
const ctx2 = canvas2.getContext('2d');

// Game constants
const gridSize = 20;
const tileCount = 20;
const gameSpeed = 150; // Controls snake speed (higher = slower)
const framesPerMove = 10; // Number of frames to interpolate between moves
let currentFrame = 0;

// Initialize game state
let gameRunning = true;
let score1 = 0;
let score2 = 0;
let lastTime = 0;
let player1Lost = false;
let player2Lost = false;

// Snake 1 (WASD controls)
const snake1 = {
    x: Math.floor(tileCount / 4),
    y: Math.floor(tileCount / 2),
    dx: 1,
    dy: 0,
    cells: [{x: Math.floor(tileCount / 4), y: Math.floor(tileCount / 2)}],
    maxCells: 4,
    active: true,
    lastX: Math.floor(tileCount / 4),
    lastY: Math.floor(tileCount / 2)
};

// Snake 2 (Arrow controls)
const snake2 = {
    x: Math.floor(3 * tileCount / 4),
    y: Math.floor(tileCount / 2),
    dx: -1,
    dy: 0,
    cells: [{x: Math.floor(3 * tileCount / 4), y: Math.floor(tileCount / 2)}],
    maxCells: 4,
    active: true,
    lastX: Math.floor(3 * tileCount / 4),
    lastY: Math.floor(tileCount / 2)
};

// Food objects
const food1 = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};

const food2 = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};

// Event listeners for controls
document.addEventListener('keydown', function(e) {
    // Snake 1 (WASD)
    if (e.key === 'w' && snake1.dy === 0) {
        snake1.dy = -1;
        snake1.dx = 0;
    }
    else if (e.key === 's' && snake1.dy === 0) {
        snake1.dy = 1;
        snake1.dx = 0;
    }
    else if (e.key === 'a' && snake1.dx === 0) {
        snake1.dy = 0;
        snake1.dx = -1;
    }
    else if (e.key === 'd' && snake1.dx === 0) {
        snake1.dy = 0;
        snake1.dx = 1;
    }

    // Snake 2 (Arrow keys)
    if (e.key === 'ArrowUp' && snake2.dy === 0) {
        snake2.dy = -1;
        snake2.dx = 0;
    }
    else if (e.key === 'ArrowDown' && snake2.dy === 0) {
        snake2.dy = 1;
        snake2.dx = 0;
    }
    else if (e.key === 'ArrowLeft' && snake2.dx === 0) {
        snake2.dy = 0;
        snake2.dx = -1;
    }
    else if (e.key === 'ArrowRight' && snake2.dx === 0) {
        snake2.dy = 0;
        snake2.dx = 1;
    }
});

function getRandomFood(snake) {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        // Check if the new food position overlaps with the snake
        var overlap = false;
        for (let cell of snake.cells) {
            if (cell.x === newFood.x && cell.y === newFood.y) {
                overlap = true;
                break;
            }
        }
    } while (overlap);
    return newFood;
}

function drawGame(currentTime) {
    // Control game speed
    if (currentTime - lastTime < gameSpeed / framesPerMove) {
        requestAnimationFrame(drawGame);
        return;
    }
    lastTime = currentTime;

    // Clear canvases
    ctx1.fillStyle = '#2a2a2a';
    ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
    ctx2.fillStyle = '#2a2a2a';
    ctx2.fillRect(0, 0, canvas2.width, canvas2.height);

    currentFrame = (currentFrame + 1) % framesPerMove;
    
    if (currentFrame === 0) {
        // Move snakes on frame 0
        if (snake1.active) moveSnake(snake1);
        if (snake2.active) moveSnake(snake2);
        checkCollisions();
    }

    // Draw everything with interpolation
    if (snake1.active) drawSnake(ctx1, snake1, '#00ff00', currentFrame / framesPerMove);
    if (snake2.active) drawSnake(ctx2, snake2, '#0000ff', currentFrame / framesPerMove);
    drawFood();

    // Draw "LOST" message if needed
    if (!snake1.active) drawLostMessage(ctx1);
    if (!snake2.active) drawLostMessage(ctx2);

    // Check if both players have lost
    if (player1Lost && player2Lost) {
        showFinalGameOver();
    } else {
        requestAnimationFrame(drawGame);
    }
}

function drawSnake(ctx, snake, color, interpolation) {
    ctx.fillStyle = color;
    
    // Calculate interpolated positions for all segments
    const positions = [];
    for (let i = 0; i < snake.cells.length; i++) {
        const cell = snake.cells[i];
        if (i === 0) {
            // Head position is interpolated between last and current position
            positions.push({
                x: (cell.lastX + (cell.x - cell.lastX) * interpolation) * gridSize,
                y: (cell.lastY + (cell.y - cell.lastY) * interpolation) * gridSize
            });
        } else {
            // Body segments follow the path of the segment in front of them
            const prevCell = snake.cells[i - 1];
            const progress = Math.max(0, interpolation - 0.1 * i); // Delayed follow effect
            positions.push({
                x: (cell.x + (prevCell.x - cell.x) * progress) * gridSize,
                y: (cell.y + (prevCell.y - cell.y) * progress) * gridSize
            });
        }
    }

    // Draw the snake body
    for (let i = positions.length - 1; i >= 0; i--) {
        const pos = positions[i];
        
        // For head, use slightly darker color
        if (i === 0) {
            ctx.fillStyle = color.replace('ff', 'cc');
        } else {
            ctx.fillStyle = color;
        }

        // Draw the segment
        ctx.fillRect(pos.x, pos.y, gridSize - 1, gridSize - 1);

        // If not the last segment, draw connection to next segment
        if (i < positions.length - 1) {
            const nextPos = positions[i + 1];
            const dx = nextPos.x - pos.x;
            const dy = nextPos.y - pos.y;

            // Draw connecting rectangle between segments
            if (dx !== 0) {
                // Horizontal connection
                ctx.fillRect(
                    Math.min(pos.x, nextPos.x),
                    pos.y,
                    Math.abs(dx) + gridSize - 1,
                    gridSize - 1
                );
            } else if (dy !== 0) {
                // Vertical connection
                ctx.fillRect(
                    pos.x,
                    Math.min(pos.y, nextPos.y),
                    gridSize - 1,
                    Math.abs(dy) + gridSize - 1
                );
            }
        }
    }
}

function drawFood() {
    // Draw circular food
    [
        {ctx: ctx1, food: food1},
        {ctx: ctx2, food: food2}
    ].forEach(({ctx, food}) => {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize/2,
            food.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

function drawLostMessage(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas1.width, 60);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOST', canvas1.width/2, 30);
}

function moveSnake(snake) {
    // Store last position for interpolation
    snake.lastX = snake.x;
    snake.lastY = snake.y;

    // Update position
    snake.x += snake.dx;
    snake.y += snake.dy;

    // Check wall collision
    if (snake.x < 0 || snake.x >= tileCount || snake.y < 0 || snake.y >= tileCount) {
        if (snake === snake1) {
            player1Lost = true;
            snake1.active = false;
        } else {
            player2Lost = true;
            snake2.active = false;
        }
        return;
    }

    // Check for self collision
    for (let i = 1; i < snake.cells.length; i++) {
        if (snake.x === snake.cells[i].x && snake.y === snake.cells[i].y) {
            if (snake === snake1) {
                player1Lost = true;
                snake1.active = false;
            } else {
                player2Lost = true;
                snake2.active = false;
            }
            return;
        }
    }

    // Update snake cells with position history
    const newCell = {
        x: snake.x,
        y: snake.y,
        lastX: snake.lastX,
        lastY: snake.lastY
    };

    // Update position history for all cells
    snake.cells.unshift(newCell);
    if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
    }

    // Update last positions for remaining cells
    for (let i = 1; i < snake.cells.length; i++) {
        snake.cells[i].lastX = snake.cells[i].x;
        snake.cells[i].lastY = snake.cells[i].y;
    }
}

function checkCollisions() {
    // Check for food collision
    if (snake1.active && snake1.x === food1.x && snake1.y === food1.y) {
        snake1.maxCells++;
        score1++;
        document.getElementById('score1').textContent = score1;
        Object.assign(food1, getRandomFood(snake1));
    }

    if (snake2.active && snake2.x === food2.x && snake2.y === food2.y) {
        snake2.maxCells++;
        score2++;
        document.getElementById('score2').textContent = score2;
        Object.assign(food2, getRandomFood(snake2));
    }
}

function showFinalGameOver() {
    gameRunning = false;
    
    // Create an overlay div for the game over screen
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    overlay.style.padding = '40px';
    overlay.style.borderRadius = '10px';
    overlay.style.textAlign = 'center';
    overlay.style.color = 'white';
    overlay.style.zIndex = '1000';

    // Determine the winner
    let winnerText;
    if (score1 > score2) {
        winnerText = 'Player 1 Won!';
    } else if (score2 > score1) {
        winnerText = 'Player 2 Won!';
    } else {
        winnerText = "It's a Tie!";
    }

    overlay.innerHTML = `
        <h2 style="font-size: 32px; margin-bottom: 20px;">${winnerText}</h2>
        <p style="font-size: 20px; margin-bottom: 30px;">Final Score: ${score1} - ${score2}</p>
        <div style="display: flex; justify-content: center; gap: 20px;">
            <button onclick="window.location.href='/'" style="padding: 10px 20px; font-size: 18px; background: #4CAF50; border: none; color: white; cursor: pointer; border-radius: 5px;">Home</button>
            <button onclick="resetGame(); document.body.removeChild(this.parentElement.parentElement);" style="padding: 10px 20px; font-size: 18px; background: #2196F3; border: none; color: white; cursor: pointer; border-radius: 5px;">Rematch</button>
        </div>
    `;

    document.body.appendChild(overlay);
}

function resetGame() {
    // Reset snake 1
    snake1.x = Math.floor(tileCount / 4);
    snake1.y = Math.floor(tileCount / 2);
    snake1.lastX = snake1.x;
    snake1.lastY = snake1.y;
    snake1.cells = [{x: snake1.x, y: snake1.y, lastX: snake1.x, lastY: snake1.y}];
    snake1.maxCells = 4;
    snake1.dx = 1;
    snake1.dy = 0;
    snake1.active = true;

    // Reset snake 2
    snake2.x = Math.floor(3 * tileCount / 4);
    snake2.y = Math.floor(tileCount / 2);
    snake2.lastX = snake2.x;
    snake2.lastY = snake2.y;
    snake2.cells = [{x: snake2.x, y: snake2.y, lastX: snake2.x, lastY: snake2.y}];
    snake2.maxCells = 4;
    snake2.dx = -1;
    snake2.dy = 0;
    snake2.active = true;

    // Reset scores and states
    score1 = 0;
    score2 = 0;
    player1Lost = false;
    player2Lost = false;
    currentFrame = 0;
    document.getElementById('score1').textContent = '0';
    document.getElementById('score2').textContent = '0';

    // Reset food
    Object.assign(food1, getRandomFood(snake1));
    Object.assign(food2, getRandomFood(snake2));

    // Reset game state
    gameRunning = true;
    lastTime = 0;

    // Restart game loop
    requestAnimationFrame(drawGame);
}

// Initialize the game
resetGame(); 
