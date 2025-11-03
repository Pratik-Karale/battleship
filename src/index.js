import "./style.css"
// Import socket.io client
import { io } from "socket.io-client"

// Keep your existing game logic imports
import { matchComputer } from "./matchComp";
import { mainMenu } from "./domHandler";
import { Board } from "./gameBoard"
import { BoardElem, placeShipMenu, gameAlert } from "./domHandler"
import { Player } from "./player"
import { utils } from "./utils"
// Note: Firebase imports are all removed

// --- Configuration ---
const SERVER_URL = "http://localhost:3000"; // URL of your server.js
let socket;

// --- Global State Variables ---
let authToken = localStorage.getItem('token'); // Store token in local storage
let player = null; // Will hold the player object
let gameID = null; // Will hold the current GameID
let currentPlayerID = null; // Will hold the ID of the player whose turn it is
let myPlayerID = null; // Will hold this client's PlayerID

// --- Main App Container ---
// We'll append different "screens" to this
const appContainer = document.createElement('div');
appContainer.id = 'app-container';
document.body.appendChild(appContainer);

// ===================================================================
// 1. AUTHENTICATION & INITIALIZATION
// ===================================================================

/**
 * Handles user login
 */
async function login(username, password) {
    try {
        const response = await fetch(`${SERVER_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message);
        }

        // --- FIX: Destructure PlayerID from the response ---
        const { token, PlayerID } = await response.json();
        localStorage.setItem('token', token);
        authToken = token;
        
        // --- FIX: Set the global PlayerID variable ---
        myPlayerID = PlayerID; 

        initializeSocket();
        showMainMenu();
        
    } catch (error) {
        gameAlert(`Login Failed: ${error.message}`);
    }
}

/**
 * Handles user registration
 */
async function register(username, password) {
    try {
        const response = await fetch(`${SERVER_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message);
        }

        gameAlert('Registration successful! Please log in.');
        showLoginScreen(); // Go back to login
        
    } catch (error) {
        gameAlert(`Registration Failed: ${error.message}`);
    }
}

// ===================================================================
// ✨ NEW FUNCTION: FETCH PLAYER ID
// ===================================================================

/**
 * Fetches the PlayerID using the stored authToken.
 * This assumes your server has a protected endpoint like /api/me 
 * that returns { PlayerID: '...' } when given a valid token.
 */
async function fetchPlayerID(token) {
    try {
        const response = await fetch(`${SERVER_URL}/api/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        return data.PlayerID; // Server should return { PlayerID: '...' }
    } catch (error) {
        console.error('Error fetching PlayerID:', error);
        return null;
    }
}


/**
 * Connects to the Socket.io server and authenticates
 */
function initializeSocket() {
    socket = io(SERVER_URL);

    // --- Setup all our game event listeners ONCE ---
    setupSocketListeners();

    // Authenticate the socket connection using our token
    socket.on('connect', () => {
        console.log('Connected to server, authenticating...');
        socket.emit('authenticate', authToken);
    });

    socket.on('authenticated', () => {
        console.log('Socket authenticated successfully.');
        // If myPlayerID is null here, it will be set by initializeApp
    });

    socket.on('unauthorized', (msg) => {
        console.error('Socket authentication failed:', msg);
        gameAlert('Session error. Please log in again.');
        localStorage.removeItem('token');
        showLoginScreen();
    });

    socket.on('error', (msg) => {
        console.error('Server error:', msg);
        gameAlert(`Error: ${msg}`);
    });
}

/**
 * Checks if the user is already logged in on page load
 */
async function initializeApp() {
    if (authToken) {
        // --- MODIFIED: Fetch Player ID before initializing socket and UI ---
        myPlayerID = await fetchPlayerID(authToken);
        
        if (myPlayerID) {
            initializeSocket();
            showMainMenu();
        } else {
            // Token might be expired or invalid
            localStorage.removeItem('token');
            authToken = null;
            gameAlert('Session expired. Please log in.');
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
}

// ===================================================================
// 2. UI MANAGEMENT (New Functions)
// ===================================================================

/**
 * Clears the screen and shows the login form
 * (You must build this HTML)
 */
function showLoginScreen() {
    appContainer.innerHTML = ''; // Clear the screen
    
    // --- Mock Login Form (Replace with your own HTML) ---
    const loginDiv = document.createElement('div');
    loginDiv.innerHTML = `
        <h3>Login</h3>
        <input type="text" id="loginUser" placeholder="Username" />
        <input type="password" id="loginPass" placeholder="Password" />
        <button id="loginBtn">Login</button>
        <hr>
        <h3>Register</h3>
        <input type="text" id="regUser" placeholder="Username" />
        <input type="password" id="regPass" placeholder="Password" />
        <button id="regBtn">Register</button>
    `;
    appContainer.appendChild(loginDiv);

    document.getElementById('loginBtn').onclick = () => {
        const user = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        login(user, pass);
    };
    
    document.getElementById('regBtn').onclick = () => {
        const user = document.getElementById('regUser').value;
        const pass = document.getElementById('regPass').value;
        register(user, pass);
    };
}

/**
 * Clears the screen and shows the main game menu
 */
function showMainMenu() {
    appContainer.innerHTML = ''; // Clear the screen
    
    // This is your original mainMenu logic, but the multiplayer
    // function is now powered by Socket.io
    const gameMainMenu = mainMenu(
        matchComputer.start, // "Play vs. Computer" - still works, it's client-side
        startOnlineMatchmaking  // "Play Online" - now points to our new function
    );
    appContainer.appendChild(gameMainMenu);
}

// ===================================================================
// 3. MULTIPLAYER LOGIC (Refactored)
// ===================================================================

/**
 * Called when the "Play Online" button is clicked.
 * Replaces all the Firebase "create/join" logic.
 */
function startOnlineMatchmaking() {
    appContainer.innerHTML = ''; // Clear the screen

    // Show waiting screen
    const waitingScreen = document.createElement("div");
    waitingScreen.innerText = "WAITING FOR OPPONENT...";
    appContainer.appendChild(waitingScreen);

    // Tell the server we want to find a match
    console.log("Emitting 'matchmaking.find'");
    // setInterval(() => {
        socket.emit('matchmaking.find');
    // }, 5000);
}

/**
 * Sets up all the listeners for real-time game events from the server.
 */
function setupSocketListeners() {
    
    // Server has found a match
    socket.on('match.found', (data) => { 
        console.log('Match found!', data);
        gameID = data.GameID; // Save the GameID
        
        currentPlayerID = data.CurrentTurnPlayerID;
        console.log("My PlayerID:", myPlayerID, "Current Turn PlayerID:", currentPlayerID);

        // --- Start placing ships ---
        appContainer.innerHTML = ''; // Clear waiting screen
        const BOARD_SIZE = 10;
        
        player = new Player(Board(BOARD_SIZE));
        // player.index = ... (we don't need index, we use PlayerID)
        player.boardElem = BoardElem("Player", player.board.state);
        appContainer.appendChild(player.boardElem);

        const placeMenu = placeShipMenu(player.board, player.boardElem);
        appContainer.appendChild(placeMenu);

        // Check if player has placed all the ships
        const startGameInterval = setInterval(() => {
            if (document.body.contains(placeMenu)) return;
            
            // Player is done. Send ship placements to server.
            // const shipParts = player.board.state.shipParts.map(part => {
            //     return { x: part[0], y: part[1], type: 'unknown' }; // Type isn't in state, simplified
            // });
            // A better way: get ships from player.board.ships
            // For now, this is a placeholder. Your 'placeShipMenu' needs to populate
            // the 'player.board' correctly.
            
            // Re-get ship parts from the board object
            const allShips = [];
            
            player.board.boardActual.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell.isHit !== undefined) { // It's a ship part
                        // This logic needs to be better, depends on your 'Ship' object
                        // Assuming board stores the *type* or a reference
                        allShips.push({ x, y, type: 'Ship' });
                    }
                });
            });

            console.log("Sending ship placements...", allShips);
            socket.emit('game.placeShips', { gameID, ships: allShips });

            clearInterval(startGameInterval);
        }, 300);
    });

    // Both players have placed ships, game is starting
    socket.on('game.start', (data) => {
        console.log('Game is starting!', data);
        // data might contain enemyID, etc.
        gameAlert("Game Started!");
        startMultiplayerGame(player, data.OpponentID);
    });

    // Result of a move (yours or opponent's)
    socket.on('game.move.result', (data) => {
        const { AttackingPlayerID, x, y, Result } = data;
        console.log('currentPlayerID:', currentPlayerID, 'myPlayerID:', myPlayerID);
        console.log(`Move result received: Player ${AttackingPlayerID} attacked [${x},${y}] => ${Result}`);
        if (AttackingPlayerID === myPlayerID) {
            // This was *my* move
            console.log(`My attack at [${x},${y}] was a ${Result}`);
            enemy.board.recieveAttack(x, y, Result); // Update enemy board visually
            enemy.boardElem.update();
        } else {
            // This was the *enemy's* move
            console.log(`Enemy attack at [${x},${y}] was a ${Result}`);
            player.board.recieveAttack(x, y); // Update my board
            player.boardElem.update();
            if (player.board.isAllSunk()) {
                // We don't need this, server will tell us 'game.over'
                // gameAlert("You LOSE!",()=>window.location='/')
            }
        }
        
        // Handle turn change
        if (Result === 'Miss') {
            // Turn switches
            currentPlayerID = (currentPlayerID === myPlayerID) ? data.DefendingPlayerID : myPlayerID;
        }
        // If 'Hit', turn stays the same.
        updateTurnUI();
    });

    // Game is over
    socket.on('game.over', (data) => {
        const { WinnerID } = data;
        if (WinnerID === myPlayerID) {
            gameAlert("You WON!", () => window.location = "/");
        } else {
            gameAlert("You LOSE!", () => window.location = "/");
        }
    });
    
    // Opponent disconnected
    socket.on('game.opponent.left', (data) => {
        gameAlert("Opponent disconnected. You WIN!", () => window.location = "/");
    });
}

/**
 * Renders the enemy board and sets up turn UI.
 * Replaces the old `startMultiplayerGame`.
 */
function startMultiplayerGame(player, opponentID) {
    // We already have our own board, just need the enemy's
    window.enemy = new Player(Board(10)); // 'enemy' is global for the listener
    enemy.id = opponentID; // Store opponent's ID
    
    enemy.boardElem = BoardElem("Enemy", enemy.board.state, true);
    appContainer.appendChild(enemy.boardElem);

    // Add click listeners to the enemy board
    enemy.boardElem.tileElems.forEach(tileElem => {
        tileElem.addEventListener("click", () => {
            if (currentPlayerID !== myPlayerID) {
                gameAlert("Not your turn!");
                return; // Not our turn
            }
            
            const tileCoords = tileElem.getAttribute("data-coords").split(",");
            const [x, y] = tileCoords.map(Number);
            
            if (!enemy.board.isTileEmpty(x, y)) {
                gameAlert("Already attacked here!");
                return; // Already shot here
            }

            // Client no longer processes the attack
            // It just sends the move to the server
            console.log(`Emitting 'game.move' at [${x},${y}]`);
            socket.emit('game.move', { gameID, x, y });
        });
    });
    
    // Set initial turn UI
    updateTurnUI();
}

/**
 * Helper function to update UI based on whose turn it is
 */
function updateTurnUI() {
    const myBoardTitle = document.querySelectorAll("h3")[0];
    const enemyBoardTitle = document.querySelectorAll("h3")[1];
    
    const myContainer = document.querySelectorAll(".player-container")[0];
    const enemyContainer = document.querySelectorAll(".player-container")[1];

    if (currentPlayerID === myPlayerID) {
        myBoardTitle.classList.add("current-player-title");
        enemyBoardTitle.classList.remove("current-player-title");
        enemyContainer.classList.add("under-attack");
        myContainer.classList.remove("under-attack");
    } else {
        enemyBoardTitle.classList.add("current-player-title");
        myBoardTitle.classList.remove("current-player-title");
        myContainer.classList.add("under-attack");
        enemyContainer.classList.remove("under-attack");
    }
}


// ===================================================================
// 4. START THE APP
// ===================================================================

initializeApp();