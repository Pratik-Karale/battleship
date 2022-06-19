import {utils} from "./utils"
// hits:[],misses:[],shipPart:[]
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
function placeShipMenu(handlerVertical,handlerHorizontal,handlerDiagonalLTR,handlerDiagonalRTL){
    const menuElem=utils.textToHtml(`
    <div class="place-ship-menu">
        <span data-ship-length></span>
        <button data-vertical-btn>Vertical</button>
        <button  data-horizontal-btn>Horizontal</button>
        <button data-diagonalLTR-btn>DiagonalLTR</button>
        <button data-diagonalRTL-btn>DiagonalRTL</button>
    </div>
    `)
    menuElem.querySelector("[data-vertical-btn]").addEventListener("click",handlerVertical)
    menuElem.querySelector("[data-horizontal-btn]").addEventListener("click",handlerHorizontal)
    menuElem.querySelector("[data-diagonalLTR-btn]").addEventListener("click",handlerDiagonalLTR)
    menuElem.querySelector("[data-diagonalRTL-btn]").addEventListener("click",handlerDiagonalRTL)
    menuElem.changeShipLenDisplay=(length)=>{
        menuElem.querySelector("[data-ship-length]").textContent=length
    }
    return menuElem
}
export { BoardElem,placeShipMenu }