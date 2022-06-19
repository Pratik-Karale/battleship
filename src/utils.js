const utils = {
    // main utilities
    parseCoords(str){
        return str.split(",")
            .map(coord=>parseInt(coord))
    },


    // dom utilities
    textToHtml(text) {
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = text
        return tempDiv.querySelector("*:first-child")
    }
}
export {utils}