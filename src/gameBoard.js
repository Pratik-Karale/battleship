export function Board(size=5){
    const board=Array(size).fill(0).map(()=>Array(size).fill(0))
    const ships=[]
    const place=(ship,horizontal,x,y)=>{
        if(ship.length+x>=size || ship.length+y>=size){
            throw new Error("ship cant be place outside the board")
        };
        if(horizontal){
            for(let i=0;i<ship.length;i++){
                board[y][x]=ship[i]
                x++
            }
        }else{
            for(let i=0;i<ship.length;i++){
                board[y][x]=ship[i]
                y++
            }
        }
        ships.push(ship)
    }
    const recieveAttack=(x,y)=>{
        // console.log(board[y][x])
        if(board[y][x]==0){
            board[y][x]=1
        }else{
            const hitShipPart=board[y][x]
            hitShipPart.hit()
        }
    }
    const isAllSunk=()=>ships.every((ship)=>ship.isSunk())
    const getTile=(x,y)=>board[y][x]
    return {place,getTile,recieveAttack,size:board.length,isAllSunk}
}