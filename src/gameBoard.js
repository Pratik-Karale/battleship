export function Board(size=5){
    const board=Array(size).fill(0).map(()=>Array(size).fill(0))
    const place=(ship,[x,y])=>{
        if(ship.isHorizontal){
            if(!(ship.length+x<size)) throw new Error("ship cant be place outside the board");
            for(let i=0;i<=ship.length;i++){
                board[x][y]=ship
                x++
            }
        }else{
            if(!(ship.length+y<size)) throw new Error("ship cant be place outside the board");
            for(let i=0;i<=ship.length;i++){
                board[x][y]=ship
                x++
            }
        }
    }
}