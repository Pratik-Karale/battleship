import { Board } from "./gameBoard"
import { Ship } from "./ship"
import { BoardElem } from "./domHandler"
import { Player } from "./player"
import { AiPlayer } from "./aiPlayer"
import "./style.css"
import { utils } from "./utils"

const BOARD_SIZE = 10

const player = new Player(Board(BOARD_SIZE))
let allShipsPlaced = false

player.boardElem = BoardElem("Player", player.board.state)
document.body.appendChild(player.boardElem)
// place ships in playeers board
// player.board.place(Ship(7),true,0,0)
// player.board.place(Ship(6),true,2,9)
// player.board.place(Ship(5),true,5,6)
// player.board.place(Ship(4),false,1,2)
// player.board.place(Ship(3),true,3,5)
// player.board.place(Ship(2),true,8,3)
const shipLengthList = [2, 3, 4, 5, 6, 7]
const isPlacingHorizontal = true

player.boardElem.tileElems.forEach((tile) => {
    tile.addEventListener("mouseenter", () => {
        const current_length = shipLengthList.at(-1)
        const [x, y] = utils.parseCoords(tile.getAttribute("data-coords"))
        tile.addEventListener("mouseleave", leavehandler)
        function leavehandler() {
            for (let i = 0; i < current_length; i++) {
                if (isPlacingHorizontal && x + current_length <=BOARD_SIZE) {
                    document.querySelector(`[data-coords='${x + i},${y}']`).classList.remove("place")
                } else if (!isPlacingHorizontal && y + current_length <=BOARD_SIZE) {
                    document.querySelector(`[data-coords='${x},${y + 1}']`).classList.remove("place")
                }
            }
            removeEventListener("mouseleave", leavehandler)
        }
        if ((isPlacingHorizontal && x + current_length <=BOARD_SIZE)) {
            tile.classList.add("place")
            for (let i = 1; i < current_length; i++) {
                document.querySelector(`[data-coords='${x + i},${y}']`).classList.add("place")
            }
        } else if (!isPlacingHorizontal && y + current_length <=BOARD_SIZE) {
            tile.classList.add("place")
            for (let i = 1; i < current_length; i++) {
                document.querySelector(`[data-coords='${x},${y + i}']`).classList.add("place")
            }
        }
    })
});
player.boardElem.tileElems.forEach((tile) => {
    tile.addEventListener("click", () => {
        console.log(121213)
        const [x, y] = utils.parseCoords(tile.getAttribute("data-coords"))
        const current_length = shipLengthList.at(-1)
        if (isPlacingHorizontal && x + current_length <=BOARD_SIZE) {
            player.board.place(Ship(current_length), isPlacingHorizontal, x, y)
            shipLengthList.pop()
        } else if (y + current_length <=BOARD_SIZE) {
            player.board.place(Ship(current_length), isPlacingHorizontal, x, y)
            shipLengthList.pop()
        }

        if (shipLengthList.length == 0) {
            startGame()
        }
        player.boardElem.update()
    })
})

function startGame() {

    const compPlayer = new AiPlayer(Board(10))
    player.enemy = compPlayer
    compPlayer.enemy = player
    // place ships in playeers board
    compPlayer.board.place(Ship(7), true, 0, 0)
    compPlayer.board.place(Ship(6), false, 9, 2)
    compPlayer.board.place(Ship(5), false, 6, 5)
    compPlayer.board.place(Ship(4), true, 2, 1)
    compPlayer.board.place(Ship(3), false, 5, 3)
    compPlayer.board.place(Ship(2), true, 3, 8)

    compPlayer.boardElem = BoardElem("Computer", compPlayer.board.state, true)
    document.body.appendChild(compPlayer.boardElem)

    player.enemy.boardElem.tileElems.forEach(tileElem => {
        tileElem.addEventListener("click", () => {
            const tileCoords = tileElem.getAttribute("data-coords").split(",")
            if (!player.enemy.board.isTileEmpty(...tileCoords)) return;
            player.enemy.board.recieveAttack(...tileCoords)
            player.enemy.boardElem.update()

            if (player.enemy.board.isAllSunk()) {
                alert("You WON!")
                window.location = "/"
            }

            compPlayer.makeMove()
            player.boardElem.update()

            if (player.enemy.board.isAllSunk()) {
                alert("You LOSE!")
                window.location = "/"
            }

        })
    });
}
// startGame()