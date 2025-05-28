console.log('Ballers game script loaded');

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

// DOM elements - declare globally but don't assign yet
let boardElement;
let timerElement;
let turnIndicatorElement;
let gameOverModal;
let resignButton;

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

// Initialize the game board
function initializeBoard() {
    board = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place initial pieces
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                if (row < 3) {
                    board[row][col] = { color: 'black', isKing: false };
                } else if (row > 4) {
                    board[row][col] = { color: 'red', isKing: false };
                }
            }
        }
    }
}

// Create the visual board
function createBoard() {
    boardElement.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = `cell ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (board[row][col]) {
                const piece = createPiece(board[row][col], row, col);
                cell.appendChild(piece);
            }
            
            boardElement.appendChild(cell);
        }
    }
}

// Create a game piece
function createPiece(piece, row, col) {
    const pieceElement = document.createElement('div');
    pieceElement.className = `piece ${piece.color}${piece.isKing ? ' king' : ''}`;
    pieceElement.draggable = piece.color === 'red';
    pieceElement.dataset.row = row;
    pieceElement.dataset.col = col;
    
    if (piece.color === 'red') {
        pieceElement.addEventListener('dragstart', handleDragStart);
        pieceElement.addEventListener('dragend', handleDragEnd);
        pieceElement.addEventListener('click', handlePieceClick);
    }
    
    return pieceElement;
}

// Find all possible capture sequences for a piece
function findCaptureSequences(row, col, color) {
    const sequences = new Set(); // Use Set to avoid duplicate end positions
    const piece = board[row][col];
    if (!piece || piece.color !== color) return [];

    function findSequence(currentRow, currentCol, sequence = [], capturedPieces = new Set()) {
        const captures = findPieceCaptures(currentRow, currentCol, color);
        
        // If we've made at least one capture, add this position as a possible end point
        if (sequence.length > 0) {
            sequences.add(JSON.stringify({
                path: sequence,
                row: currentRow,
                col: currentCol,
                capturedPieces: Array.from(capturedPieces)
            }));
        }

        // Continue exploring more captures if available
        captures.forEach(capture => {
            const captureKey = `${capture.capturedRow},${capture.capturedCol}`;
            // Only proceed if we haven't captured this piece in this sequence
            if (!capturedPieces.has(captureKey)) {
                // Create new sets/arrays for this branch of captures
                const newCaptured = new Set(capturedPieces);
                newCaptured.add(captureKey);
                const newSequence = [...sequence, {
                    from: { row: currentRow, col: currentCol },
                    to: { row: capture.row, col: capture.col },
                    captured: { row: capture.capturedRow, col: capture.capturedCol }
                }];

                // Temporarily update board state
                const tempPiece = board[currentRow][currentCol];
                const tempCaptured = board[capture.capturedRow][capture.capturedCol];
                board[currentRow][currentCol] = null;
                board[capture.capturedRow][capture.capturedCol] = null;
                board[capture.row][capture.col] = tempPiece;

                // Recursively find more captures
                findSequence(capture.row, capture.col, newSequence, newCaptured);

                // Restore board state
                board[currentRow][currentCol] = tempPiece;
                board[capture.capturedRow][capture.capturedCol] = tempCaptured;
                board[capture.row][capture.col] = null;
            }
        });

        // If this is the starting position and we have immediate captures
        // add them as single-capture sequences
        if (sequence.length === 0 && captures.length > 0) {
            captures.forEach(capture => {
                const singleSequence = [{
                    from: { row: currentRow, col: currentCol },
                    to: { row: capture.row, col: capture.col },
                    captured: { row: capture.capturedRow, col: capture.capturedCol }
                }];
                sequences.add(JSON.stringify({
                    path: singleSequence,
                    row: capture.row,
                    col: capture.col,
                    capturedPieces: [`${capture.capturedRow},${capture.capturedCol}`]
                }));
            });
        }
    }

    findSequence(row, col);
    return Array.from(sequences).map(s => JSON.parse(s));
}

// Show possible moves for a piece
function showPossibleMoves(row, col) {
    clearMoveIndicators();
    
    const piece = board[row][col];
    if (!piece || piece.color !== currentPlayer) return;

    // Check for capture sequences
    const captureSequences = findCaptureSequences(row, col, currentPlayer);
    
    if (captureSequences.length > 0) {
        // Show all possible end positions for captures
        captureSequences.forEach(sequence => {
            const cell = document.querySelector(`[data-row="${sequence.row}"][data-col="${sequence.col}"]`);
            if (cell) {
                cell.classList.add('capture-move');
                
                // Add data attributes to store capture sequence information
                cell.dataset.captureSequence = JSON.stringify(sequence);
            }
        });
        
        // Debug log to show all possible sequences
        console.log('Available capture sequences:', captureSequences);
    } else {
        // If no captures, show regular moves
        const moves = findRegularMoves(row, col);
        moves.forEach(move => {
            const cell = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (cell) cell.classList.add('possible-move');
        });
    }
}

// Clear move indicators
function clearMoveIndicators() {
    document.querySelectorAll('.possible-move, .capture-move').forEach(cell => {
        cell.classList.remove('possible-move', 'capture-move');
    });
}

// Handle piece click
function handlePieceClick(e) {
    if (currentPlayer === 'red') {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        // Check if there are mandatory captures
        const allCaptures = findAllCaptures('red');
        console.log('Available captures:', allCaptures); // Debug log
        
        if (allCaptures.length > 0) {
            // Check if this piece has any captures
            const hasCapture = allCaptures.some(capture => 
                capture.fromRow === row && capture.fromCol === col
            );
            
            if (hasCapture) {
                showPossibleMoves(row, col);
            } else {
                clearMoveIndicators();
            }
        } else {
            showPossibleMoves(row, col);
        }
    }
}

// Find regular moves for a piece
function findRegularMoves(row, col) {
    const moves = [];
    const piece = board[row][col];
    if (!piece) return moves;

    // Define move directions based on piece type and color
    let directions;
    if (piece.isKing) {
        directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]]; // Kings move in all directions
    } else if (piece.color === 'red') {
        directions = [[-1, 1], [-1, -1]]; // Red pieces move upward
    } else {
        directions = [[1, 1], [1, -1]]; // Black pieces move downward
    }

    directions.forEach(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;
        if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
            moves.push({ row: newRow, col: newCol });
        }
    });

    return moves;
}

// Handle drag start with mandatory capture check
function handleDragStart(e) {
    if (currentPlayer === 'red') {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        // Check if there are mandatory captures
        const allCaptures = findAllCaptures('red');
        
        if (allCaptures.length > 0) {
            // Only allow dragging pieces that can capture
            const pieceCaptures = findPieceCaptures(row, col, 'red');
            if (pieceCaptures.length > 0) {
                selectedPiece = { element: e.target, row, col };
                e.target.classList.add('dragging');
                mustCapture = true;
                showPossibleMoves(row, col);
            } else {
                e.preventDefault();
            }
        } else {
            selectedPiece = { element: e.target, row, col };
            e.target.classList.add('dragging');
            mustCapture = false;
            showPossibleMoves(row, col);
        }
    } else {
        e.preventDefault();
    }
}

// Find all captures for a color
function findAllCaptures(color) {
    const allCaptures = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece?.color === color) {
                const pieceCaptures = findPieceCaptures(row, col, color);
                if (pieceCaptures.length > 0) {
                    allCaptures.push({
                        fromRow: row,
                        fromCol: col,
                        captures: pieceCaptures
                    });
                }
            }
        }
    }
    return allCaptures;
}

// Find captures for a specific piece
function findPieceCaptures(row, col, color) {
    const captures = [];
    const piece = board[row][col];
    if (!piece) return captures;

    // Define capture directions based on piece type and color
    let directions;
    if (piece.isKing) {
        directions = [[2, 2], [2, -2], [-2, 2], [-2, -2]]; // Kings can capture in all directions
    } else if (color === 'red') {
        directions = [[-2, 2], [-2, -2]]; // Red pieces capture upward
    } else {
        directions = [[2, 2], [2, -2]]; // Black pieces capture downward
    }

    directions.forEach(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        // Check if the landing square is valid and empty
        if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
            const midRow = row + dRow/2;
            const midCol = col + dCol/2;
            const capturedPiece = board[midRow][midCol];
            
            // Check if there's an opponent's piece to capture
            if (capturedPiece && capturedPiece.color !== color) {
                captures.push({ 
                    row: newRow, 
                    col: newCol, 
                    capturedRow: midRow, 
                    capturedCol: midCol 
                });
            }
        }
    });
    
    return captures;
}

// Check if position is within board boundaries
function isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Handle drag end
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    clearMoveIndicators();
}

// Add drop zone functionality
function setupDropZones() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('dragover', e => e.preventDefault());
        cell.addEventListener('drop', handleDrop);
    });
}

// Handle piece drop
function handleDrop(e) {
    if (isGameOver) return;
    e.preventDefault();
    if (currentPlayer !== 'red' || !selectedPiece) return;
    
    const targetCell = e.target.closest('.cell');
    const targetRow = parseInt(targetCell.dataset.row);
    const targetCol = parseInt(targetCell.dataset.col);
    
    // Get all possible moves including capture sequences
    const captureSequences = findCaptureSequences(selectedPiece.row, selectedPiece.col, currentPlayer);
    const regularMoves = findRegularMoves(selectedPiece.row, selectedPiece.col);
    
    // Find the specific capture sequence that leads to this position
    const validCapture = captureSequences.find(seq => seq.row === targetRow && seq.col === targetCol);
    const validRegularMove = captureSequences.length === 0 && 
        regularMoves.some(move => move.row === targetRow && move.col === targetCol);
    
    if (validCapture || validRegularMove) {
        const piece = board[selectedPiece.row][selectedPiece.col];
        
        if (validCapture) {
            // Execute the entire capture sequence
            validCapture.path.forEach(move => {
                // Remove the captured piece
                board[move.captured.row][move.captured.col] = null;
                
                // Move the piece to its new position
                board[move.from.row][move.from.col] = null;
                board[move.to.row][move.to.col] = piece;
            });
        } else {
            // Regular move
            board[selectedPiece.row][selectedPiece.col] = null;
            board[targetRow][targetCol] = piece;
        }
        
        // Check for king promotion
        if (targetRow === 0 && piece.color === 'red') {
            piece.isKing = true;
        }
        
        // Switch turns
        switchTurn();
        createBoard();
        setupDropZones();
        
        if (currentPlayer === 'black') {
            setTimeout(makeAIMove, 500);
        }
    }

    checkGameState();
}

// Check for missed captures before AI move
function checkForMissedCaptures() {
    const allCaptures = findAllCaptures('red');
    if (allCaptures.length > 0) {
        // Store the piece that missed the capture
        const piece = allCaptures[0];
        missedCapture = {
            row: piece.row,
            col: piece.col
        };
        // AI will remove this piece in its next move
        return true;
    }
    return false;
}

// Make AI move
function makeAIMove() {
    if (isGameOver) return;
    let bestMove = null;
    let maxCaptures = 0;
    
    // Check all pieces for their best capture sequences
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col]?.color === 'black') {
                const sequences = findCaptureSequences(row, col, 'black');
                sequences.forEach(sequence => {
                    if (sequence.capturedPieces.length > maxCaptures) {
                        maxCaptures = sequence.capturedPieces.length;
                        bestMove = {
                            fromRow: row,
                            fromCol: col,
                            ...sequence
                        };
                    }
                });
            }
        }
    }
    
    // If no captures available, find regular moves
    if (!bestMove) {
        const regularMoves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col]?.color === 'black') {
                    const moves = findRegularMoves(row, col);
                    moves.forEach(move => {
                        regularMoves.push({
                            fromRow: row,
                            fromCol: col,
                            row: move.row,
                            col: move.col
                        });
                    });
                }
            }
        }
        if (regularMoves.length > 0) {
            bestMove = regularMoves[Math.floor(Math.random() * regularMoves.length)];
        }
    }
    
    if (bestMove) {
        const piece = board[bestMove.fromRow][bestMove.fromCol];
        
        // Execute captures if any
        if (bestMove.capturedPieces) {
            bestMove.capturedPieces.forEach(pos => {
                const [row, col] = pos.split(',').map(Number);
                board[row][col] = null;
            });
        }
        
        // Move piece to final position
        board[bestMove.fromRow][bestMove.fromCol] = null;
        
        // Check for king promotion
        if (bestMove.row === 7) {
            piece.isKing = true;
        }
        
        board[bestMove.row][bestMove.col] = piece;
        
        switchTurn();
        createBoard();
        setupDropZones();
    }

    checkGameState();
}

// Switch turns and reset timer
function switchTurn() {
    currentPlayer = currentPlayer === 'red' ? 'black' : 'red';
    turnIndicatorElement.textContent = currentPlayer === 'red' ? 'Your Turn' : 'AI Thinking...';
    if (currentPlayer === 'red') {
        resetTimer();
    } else {
        clearInterval(timerInterval);
        timerElement.textContent = '---';
    }

    checkGameState();
}

// Timer functions
function startTimer() {
    timer = 10;
    updateTimerDisplay();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer -= 0.1;
        if (timer <= 0) {
            timer = 0;
            clearInterval(timerInterval);
            if (currentPlayer === 'red' && !isGameOver) {
                endGame('Time\'s Up - AI Wins!');
            }
        }
        updateTimerDisplay();
    }, 100);
}

function resetTimer() {
    startTimer();
}

function updateTimerDisplay() {
    timerElement.textContent = timer.toFixed(1);
    timerElement.classList.toggle('warning', timer <= 3);
}

// Initialize the game
function initGame() {
    initializeBoard();
    createBoard();
    setupDropZones();
    startTimer();
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Assign DOM elements
    boardElement = document.getElementById('board');
    timerElement = document.getElementById('timer');
    turnIndicatorElement = document.getElementById('turnIndicator');

    if (!boardElement || !timerElement || !turnIndicatorElement) {
        console.error('Required DOM elements not found');
        return;
    }

    // Create game over modal
    gameOverModal = document.createElement('div');
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

    // Create resign button
    resignButton = document.createElement('button');
    resignButton.className = 'resign-button';
    resignButton.textContent = 'Resign';
    document.querySelector('.info-panel').appendChild(resignButton);

    // Add event listeners
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

// Add function to check for available moves
function hasAvailableMoves(color) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece?.color === color) {
                const captures = findCaptureSequences(row, col, color);
                const moves = findRegularMoves(row, col);
                if (captures.length > 0 || moves.length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Add function to count pieces
function countPieces(color) {
    let count = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col]?.color === color) {
                count++;
            }
        }
    }
    return count;
}

// Add function to end the game
function endGame(message = 'Game Over') {
    isGameOver = true;
    clearInterval(timerInterval);
    gameOverModal.querySelector('h2').textContent = message;
    gameOverModal.classList.add('active');
}

// Add game state check after each move
function checkGameState() {
    if (isGameOver) return;

    const redPieces = countPieces('red');
    const blackPieces = countPieces('black');

    if (redPieces === 0) {
        endGame('AI Wins!');
        return;
    }

    if (blackPieces === 0) {
        endGame('You Win!');
        return;
    }

    const currentColor = currentPlayer;
    if (!hasAvailableMoves(currentColor)) {
        endGame(currentColor === 'red' ? 'AI Wins!' : 'You Win!');
        return;
    }
} 
