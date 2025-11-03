-- Creates the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS battleship_db;
USE battleship_db;

-- ----------------------------
-- 1. TABLE CREATION
-- ----------------------------

-- Table: Players
-- Stores all user account info and win counts
DROP TABLE IF EXISTS Players;
CREATE TABLE Players (
    PlayerID INT AUTO_INCREMENT,
    Username VARCHAR(50) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    TotalWins INT NOT NULL DEFAULT 0,
    IsOnline BOOLEAN NOT NULL DEFAULT 0,
    PRIMARY KEY (PlayerID),
    UNIQUE KEY (Username)
);

-- Table: Games
-- Stores the state of a single game session
DROP TABLE IF EXISTS Games;
CREATE TABLE Games (
    GameID INT AUTO_INCREMENT,
    GameState VARCHAR(20) NOT NULL DEFAULT 'PlacingShips', -- PlacingShips, InProgress, Completed
    CurrentTurnPlayerID INT,
    WinnerID INT,
    StartTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    EndTime DATETIME,
    PRIMARY KEY (GameID),
    FOREIGN KEY (CurrentTurnPlayerID) REFERENCES Players(PlayerID) ON DELETE SET NULL,
    FOREIGN KEY (WinnerID) REFERENCES Players(PlayerID) ON DELETE SET NULL
);

-- Table: Player_Games
-- Junction table linking players to their games
DROP TABLE IF EXISTS Player_Games;
CREATE TABLE Player_Games (
    GameID INT NOT NULL,
    PlayerID INT NOT NULL,
    HasPlacedShips BOOLEAN NOT NULL DEFAULT 0,
    PRIMARY KEY (GameID, PlayerID),
    FOREIGN KEY (GameID) REFERENCES Games(GameID) ON DELETE CASCADE,
    FOREIGN KEY (PlayerID) REFERENCES Players(PlayerID) ON DELETE CASCADE
);

-- Table: ShipPlacements
-- Stores the location and state of every ship segment
DROP TABLE IF EXISTS ShipPlacements;
CREATE TABLE ShipPlacements (
    GameID INT NOT NULL,
    PlayerID INT NOT NULL,
    X_Coord INT NOT NULL,
    Y_Coord INT NOT NULL,
    ShipType VARCHAR(20) NOT NULL,
    IsHit BOOLEAN NOT NULL DEFAULT 0,
    PRIMARY KEY (GameID, PlayerID, X_Coord, Y_Coord),
    FOREIGN KEY (GameID) REFERENCES Games(GameID) ON DELETE CASCADE,
    FOREIGN KEY (PlayerID) REFERENCES Players(PlayerID) ON DELETE CASCADE
);

-- Table: Moves
-- Logs every shot taken in every game
DROP TABLE IF EXISTS Moves;
CREATE TABLE Moves (
    MoveID INT AUTO_INCREMENT,
    GameID INT NOT NULL,
    AttackingPlayerID INT NOT NULL,
    TargetX INT NOT NULL,
    TargetY INT NOT NULL,
    Result VARCHAR(4) NOT NULL, -- 'Hit' or 'Miss'
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (MoveID),
    FOREIGN KEY (GameID) REFERENCES Games(GameID) ON DELETE CASCADE,
    FOREIGN KEY (AttackingPlayerID) REFERENCES Players(PlayerID) ON DELETE CASCADE,
    UNIQUE KEY (GameID, AttackingPlayerID, TargetX, TargetY) -- Prevent shooting same square twice
);

-- Table: MatchmakingQueue
-- Holds players waiting for a game
DROP TABLE IF EXISTS MatchmakingQueue;
CREATE TABLE MatchmakingQueue (
    PlayerID INT NOT NULL,
    EntryTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PlayerID),
    FOREIGN KEY (PlayerID) REFERENCES Players(PlayerID) ON DELETE CASCADE
);

-- ----------------------------
-- 2. VIEW CREATION
-- ----------------------------

-- View: V_Leaderboard
-- A virtual table for displaying the leaderboard
DROP VIEW IF EXISTS V_Leaderboard;
CREATE VIEW V_Leaderboard AS
SELECT
    Username,
    TotalWins
FROM
    Players
ORDER BY
    TotalWins DESC;

-- ----------------------------
-- 3. STORED PROCEDURES
-- ----------------------------

-- DELIMITER is used to change the end-of-statement character
-- so we can use semicolons (;) inside the procedures
DELIMITER //

-- Procedure: sp_RegisterPlayer
-- Safely inserts a new player, handling duplicate usernames
DROP PROCEDURE IF EXISTS sp_RegisterPlayer;
CREATE PROCEDURE sp_RegisterPlayer(
    IN p_Username VARCHAR(50),
    IN p_PasswordHash VARCHAR(255)
)
BEGIN
    -- This will fail and throw an error if Username is not unique,
    -- which is caught by the server.js's try/catch block.
    INSERT INTO Players (Username, PasswordHash)
    VALUES (p_Username, p_PasswordHash);
END//
DELIMITER //
-- Procedure: sp_ConfirmShipPlacement
-- Updates a player's ready status for a game
DROP PROCEDURE IF EXISTS sp_ConfirmShipPlacement;
CREATE PROCEDURE sp_ConfirmShipPlacement(
    IN p_GameID INT,
    IN p_PlayerID INT
)
BEGIN
    UPDATE Player_Games
    SET HasPlacedShips = 1
    WHERE GameID = p_GameID AND PlayerID = p_PlayerID;
    -- This update will fire the 'tr_CheckGameStart' trigger
END//

-- Procedure: sp_FindMatch
-- The core matchmaking logic
DROP PROCEDURE IF EXISTS sp_FindMatch;
CREATE PROCEDURE sp_FindMatch(
    IN p_PlayerID INT
)
BEGIN
    DECLARE v_OpponentID INT;
    DECLARE v_GameID INT;
    DECLARE v_FirstPlayerID INT;
    DECLARE v_SecondPlayerID INT;
    DECLARE v_RandomTurn INT;

    -- Check if anyone is in the queue
    SELECT PlayerID INTO v_OpponentID
    FROM MatchmakingQueue
    WHERE PlayerID != p_PlayerID
    LIMIT 1;

    -- If queue is empty (v_OpponentID is NULL)
    IF v_OpponentID IS NULL THEN
        -- Add the player to the queue (or update their entry time)
        INSERT INTO MatchmakingQueue (PlayerID, EntryTime)
        VALUES (p_PlayerID, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE EntryTime = CURRENT_TIMESTAMP;
        
        -- Return a result set indicating "waiting"
        SELECT NULL AS GameID, NULL AS OpponentID, NULL AS CurrentTurnPlayerID;
    ELSE
        -- Match found!
        START TRANSACTION;
        
        -- Remove both players from the queue
        DELETE FROM MatchmakingQueue WHERE PlayerID = p_PlayerID OR PlayerID = v_OpponentID;

        -- Randomly assign player order and first turn
        SET v_RandomTurn = FLOOR(RAND() * 2); -- 0 or 1
        
        IF v_RandomTurn = 0 THEN
            SET v_FirstPlayerID = p_PlayerID;
            SET v_SecondPlayerID = v_OpponentID;
        ELSE
            SET v_FirstPlayerID = v_OpponentID;
            SET v_SecondPlayerID = p_PlayerID;
        END IF;

        -- Create the game
        INSERT INTO Games (GameState, CurrentTurnPlayerID)
        VALUES ('PlacingShips', v_FirstPlayerID);
        
        SET v_GameID = LAST_INSERT_ID();

        -- Add both players to the Player_Games junction table
        INSERT INTO Player_Games (GameID, PlayerID) VALUES (v_GameID, p_PlayerID);
        INSERT INTO Player_Games (GameID, PlayerID) VALUES (v_GameID, v_OpponentID);

        COMMIT;

        -- Return the new game info
        SELECT v_GameID AS GameID, 
               v_OpponentID AS OpponentID, 
               v_FirstPlayerID AS CurrentTurnPlayerID;
    END IF;
END//

-- Procedure: sp_MakeMove
-- Handles a player's attack
DROP PROCEDURE IF EXISTS sp_MakeMove;
CREATE PROCEDURE sp_MakeMove(
    IN p_GameID INT,
    IN p_AttackingPlayerID INT,
    IN p_TargetX INT,
    IN p_TargetY INT
)
BEGIN
    DECLARE v_DefendingPlayerID INT;
    DECLARE v_Result VARCHAR(4) DEFAULT 'Miss';
    DECLARE v_IsHit BOOLEAN;
    DECLARE v_GameState VARCHAR(20);

    -- Find the defending player
    SELECT PlayerID INTO v_DefendingPlayerID
    FROM Player_Games
    WHERE GameID = p_GameID AND PlayerID != p_AttackingPlayerID;

    -- Check if the move is a 'Hit'
    SELECT EXISTS (
        SELECT 1 FROM ShipPlacements
        WHERE GameID = p_GameID
          AND PlayerID = v_DefendingPlayerID
          AND X_Coord = p_TargetX
          AND Y_Coord = p_TargetY
          AND IsHit = 0 -- Important: check if it's already hit
    ) INTO v_IsHit;

    IF v_IsHit THEN
        -- It's a Hit!
        SET v_Result = 'Hit';
        
        -- Update the ship segment
        UPDATE ShipPlacements
        SET IsHit = 1
        WHERE GameID = p_GameID
          AND PlayerID = v_DefendingPlayerID
          AND X_Coord = p_TargetX
          AND Y_Coord = p_TargetY;
        -- This update fires 'tr_CheckForWin'
        
    ELSE
        -- It's a Miss!
        SET v_Result = 'Miss';
        
        -- Swap the turn
        UPDATE Games
        SET CurrentTurnPlayerID = v_DefendingPlayerID
        WHERE GameID = p_GameID;
    END IF;

    -- Log the move
    INSERT INTO Moves (GameID, AttackingPlayerID, TargetX, TargetY, Result)
    VALUES (p_GameID, p_AttackingPlayerID, p_TargetX, p_TargetY, v_Result);

    -- Get the current game state (which 'tr_CheckForWin' might have updated)
    SELECT GameState INTO v_GameState
    FROM Games
    WHERE GameID = p_GameID;

    -- Return the result of the move
    SELECT v_Result AS Result, v_GameState AS GameState, v_DefendingPlayerID AS DefendingPlayerID;

END//

-- ----------------------------
-- 4. TRIGGERS
-- ----------------------------

-- Trigger: tr_CheckGameStart
-- Fires after a player updates 'HasPlacedShips'
-- Checks if both players are ready and starts the game
DROP TRIGGER IF EXISTS tr_CheckGameStart;
CREATE TRIGGER tr_CheckGameStart
AFTER UPDATE ON Player_Games
FOR EACH ROW
BEGIN
    DECLARE v_ReadyPlayers INT;

    -- Only proceed if the 'HasPlacedShips' column was just set to 1
    IF NEW.HasPlacedShips = 1 AND OLD.HasPlacedShips = 0 THEN
        
        -- Count how many players are ready in this game
        SELECT COUNT(*) INTO v_ReadyPlayers
        FROM Player_Games
        WHERE GameID = NEW.GameID AND HasPlacedShips = 1;

        -- If both players are ready (count = 2)
        IF v_ReadyPlayers = 2 THEN
            -- Update the game state to 'InProgress'
            UPDATE Games
            SET GameState = 'InProgress'
            WHERE GameID = NEW.GameID;
        END IF;
    END IF;
END//

-- Trigger: tr_CheckForWin
-- Fires after a ship segment is updated (i.e., hit)
-- Checks if all of a player's ships are sunk
DROP TRIGGER IF EXISTS tr_CheckForWin;
CREATE TRIGGER tr_CheckForWin
AFTER UPDATE ON ShipPlacements
FOR EACH ROW
BEGIN
    DECLARE v_TotalSegments INT;
    DECLARE v_HitSegments INT;
    DECLARE v_AttackingPlayerID INT;

    -- Only proceed if a segment was just marked as hit
    IF NEW.IsHit = 1 AND OLD.IsHit = 0 THEN
        
        -- Count total segments for the defending player
        SELECT COUNT(*) INTO v_TotalSegments
        FROM ShipPlacements
        WHERE GameID = NEW.GameID AND PlayerID = NEW.PlayerID;

        -- Count hit segments for the defending player
        SELECT COUNT(*) INTO v_HitSegments
        FROM ShipPlacements
        WHERE GameID = NEW.GameID AND PlayerID = NEW.PlayerID AND IsHit = 1;

        -- Check if all segments are hit
        IF v_TotalSegments = v_HitSegments THEN
            
            -- Find the attacker (the winner)
            SELECT PlayerID INTO v_AttackingPlayerID
            FROM Player_Games
            WHERE GameID = NEW.GameID AND PlayerID != NEW.PlayerID;

            -- Set the game as completed
            UPDATE Games
            SET GameState = 'Completed',
                WinnerID = v_AttackingPlayerID,
                EndTime = CURRENT_TIMESTAMP,
                CurrentTurnPlayerID = NULL
            WHERE GameID = NEW.GameID;
            -- This update will fire the 'tr_UpdateLeaderboard' trigger
            
        END IF;
    END IF;
END//

-- Trigger: tr_UpdateLeaderboard
-- Fires after a game is updated
-- If the game just finished, it updates the winner's score
DROP TRIGGER IF EXISTS tr_UpdateLeaderboard;
CREATE TRIGGER tr_UpdateLeaderboard
AFTER UPDATE ON Games
FOR EACH ROW
BEGIN
    -- Check if the game state just changed to 'Completed'
    IF NEW.GameState = 'Completed' AND OLD.GameState != 'Completed' AND NEW.WinnerID IS NOT NULL THEN
        
        -- Increment the winner's total wins
        UPDATE Players
        SET TotalWins = TotalWins + 1
        WHERE PlayerID = NEW.WinnerID;
        
    END IF;
END//

-- Reset the delimiter back to semicolon
DELIMITER ;

-- ----------------------------
-- SCRIPT END
-- ----------------------------

SELECT 'Database setup complete.' AS Status;