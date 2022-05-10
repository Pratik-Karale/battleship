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
    // console.log(daShip)
    const hit=(pos)=>{
        if(isFinite(pos)){
            daShip[pos].hit()
        }else{
            const [x,y]=pos
            daShip[y][x].hit()
        }
    }
    const isSunk=()=>{
        return daShip.every((part)=>part.isHit)
    }
    daShip.hit=hit
    daShip.isSunk=isSunk
    return     daShip
};
export {Ship}