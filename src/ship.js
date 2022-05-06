const Ship=(length,startPos,horizontal=false)=>{
    const damagedParts=Array(length).fill(0)
    const hit=(partNum)=>{
        damagedParts[partNum]=1
    }
    const isSunk=()=>{
        return damagedParts.every((damagedPart)=>damagedPart==1)
    }
    return {length,hit,isSunk,isHorizontal:horizontal,startPos}
};
export {Ship}