import "./style.css"
import {getAuth,signInAnonymously} from "firebase/auth"
import {getDatabase,ref,set,serverTimestamp,update,push,onValue,child,get,} from "firebase/database"
import { matchComputer } from "./matchComp";
import { mainMenu } from "./domHandler";
import { Board } from "./gameBoard"
import { Ship } from "./ship"
import { BoardElem,placeShipMenu } from "./domHandler"
import { Player } from "./player"
import { AiPlayer } from "./aiPlayer"
import { utils } from "./utils"

import { initializeApp } from 'firebase/app';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCMjBR6-TWMB_B-et9JVx-NW806zJELB8w",
    authDomain: "battleship-2d791.firebaseapp.com",
    databaseURL: "https://battleship-2d791-default-rtdb.firebaseio.com",
    projectId: "battleship-2d791",
    storageBucket: "battleship-2d791.appspot.com",
    messagingSenderId: "922976073396",
    appId: "1:922976073396:web:6788bf224a0ed0f15b89e1",
    measurementId: "G-VYR5WPWMET",
    databaseURL:"https://battleship-2d791-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const auth=getAuth(app)
const db=getDatabase(app)
let dbMatchRef;
let gameStarted=false

signInAnonymously(auth).then(a=>console.log(auth.currentUser)).catch(()=>console.log("BRUHHH!"))
const secondPlayer={
    secondMatchID:(new URL(window.location.href)).searchParams.get("matchID"),
}
secondPlayer["isSecondPlayer"]=!!secondPlayer.secondMatchID

let startMultiplayerGame;
const gameMainMenu=mainMenu(matchComputer.start,()=>{
    if(!secondPlayer.isSecondPlayer){
        const shareLink=new URL(window.location.href)
        shareLink.searchParams.set("matchID",auth.currentUser.uid)
        navigator.clipboard.writeText(shareLink)
        
        dbMatchRef=ref(db,"matches/"+auth.currentUser.uid)
        set(dbMatchRef,{
            timestamp:serverTimestamp(),
            activePlayers:[auth.currentUser.uid],
            currentPlayerIndex:Math.round(Math.random()),
            winner:null
        })
        alert("share link copied!")
    }else{
        console.log(secondPlayer)
        dbMatchRef=ref(db,"matches/"+secondPlayer.secondMatchID)
        update(child(dbMatchRef,"activePlayers"),{1:auth.currentUser.uid})
    }
    const waitingScreen=document.createElement("div")
    waitingScreen.innerText="WAITING..."
    console.log(waitingScreen)
    document.body.appendChild(waitingScreen)
    let activePlayersRef=child(dbMatchRef,"activePlayers")
    onValue(activePlayersRef,snap=>{
        if(snap.val().length>1){
            waitingScreen.remove()
            console.log("wait complete")
            const BOARD_SIZE = 10
            const player = new Player(Board(BOARD_SIZE))
            player.index=snap.val()[0]==auth.currentUser.uid?0:1
            player.boardElem = BoardElem("Player", player.board.state)
            document.body.appendChild(player.boardElem)
            const placeMenu=placeShipMenu(player.board,player.boardElem)
            document.body.appendChild(placeMenu)
            const startGameInterval=setInterval(()=>{
                if(document.body.contains(placeMenu))return;
                set(child(dbMatchRef,`p${player.index}_area`),player.board.state)
                onValue(child(dbMatchRef,`p${Number(!player.index)}_area`),function (enemyAreaSnap){
                    if(enemyAreaSnap.exists() && !gameStarted){
                        startMultiplayerGame(player)
                    }
                })
                clearInterval(startGameInterval)
            },300)
        }
    })

})
// 
document.body.appendChild(gameMainMenu)

startMultiplayerGame=(player)=>{
    const enemy=new Player(Board(10))
    enemy.index=Number(!player.index)
    let currentPlayerIndex;
    onValue(child(dbMatchRef,"currentPlayerIndex"),(snap)=>{
        currentPlayerIndex=snap.val()
        currentPlayerIndex==player.index?alert("first"):null
    })
    onValue(child(dbMatchRef,`p${player.index}_area`),(snap)=>{
        try{
            player.board.updateFromState(snap.val())
            player.boardElem.update()
        }catch(e){}
    })
    
    // throw new Error("da enemy index is "+enemy.index)
    get(child(dbMatchRef,`p${enemy.index}_area`))
    .then(snap=>{
        enemy.board.placeShipFromPartsCoords(snap.val().shipParts)
        enemy.boardElem = BoardElem("Enemy", enemy.board.state)
        document.body.appendChild(enemy.boardElem)
        gameStarted=true
    })
        .then(()=>{
            console.log("!@@!UU@!U@!U!@U@!U@!U@!U@!U@!UJ@!U@!UI@!U@U@U@!U@!U@UU@!U")
            enemy.boardElem.tileElems.forEach(tileElem => {
                tileElem.addEventListener("click", () => {
                    if(currentPlayerIndex==enemy.index)return;
                    const tileCoords = tileElem.getAttribute("data-coords").split(",")
                    if (!enemy.board.isTileEmpty(...tileCoords)) return;
                    enemy.board.recieveAttack(...tileCoords)
                    enemy.boardElem.update()
                    set(child(dbMatchRef,`p${enemy.index}_area`),enemy.board.state)
        
                    if (enemy.board.isAllSunk()) {
                        alert("You WON!")
                        window.location = "/"
                    }else if (player.board.isAllSunk()) {
                        alert("You LOSE!")
                        window.location = "/"
                    }
        
                })
            })
    })
}





















// // startGame()