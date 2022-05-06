import {Ship} from "./index"

it("test ship IO",()=>{
    const myShip=Ship(3,(0,2))
    expect(myShip.length).toBe(3)
    expect(myShip.isHorizontal).toBe(false)
    expect(myShip.isSunk()).toBe(true)
    myShip.hit(0)
    myShip.hit(1)
    myShip.hit(2)
    expect(myShip.isSunk()).toBe(true)
})