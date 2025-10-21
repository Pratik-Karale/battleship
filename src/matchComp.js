import { Board } from "./gameBoard"
import { BoardElem,placeShipMenu,gameAlert } from "./domHandler"
import { Player } from "./player"
import { AiPlayer } from "./aiPlayer"

function startGame() {
    const BOARD_SIZE = 10
    const player = new Player(Board(BOARD_SIZE))
    
    player.boardElem = BoardElem("Player", player.board.state)
    document.body.appendChild(player.boardElem)
    
    const placeMenu=placeShipMenu(player.board,player.boardElem)
    document.body.appendChild(placeMenu)
    const startGameInterval=setInterval(()=>{
        if(document.body.contains(placeMenu))return;
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
                console.log(player.board.state)
    
                if (player.enemy.board.isAllSunk()) {
                    gameAlert("You WON!",()=>window.location = "/")
                }
    
                compPlayer.makeMove()
                player.boardElem.update()
    
                if (player.board.isAllSunk()) {
                    gameAlert("You LOSE!",()=>window.location = "/")
                }
    
            })
        });
        clearInterval(startGameInterval)
    },300)
}

const matchComputer={start:startGame}
export {matchComputer}