import {Ship,Board} from "./index"

const myBoard=Board(5)
const myShip=Ship(3)
it("test ship IO",()=>{
    expect(myShip.length).toBe(3)
    expect(myShip.isHorizontal).toBe(false)
    expect(myShip.isSunk()).toBe(true)
    myShip.hit(0)
    myShip.hit(1)
    myShip.hit(2)
    expect(myShip.isSunk()).toBe(true)
})
it("test board placement of ships",()=>{
    expect(()=>myBoard.place(myShip,[0,5])).toThrow("ship cant be place outside the board")
})
