import { ShipPart } from "./ship"

export function Board(size = 5) {
    const board = Array(size).fill(0).map(() => Array(size).fill(0))
    const ships = []
    const state = { hits: [], misses: [], shipParts: [] }

    const getShipCoords = (shipLength, direction, x, y) => {
        const shipCoords = []
        for (let i = 0; i < shipLength; i++) {
            if (direction == "horizontal") {
                shipCoords.push([x + i, y])
            } else if (direction == "vertical") {
                shipCoords.push([x, y + i])
            } else if (direction == "diagonalLTR") {
                shipCoords.push([x + i, y + i])
            } else if (direction == "diagonalRTL") {
                shipCoords.push([x - i, y + i])
            }
        }
        return shipCoords
    }
    const isTileAvailable = (x, y) => board[y] && board[y][x] == 0;
    const canPlaceShip = (shipLength, direction, x, y) => {
        return getShipCoords(shipLength, direction, x, y)
            .every((shipCoord) => isTileAvailable(...shipCoord))
    }
    const place = (ship, direction, x, y) => {
        if (!canPlaceShip(ship.length, direction, x, y)) {
            throw new Error("ship cant be place outside the board")
        };
        getShipCoords(ship.length, direction, x, y).forEach((shipCoord, i) => {
            const [x, y] = shipCoord
            board[y][x] = ship[i]
            state.shipParts.push(shipCoord)
        })
        ships.push(ship)
    }
    const recieveAttack = (x, y, Result) => {
        if (Result) {
            if (Result === "Miss") {
                console.log("Miss at:", x, y)
                state.misses.push([x, y])
                board[y][x] = 1
            } else if (Result === "Hit") {
                console.log("Hit at:", x, y)
                state.hits.push([x, y])
                board[y][x] = ShipPart()
                board[y][x].hit()
            }
            return
        }
        // console.log("received attack on:",board[y][x])
        if (board[y][x] == 0) {
            console.log("Miss at:", x, y)
            state.misses.push([x, y])
            board[y][x] = 1
        } else if (board[y][x] != 1 && !board[y][x].isHit) {
            console.log("Hit at:", x, y)
            state.hits.push([x, y])
            const hitShipPart = board[y][x]
            hitShipPart.hit()
        }
    }
    const getTile = (x, y) => board[y][x]
    const isAllSunk = () => state.shipParts.map(shipPartCoord => getTile(...shipPartCoord)).every(shipPart => shipPart.isHit)
    const isTileEmpty = (x, y) => board[y][x] == 0 || board[y][x].isHit == false
    const placeShipFromPartsCoords = (shipPartsCoords) => {
        shipPartsCoords.forEach(shipPartCoords => board[shipPartCoords[1]][shipPartCoords[0]] = ShipPart())
        state.shipParts = [...state.shipParts, ...shipPartsCoords]
    }

    // places ship part when called first time and updates the hits in the area
    const updateFromState = (state) => {
        state.hits.forEach(hitCoords => recieveAttack(...hitCoords))
        state.misses.forEach(missCoords => recieveAttack(...missCoords))
    }
    return { place, getTile, recieveAttack, size: board.length, isAllSunk, state, isTileEmpty, canPlaceShip, getShipCoords, placeShipFromPartsCoords, updateFromState, boardActual: board }
}