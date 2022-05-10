export function Board(size=5){
    const board=Array(size).fill(0).map(()=>Array(size).fill(0))
    const ships=[]
    const state={hits:[],misses:[],shipParts:[]}
    const place=(ship,horizontal,x,y)=>{
        if((ship.length+x>size && horizontal) || (ship.length+y>size && !horizontal)){
            throw new Error("ship cant be place outside the board")
        };
        if(horizontal){
            for(let i=0;i<ship.length;i++){
                board[y][x]=ship[i]
                state.shipParts.push([x,y])
                x++
            }
        }else{
            for(let i=0;i<ship.length;i++){
                board[y][x]=ship[i]
                state.shipParts.push([x,y])
                y++
            }
        }
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
    return {place,getTile,recieveAttack,size:board.length,isAllSunk,state,isTileEmpty}
}