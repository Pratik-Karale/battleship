import {Board} from "./gameBoard"
import {Ship} from "./ship"
import { BoardElem } from "./domHandler"
import { Player } from "./player"
import { AiPlayer } from "./aiPlayer"

const player=new Player(Board(10))
// place ships in playeers board
player.board.place(Ship(10),true,0,0)

player.boardElem=BoardElem(player.board.state)
document.querySelector("friendly-container").appendChild(player.boardElem)