import { Board } from "./gameBoard"
import { Ship } from "./ship"
import { BoardElem,placeShipMenu } from "./domHandler"
import { Player } from "./player"
import { AiPlayer } from "./aiPlayer"
import "./style.css"
import { utils } from "./utils"

const BOARD_SIZE = 10
const shipLengthList = [2, 3, 4, 5, 6, 7]
let direction="diagonalRTL"
const player = new Player(Board(BOARD_SIZE))

player.boardElem = BoardElem("Player", player.board.state)
document.body.appendChild(player.boardElem)

const placeMenu=placeShipMenu(()=>direction="vertical",()=>direction="horizontal",()=>direction="diagonalLTR",()=>direction="diagonalRTL",)
placeMenu.changeShipLenDisplay(shipLengthList.at(-1))
document.body.appendChild(placeMenu)

player.boardElem.tileElems.forEach((tile) => {
    tile.addEventListener("mouseenter", () => {
        const [x, y] = utils.parseCoords(tile.getAttribute("data-coords"))
        const current_length = shipLengthList.at(-1)

        if (shipLengthList.length == 0) return;
        if(!player.board.canPlaceShip(current_length,direction,x,y))return;
        
        const shipCoords=player.board.getShipCoords(current_length,direction,x,y)
        const shipTileElems=player.boardElem.tileElems.filter((tileElem)=>{
            return JSON.stringify(shipCoords).includes(`[${tileElem.getAttribute("data-coords")}]`)
        })
        shipTileElems.forEach((tileElem)=>tileElem.classList.add("place"))

        tile.addEventListener("mouseleave", leavehandler)
        function leavehandler() {
            shipTileElems.forEach((tile)=>tile.classList.remove("place"))
            removeEventListener("mouseleave", leavehandler)
        }
    })
});
player.boardElem.tileElems.forEach((tile) => {
    tile.addEventListener("click", () => {
        if (shipLengthList.length == 0) return;
        const [x, y] = utils.parseCoords(tile.getAttribute("data-coords"))
        const current_length = shipLengthList.at(-1)
        console.log(direction)
        player.board.place(Ship(current_length),direction, x, y)
        shipLengthList.pop()
        placeMenu.changeShipLenDisplay(shipLengthList.at(-1))
        if (shipLengthList.length == 0) {
            startGame()
            placeMenu.remove()
        }
        player.boardElem.update()
    })
})

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