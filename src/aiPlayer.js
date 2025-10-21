import { Player } from "./player";
import { Ship } from "./ship";
class AiPlayer extends Player{
    placeShips(){
        const directions=["vertical","horizontal","diagonalRTL","diagonalLTR"]
        const getRandCoord=()=>Math.floor(Math.random()*this.board.size)
        for(let i=2;i<8;i++){
            const randShip=Ship(i)
            const randDirection=directions[Math.floor(Math.random()*directions.length)]
            const randCoords=[getRandCoord(),getRandCoord()]
            if(this.board.canPlaceShip(randShip.length,randDirection,...randCoords)){
                this.board.place(randShip,randDirection,...randCoords)
            }else{
                i--
            }
        }
    }
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