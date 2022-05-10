const utils = {
    textToHtml(text) {
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = text
        return tempDiv.querySelector("*:first-child")
    }
}
// hits:[],misses:[],shipPart:[]
function BoardElem(state) {
    let boardElem = utils.textToHtml(`
        <div class="board"></div>
    `)
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            boardElem.appendChild(utils.textToHtml(`
            <div class="tile" data-coords="${x},${y}"></div>
            `))
        }
    }
    state.shipParts.forEach(coords => {
        boardElem.querySelector(`[data-coords="${coords[0]},${coords[1]}"]`)
            .classList.add("ship-part")
    });

    const update = () => {
        state.shipParts.forEach(coords => {
            boardElem.querySelector(`[data-coords="${coords[0]},${coords[1]}"]`)
                .classList.add("ship-part")
        });

        state.hits.forEach(coords => {
            boardElem.querySelector(`[data-coords="${coords[0]},${coords[1]}"]`)
                .classList.add("attacked-ship-part")
        });
        state.misses.forEach(coords => {
            boardElem.querySelector(`[data-coords="${coords[0]},${coords[1]}"]`)
                .classList.add("attacked-water")
        });
    }
    boardElem.update=update
    boardElem.tileElems=[...boardElem.children]
    return boardElem
}
export {BoardElem}