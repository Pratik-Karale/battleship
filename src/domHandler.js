const utils = {
    textToHtml(text) {
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = text
        return tempDiv.querySelector("*:first-child")
    }
}
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
    boardElem.update = update
    boardElem.tileElems = [...boardElem.children]
    return boardWrapper
}
export { BoardElem }