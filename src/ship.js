const ShipPart=()=>{
    return{
        isHit:false,
        hit(){
            this.isHit=true
        }
    }
}

const Ship=(length)=>{
    const daShip=Array(length).fill(0).map(()=>{
        return ShipPart()
    })
    const isSunk=()=>{
        return daShip.every((part)=>part.isHit)
    }
    daShip.hit=hit
    daShip.isSunk=isSunk
    return     daShip
};
export {Ship}