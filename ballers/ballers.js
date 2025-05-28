// Game state variables - keep these outside
let board = [];
let currentPlayer = 'red';
let selectedPiece = null;
let timer = 10;
let timerInterval;
let mustCapture = false;
let lastCapturingPiece = null;
let missedCapture = null;
let isGameOver = false;

// Keep all the functions defined outside
// ... existing code for all functions ...

// Wrap the initialization and DOM manipulation in DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const boardElement = document.getElementById('board');
    const timerElement = document.getElementById('timer');
    const turnIndicatorElement = document.getElementById('turnIndicator');

    // Create and append game over modal
    const gameOverModal = document.createElement('div');
    gameOverModal.className = 'game-over-modal';
    gameOverModal.innerHTML = `
        <div class="game-over-content">
            <h2>Game Over</h2>
            <div class="game-over-buttons">
                <button class="rematch-btn">Rematch</button>
                <button class="home-btn">Go Home</button>
            </div>
        </div>
    `;
    document.querySelector('.game-container').appendChild(gameOverModal);

    // Add resign button
    const resignButton = document.createElement('button');
    resignButton.className = 'resign-button';
    resignButton.textContent = 'Resign';
    document.querySelector('.info-panel').appendChild(resignButton);

    // Add styles to the head
    const styles = document.createElement('style');
    styles.textContent = `
        .game-over-modal {
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.85);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            z-index: 1000;
            text-align: center;
            min-width: 300px;
            pointer-events: auto;
        }

        .game-over-modal.active {
            display: block;
        }

        .game-over-content h2 {
            color: white;
            font-size: 2em;
            margin-bottom: 20px;
            text-transform: uppercase;
            font-weight: bold;
            font-family: 'Roboto', sans-serif;
        }

        .game-over-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
        }

        .game-over-buttons button {
            padding: 10px 20px;
            font-size: 1em;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            font-weight: bold;
            font-family: 'Roboto', sans-serif;
        }

        .rematch-btn {
            background: #4CAF50;
            color: white;
        }

        .home-btn {
            background: #2196F3;
            color: white;
        }

        .game-over-buttons button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        .resign-button {
            margin-top: 10px;
            padding: 8px 16px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            text-transform: uppercase;
            transition: all 0.3s ease;
            font-family: 'Roboto', sans-serif;
        }

        .resign-button:hover {
            background: #d32f2f;
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(styles);

    // Add event listeners for the buttons
    gameOverModal.querySelector('.rematch-btn').addEventListener('click', () => {
        gameOverModal.classList.remove('active');
        isGameOver = false;
        initGame();
    });

    gameOverModal.querySelector('.home-btn').addEventListener('click', () => {
        window.location.href = '/';
    });

    resignButton.addEventListener('click', () => {
        endGame('AI Wins!');
    });

    // Start the game
    initGame();
});

// ... rest of your existing code ...
