// --- Imports ---
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise'); // Using 'mysql2' for async/await
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

// --- Configuration ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-very-secret-key'; // Change this in production
const SALT_ROUNDS = 10;

// --- Middleware ---
// --- Middleware ---
app.use(cors());
app.use(express.json()); // To parse JSON request bodies

// --- Serve static files ---  <-- ADD THIS SECTION
// This tells Express to serve any files found in the '../dist' folder
app.use(express.static(path.join(__dirname, '../dist')));
// --- Database Connection (Mock) ---
// We create a connection pool. All DB logic will use this.
const dbPool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'battleship_db', // The database you created
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Enable stored procedure calls
    multipleStatements: true 
});

// A helper map to find a user's socket by their PlayerID
const playerSocketMap = new Map();

/*
================================================================================
HTTP API (Express)
Handles non-real-time actions: Auth & Leaderboard
================================================================================
*/

/**
 * 1. User Registration
 * Calls the `sp_RegisterPlayer` stored procedure
 */
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Use `CALL` to execute the stored procedure
        await dbPool.query('CALL sp_RegisterPlayer(?, ?)', [username, passwordHash]);
        
        res.status(201).json({ message: 'Player registered successfully.' });
    } catch (error) {
        // 'ER_DUP_ENTRY' is a common MySQL error for unique constraint violations
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username already taken.' });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

/**
 * 2. User Login
 * Checks password and generates a JSON Web Token (JWT)
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // Get the player from the Players table
        const [rows] = await dbPool.query('SELECT PlayerID, PasswordHash FROM Players WHERE Username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const player = rows[0];

        // Check the password
        const match = await bcrypt.compare(password, player.PasswordHash);
        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Update player's online status
        await dbPool.query('UPDATE Players SET IsOnline = 1 WHERE PlayerID = ?', [player.PlayerID]);

        // Create a JWT
        const token = jwt.sign(
            { PlayerID: player.PlayerID, Username: username },
            JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
        );

        res.json({ message: 'Login successful', token });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

/**
 * 3. Get Leaderboard
 * Safely queries the `V_Leaderboard` view
 */
app.get('/api/leaderboard', async (req, res) => {
    try {
        // Query the VIEW we created
        const [rows] = await dbPool.query('SELECT Username, TotalWins FROM V_Leaderboard');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


/*
================================================================================
REAL-TIME GAME (Socket.io)
Handles all live game logic: Matchmaking, Ship Placement, Moves
================================================================================
*/

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log(`User connected with socket ID: ${socket.id}`);

    let authenticatedPlayerID = null;

    // 1. Authenticate the socket connection
    // The client must send its token immediately after connecting
    socket.on('authenticate', (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            authenticatedPlayerID = decoded.PlayerID;
            
            // Map PlayerID to socket ID for easy lookup
            playerSocketMap.set(authenticatedPlayerID, socket.id);
            socket.emit('authenticated');
            console.log(`Player ${authenticatedPlayerID} authenticated.`);
            
        } catch (err) {
            socket.emit('unauthorized', 'Invalid token');
            socket.disconnect();
        }
    });

    // 2. Find a Match
    // This replaces your Firebase queue. It calls `sp_FindMatch`
    socket.on('matchmaking.find', async () => {
        if (!authenticatedPlayerID) return socket.emit('unauthorized', 'Not authenticated');

        try {
            // `sp_FindMatch` will add to queue, or find a match and create a game
            // It needs to return the GameID and opponent's ID if a match is made
            console.log(authenticatedPlayerID)
            // socket.emit('match.found');
            const [[[result]]] = await dbPool.query('CALL sp_FindMatch(?)', [authenticatedPlayerID]);
            console.log(result);
            if (result.GameID) {
                const gameID = result.GameID;
                const opponentID = result.OpponentID;

                // Join both players to the same "room"
                socket.join(gameID);
                const opponentSocketID = playerSocketMap.get(opponentID);
                console.log(authenticatedPlayerID,"opp:",opponentSocketID);
                if (opponentSocketID) {
                    const opponentSocket = io.sockets.sockets.get(opponentSocketID);
                    opponentSocket.join(gameID);
                    
                    // Tell both players the match is found
                    io.to(gameID).emit('match.found', { 
                        GameID: gameID,
                        CurrentTurnPlayerID: result.CurrentTurnPlayerID,
                        // OpponentID: opponentID,
                        // playerID: authenticatedPlayerID
                    });
                }
            } else {
                // No match found, player is just in the queue
                socket.emit('matchmaking.waiting');
            }
        } catch (error) {
            socket.emit('error', 'Matchmaking failed: ' + error.message);
        }
    });

    // 3. Place Ships
    // Receives all ship placements at once from the client
    socket.on('game.placeShips', async ({ gameID, ships }) => {
        if (!authenticatedPlayerID) return socket.emit('unauthorized', 'Not authenticated');

        try {
            // Client should send `ships` as an array:
            // [ { x: 1, y: 1, type: 'Carrier' }, { x: 1, y: 2, type: 'Carrier' }, ... ]
            
            // Use a transaction to insert all ship parts
            const conn = await dbPool.getConnection();
            await conn.beginTransaction();

            const query = 'INSERT INTO ShipPlacements (GameID, PlayerID, X_Coord, Y_Coord, ShipType) VALUES ?';
            const values = ships.map(part => [gameID, authenticatedPlayerID, part.x, part.y, part.type]);
            await conn.query(query, [values]);
            
            // Now, call the SP to confirm placement
            // The trigger `tr_CheckGameStart` will fire automatically in the DB
            await conn.query('CALL sp_ConfirmShipPlacement(?, ?)', [gameID, authenticatedPlayerID]);
            
            await conn.commit();
            conn.release();


            // Check if the game state has updated to 'InProgress'
            const [[game]] = await dbPool.query('SELECT GameState FROM Games WHERE GameID = ?', [gameID]);
            if (game.GameState === 'InProgress') {
                io.to(gameID).emit('game.start', { OpponentID:getOpponentID(gameID, authenticatedPlayerID) });
            }

        } catch (error) {
            socket.emit('error', 'Failed to place ships: ' + error.message);
        }
    });
    function getOpponentID(gameID, playerID) {
        const [res]=dbPool.query(
            `SELECT PlayerID FROM Player_Games WHERE GameID = ? AND PlayerID != ?`,
            [gameID, playerID]
        ).then(([rows]) => {
            if (rows.length > 0) {
                return rows[0].PlayerID;
            }
            throw new Error('Opponent not found');
        });
        console.log(res)
        return res
    }

    // 4. Make a Move
    socket.on('game.move', async ({ gameID, x, y }) => {
        console.log(authenticatedPlayerID)
        if (!authenticatedPlayerID) return socket.emit('unauthorized', 'Not authenticated');

        try {
            // Call the `sp_MakeMove` procedure
            // We assume this SP returns the result and checks for win state
            const [[result]] = await dbPool.query('CALL sp_MakeMove(?, ?, ?, ?)', [gameID, authenticatedPlayerID, x, y]);
            console.log("move result:",result);
            // `result` might be: { Result: 'Hit', DefendingPlayerID: 12, GameState: 'InProgress' }
            // or { Result: 'Win', DefendingPlayerID: 12, GameState: 'Completed' }
            console.log(result);
            // Emit the move result to everyone in the game room
            io.to(gameID).emit('game.move.result', {
                AttackingPlayerID: authenticatedPlayerID,
                DefendingPlayerID: result.DefendingPlayerID,
                x,
                y,
                Result: result.Result, // 'Hit', 'Miss'
            });

            // Check if the game is over
            // The `tr_CheckForWin` and `tr_UpdateLeaderboard` triggers
            // will have already fired in the database.
            if (result.GameState === 'Completed') {
                io.to(gameID).emit('game.over', {
                    WinnerID: authenticatedPlayerID
                });
            }

        } catch (error) {
            // e.g., "Not your turn", "Invalid move"
            socket.emit('error', 'Move failed: ' + error.message);
        }
    });

    // 5. Handle Disconnect
    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.id}`);
        if (authenticatedPlayerID) {
            playerSocketMap.delete(authenticatedPlayerID);
            try {
                // Set player to offline
                await dbPool.query('UPDATE Players SET IsOnline = 0 WHERE PlayerID = ?', [authenticatedPlayerID]);
                
                // --- Handle game forfeiture ---
                // Find any active game this player is in
                const [[game]] = await dbPool.query(
                    `SELECT g.GameID, pg.PlayerID as OpponentID
                     FROM Games g
                     JOIN Player_Games pg ON g.GameID = pg.GameID
                     WHERE g.GameState = 'InProgress' 
                       AND pg.PlayerID != ?
                       AND g.GameID IN (SELECT GameID FROM Player_Games WHERE PlayerID = ?)`,
                    [authenticatedPlayerID, authenticatedPlayerID]
                );

                if (game) {
                    // Forfeit the game
                    await dbPool.query(
                        `UPDATE Games SET GameState = 'Completed', WinnerID = ?, EndTime = NOW() WHERE GameID = ?`,
                        [game.OpponentID, game.GameID]
                    );
                    // The `tr_UpdateLeaderboard` trigger will handle the win count.
                    io.to(game.GameID).emit('game.opponent.left', { WinnerID: game.OpponentID });
                }

            } catch (error) {
                console.error('Error on disconnect:', error.message);
            }
        }
    });
});

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});