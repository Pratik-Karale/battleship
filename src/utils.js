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
    },

    // complete object from template
    completeObj(template,obj){
        if(!obj)return template;
        for(const key in template){
            if(!obj.hasOwnProperty(key)){
                obj[key]=template[key]
            }
        }
        return obj
    }
}
export {utils}