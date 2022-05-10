import { Player } from "./player";

class AiPlayer extends Player{
    makeMove(){
        let chosenTileCoords
        do{
        chosenTileCoords=[Math.floor(Math.random()*this.enemy.board.size),
            Math.floor(Math.random()*this.enemy.board.size)]
        }while(this.enemy.board.getTile(...chosenTileCoords)==1 ||
               this.enemy.board.getTile(...chosenTileCoords).isHit==true)
        
        this.enemy.board.recieveAttack(...chosenTileCoords)
    }
}
export {AiPlayer}