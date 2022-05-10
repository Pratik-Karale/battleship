import {Board} from "./gameBoard"
import {Ship} from "./ship"
import {Player} from "./player"
import {AiPlayer} from "./aiPlayer"
it("test ship IO",()=>{
    const myShip=Ship(3)
    expect(myShip.length).toBe(3)
    expect(myShip.isSunk()).toBe(false)
    myShip.hit(0)
    myShip.hit(1)
    myShip.hit(2)
    expect(myShip.isSunk()).toBe(true)
})
// it("test board placement of ships",()=>{
//     expect(()=>myBoard.place(myShip,false,2,0)).toThrow("ship cant be place outside the board")
// })
it("hit ships correctly",()=>{
    const myShip=Ship(3)
    const myBoard=Board(6)
    myBoard.place(myShip,true,2,0)
    myBoard.recieveAttack(2,0)
    expect(myShip[0].isHit).toBe(true)
})
it("hit waters correctly",()=>{
    const myBoard=Board(6)
    myBoard.recieveAttack(2,0)
    expect(myBoard.getTile(2,0)).toBe(1)
})
it("hit all ships",()=>{
    const myBoard=Board(6)
    myBoard.place(Ship(2),true,2,0)
    myBoard.recieveAttack(2,0)
    myBoard.recieveAttack(3,0)
    myBoard.place(Ship(2),false,2,1)
    myBoard.recieveAttack(2,1)
    myBoard.recieveAttack(2,2)
    expect(myBoard.isAllSunk()).toBe(true)
})

it("player and enemy correlation and making both existant",()=>{
    const myBoard=Board(6)
    const player=new Player(myBoard)
    const enemyBoard=Board(6)
    const comp=new Player(enemyBoard)
    
    player.enemy=comp
    comp.enemy=player

    expect(player.enemy==comp).toBe(true)
    expect(comp.enemy==player).toBe(true)
})

it("allow player to hit enemy waters/ships(also sink 'em) and vice versa",()=>{
    const myBoard=Board(3)
    myBoard.place(Ship(2),false,0,0)
    const player=new Player(myBoard)

    const enemyBoard=Board(3)
    enemyBoard.place(Ship(2),true,0,0)
    const comp=new Player(enemyBoard)
    
    player.enemy=comp
    comp.enemy=player

    player.enemy.board.recieveAttack(0,0)
    player.enemy.board.recieveAttack(1,0)
    expect(player.enemy.board.isAllSunk()).toBe(true)

    comp.enemy.board.recieveAttack(0,0)
    comp.enemy.board.recieveAttack(0,1)
    expect(comp.enemy.board.isAllSunk()).toBe(true)
})

it("check aiPlayer hits",()=>{
    const myBoard=Board(3)
    myBoard.place(Ship(2),false,0,0)
    const player=new Player(myBoard)
    
    const aiBoard=Board(3)
    aiBoard.place(Ship(2),true,0,0)
    const myAiPlayer=new AiPlayer(aiBoard)

    player.enemy=myAiPlayer
    myAiPlayer.enemy=player

    myAiPlayer.enemy.board.recieveAttack(0,0)
    myAiPlayer.enemy.board.recieveAttack(0,1)

    expect(myAiPlayer.enemy.board.isAllSunk()).toBe(true)
})