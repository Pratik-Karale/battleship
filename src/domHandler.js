import {utils} from "./utils"
// hits:[],misses:[],shipPart:[]
import { Ship } from "./ship"

function BoardElem(playerName,state, hideShips = false, size = 10) {
    let boardWrapper=utils.textToHtml(`
    <div class="player-container">
        <h3  class="player-title">${playerName}</h3>
    </div>
    `)
    
    let boardElem = utils.textToHtml(`
        <div class="board"></div>
    `)

    boardWrapper.appendChild(boardElem)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            boardElem.appendChild(utils.textToHtml(`
            <div class="tile" data-coords="${x},${y}"></div>
            `))
        }
    }
    if (!hideShips) {
        state.shipParts.forEach(coords => {
            boardElem.querySelector(`[data-coords="${coords[0]},${coords[1]}"]`)
                .classList.add("ship-part")
        });
    }

    const update = () => {
        if (!hideShips) {

            state.shipParts.forEach(coords => {
                boardElem.querySelector(`[data-coords="${coords[0]},${coords[1]}"]`)
                    .classList.add("ship-part")
            });
        }
        state.hits.forEach(coords => {
            boardElem.querySelector(`[data-coords="${coords[0]},${coords[1]}"]`)
                .classList.add("attacked-ship-part")
        });
        state.misses.forEach(coords => {
            boardElem.querySelector(`[data-coords="${coords[0]},${coords[1]}"]`)
                .classList.add("attacked-water")
        });
    }
    boardWrapper.update = update
    boardWrapper.tileElems = [...boardElem.children]
    return boardWrapper
}
function placeShipMenu(board,boardElem){
    const menuElem=utils.textToHtml(`
    <div class="place-ship-menu">
        <span data-ship-length></span>
        <button data-vertical-btn>Vertical</button>
        <button  data-horizontal-btn>Horizontal</button>
        <button data-diagonalLTR-btn>DiagonalLTR</button>
        <button data-diagonalRTL-btn>DiagonalRTL</button>
        </div>
        `)
        
    
    const changeShipLenDisplay=(length)=>{
        menuElem.querySelector("[data-ship-length]").textContent=length
    }
    const shipLengthList = [2, 3, 4, 5, 6, 7]
    let direction="diagonalRTL"
    boardElem.tileElems.forEach((tile) => {
        tile.addEventListener("mouseenter", () => {
            const [x, y] = utils.parseCoords(tile.getAttribute("data-coords"))
            const current_length = shipLengthList.at(-1)
    
            if (shipLengthList.length == 0) return;
            if(!board.canPlaceShip(current_length,direction,x,y))return;
            
            const shipCoords=board.getShipCoords(current_length,direction,x,y)
            const shipTileElems=boardElem.tileElems.filter((tileElem)=>{
                return JSON.stringify(shipCoords).includes(`[${tileElem.getAttribute("data-coords")}]`)
            })
            shipTileElems.forEach((tileElem)=>tileElem.classList.add("place"))
    
            tile.addEventListener("mouseleave", leavehandler)
            function leavehandler() {
                shipTileElems.forEach((tile)=>tile.classList.remove("place"))
                removeEventListener("mouseleave", leavehandler)
            }
        })
    });
    boardElem.tileElems.forEach((tile) => {
        tile.addEventListener("click", (() => {
            if (shipLengthList.length == 0) return;
            const [x, y] = utils.parseCoords(tile.getAttribute("data-coords"))
            const current_length = shipLengthList.at(-1)
            console.log(direction)
            board.place(Ship(current_length),direction, x, y)
            shipLengthList.pop()
            changeShipLenDisplay(shipLengthList.at(-1))
            if (shipLengthList.length == 0) {
                menuElem.remove()
            }
            boardElem.update()
        }))
    })
    // ()=>direction="vertical",()=>direction="horizontal",()=>direction="diagonalLTR",()=>direction="diagonalRTL",
    menuElem.querySelector("[data-vertical-btn]").addEventListener("click",()=>direction="vertical")
    menuElem.querySelector("[data-horizontal-btn]").addEventListener("click",()=>direction="horizontal")
    menuElem.querySelector("[data-diagonalLTR-btn]").addEventListener("click",()=>direction="diagonalLTR")
    menuElem.querySelector("[data-diagonalRTL-btn]").addEventListener("click",()=>direction="diagonalRTL")
    return menuElem
}

function mainMenu(compEvtListener,friendEvtListener){
    const menuElem=utils.textToHtml(`<div class="game-menu"><button class="play-computer-btn">Play with computer</button><button class="play-friend-btn">Play with a friend</button></div>`)
    menuElem.querySelector(".play-computer-btn").addEventListener("click",()=>{compEvtListener();menuElem.remove()})
    menuElem.querySelector(".play-friend-btn").addEventListener("click",()=>{friendEvtListener();menuElem.remove()})
    return menuElem

}
export { BoardElem,placeShipMenu ,mainMenu}