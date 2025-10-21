import {utils} from "./utils"
// hits:[],misses:[],shipPart:[]
import { Ship } from "./ship"

function BoardElem(playerName,state, hideShips = false, size = 10) {
    let boardWrapper=utils.textToHtml(`
    <div class="player-container">
        <h3  class="player-title ${playerName}-board">${playerName}</h3>
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
        <button data-vertical-btn title="Place Vertically"></button>
        <button  data-horizontal-btn title="Place Horizontally"></button>
        <button data-diagonalLTR-btn title="Place Diagonal-LTR"></button>
        <button data-diagonalRTL-btn title="Place Diagonal-RTL"></button>
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
    
    menuElem.querySelectorAll("button").forEach((placeBtn)=>placeBtn.addEventListener("click",()=>{
        direction=placeBtn.getAttributeNames().find(attr=>attr.includes("data")).split("-")[1]
        if(direction.includes("diagonal")){
            direction="diagonal"+(direction.slice(8).toUpperCase())
        }
        menuElem.querySelectorAll("button").forEach(btn=>btn.classList.remove("active-place-btn"))
        placeBtn.classList.add("active-place-btn")
    }))
    return menuElem
}

function mainMenu(compEvtListener,friendEvtListener){
    const menuElem=utils.textToHtml(`<div class="game-menu"><button class="play-computer-btn">Play with computer</button><button class="play-friend-btn">Play with a friend</button></div>`)
    menuElem.querySelector(".play-computer-btn").addEventListener("click",()=>{compEvtListener();menuElem.remove()})
    menuElem.querySelector(".play-friend-btn").addEventListener("click",()=>{friendEvtListener();menuElem.remove()})
    return menuElem

}

function gameAlert(msg,callback){
    let gameAlert=utils.textToHtml(`
    <div class="game-alert">
        <div class="alert-box">
            <h3 class="game-alert-msg"></h3>
            <button class="game-alert-close-btn">OK</button>
        </div>
    </div>
    `)
    gameAlert.querySelector(".game-alert-msg").innerText=msg
    document.body.appendChild(gameAlert)

    gameAlert.querySelector(".game-alert-close-btn").addEventListener("click",()=>{
        gameAlert.remove();
        callback()
    })
}
export { BoardElem,placeShipMenu ,mainMenu,gameAlert}