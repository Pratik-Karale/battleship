export function Board(size=5){
    const board=Array(size).fill(0).map(()=>Array(size).fill(0))
    const ships=[]
    const state={hits:[],misses:[],shipParts:[]}

    const getShipCoords=(shipLength,direction,x,y)=>{
        const shipCoords=[]
        for(let i=0;i<shipLength;i++){
            if(direction=="horizontal"){
                shipCoords.push([x+i,y])
            }else if(direction=="vertical"){
                shipCoords.push([x,y+i])
            }else if(direction=="diagonalLTR"){
                shipCoords.push([x+i,y+i])
            }else if(direction=="diagonalRTL"){
                shipCoords.push([x-i,y+i])
            }
        }
        return shipCoords
    }
    const isTileAvailable=(x,y)=> board[y] && board[y][x] == 0;
    const canPlaceShip=(shipLength,direction,x,y)=>{
        return getShipCoords(shipLength,direction,x,y)
                    .every((shipCoord)=>isTileAvailable(...shipCoord))
    }
    const place=(ship,direction,x,y)=>{
        if(!canPlaceShip(ship.length,direction,x,y)){
            throw new Error("ship cant be place outside the board")
        };
        getShipCoords(ship.length,direction,x,y).forEach((shipCoord,i)=>{
            const [x,y]=shipCoord
            board[y][x]=ship[i]
            state.shipParts.push(shipCoord)
        })
        ships.push(ship)
    }
    const recieveAttack=(x,y)=>{
        // console.log(board[y][x])
        if(board[y][x]==0){
            state.misses.push([x,y])
            board[y][x]=1
        }else if(board[y][x]!=1){
            state.hits.push([x,y])
            const hitShipPart=board[y][x]
            hitShipPart.hit()
        }
    }
    const isAllSunk=()=>ships.every((ship)=>ship.isSunk())
    const getTile=(x,y)=>board[y][x]
    const isTileEmpty=(x,y)=>board[y][x]==0 || board[y][x].isHit==false
    return {place,getTile,recieveAttack,size:board.length,isAllSunk,state,isTileEmpty,canPlaceShip,getShipCoords}
}