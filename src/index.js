import {Board} from "./gameBoard"
import {Ship} from "./ship"
import { BoardElem } from "./domHandler"
import { Player } from "./player"
import { AiPlayer } from "./aiPlayer"
import "./style.css"

const player=new Player(Board(10))
const compPlayer=new AiPlayer(Board(10))
player.enemy=compPlayer
compPlayer.enemy=player

// place ships in playeers board
player.board.place(Ship(7),true,0,0)
player.board.place(Ship(6),true,2,9)
player.board.place(Ship(5),true,5,6)
player.board.place(Ship(4),false,1,2)
player.board.place(Ship(3),true,3,5)
player.board.place(Ship(2),true,8,3)

player.boardElem=BoardElem(player.board.state)
document.querySelector(".friendly-container").appendChild(player.boardElem)


// place ships in playeers board
compPlayer.board.place(Ship(7),true,0,0)
compPlayer.board.place(Ship(6),false,9,2)
compPlayer.board.place(Ship(5),false,6,5)
compPlayer.board.place(Ship(4),true,2,1)
compPlayer.board.place(Ship(3),false,5,3)
compPlayer.board.place(Ship(2),true,3,8)

compPlayer.boardElem=BoardElem(compPlayer.board.state,true)
document.querySelector(".enemy-container").appendChild(compPlayer.boardElem)

player.enemy.boardElem.tileElems.forEach(tileElem => {
    tileElem.addEventListener("click",()=>{
        const tileCoords=tileElem.getAttribute("data-coords").split(",")
        if(!player.enemy.board.isTileEmpty(...tileCoords)) return;
        player.enemy.board.recieveAttack(...tileCoords)
        player.enemy.boardElem.update()

        if(player.enemy.board.isAllSunk()){
            alert("You WON!")
            window.location="/"
        }

        compPlayer.makeMove()
        player.boardElem.update()

        if(player.enemy.board.isAllSunk()){
            alert("You LOSE!")
            window.location="/"
        }

    })
});