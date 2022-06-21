import { Board } from "./gameBoard"
import { Ship } from "./ship"
import { BoardElem,placeShipMenu } from "./domHandler"
import { Player } from "./player"
import { AiPlayer } from "./aiPlayer"
import "./style.css"
import { utils } from "./utils"

const BOARD_SIZE = 10
const player = new Player(Board(BOARD_SIZE))

player.boardElem = BoardElem("Player", player.board.state)
document.body.appendChild(player.boardElem)

const placeMenu=placeShipMenu(player.board,player.boardElem)
document.body.appendChild(placeMenu)

function startGame() {

    const compPlayer = new AiPlayer(Board(10))
    player.enemy = compPlayer
    compPlayer.enemy = player
    // place ships in playeers board
    compPlayer.placeShips()

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
                // window.location = "/"
            }

            compPlayer.makeMove()
            player.boardElem.update()

            if (player.board.isAllSunk()) {
                alert("You LOSE!")
                // window.location = "/"
            }

        })
    });
}
// startGame()