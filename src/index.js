import "./style.css"
import {getAuth,signInAnonymously,onAuthStateChanged} from "firebase/auth"
import {getDatabase,ref,set,serverTimestamp,update,onValue,child,get,onDisconnect,remove} from "firebase/database"
import { matchComputer } from "./matchComp";
import { mainMenu } from "./domHandler";
import { Board } from "./gameBoard"
import { BoardElem,placeShipMenu } from "./domHandler"
import { Player } from "./player"
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
    // user is the main creator of game and is sharing it`
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
    }else{//player is playing through a link
        dbMatchRef=ref(db,"matches/"+secondPlayer.secondMatchID)
        update(child(dbMatchRef,"activePlayers"),{1:auth.currentUser.uid})
    }
    onDisconnect(child(dbMatchRef,`/activePlayers/${+secondPlayer.isSecondPlayer}`)).remove()
    // initialize waiting screen
    const waitingScreen=document.createElement("div")
    waitingScreen.innerText="WAITING..."
    document.body.appendChild(waitingScreen)
    
    
    let activePlayersRef=child(dbMatchRef,"activePlayers")
    // if the other player has joined the match,remove waiting screen and continue the game
    onValue(activePlayersRef,snap=>{
        if(snap.val().length>1){
            if(snap.val().includes(undefined) || snap.val().length<2){
                console.log(snap.val())
                alert("One of the players has left the match")
                window.location='/'
            }
            waitingScreen.remove()
            const BOARD_SIZE = 10
            // make player and its board elem(append it) + board obj
            const player = new Player(Board(BOARD_SIZE))
            player.index=snap.val()[0]==auth.currentUser.uid?0:1
            player.boardElem = BoardElem("Player", player.board.state)
            document.body.appendChild(player.boardElem)
            
            // allow the player to choose the ships
            const placeMenu=placeShipMenu(player.board,player.boardElem)
            document.body.appendChild(placeMenu)

            // check if player has placed all the ships with some interval
            const startGameInterval=setInterval(()=>{
                if(document.body.contains(placeMenu))return;
                set(child(dbMatchRef,`p${player.index}_area`),{}).then((q)=>{
                    console.log("UHWUIH!@#GY@HG#YG@B#$Y@GY$#%HBJ#GH%$U#HG$UJ#GU$G@UGH$#UJGJK$@GUJH#G@UIG#$Y")
                    console.log(q)
                })
                set(child(dbMatchRef,`p${player.index}_area`),player.board.state)
                onValue(child(dbMatchRef,`p${Number(!player.index)}_area`),function (enemyAreaSnap){
                    if(enemyAreaSnap.exists() && !gameStarted){
                        gameStarted=true
                        
                        console.log("game is starting!")
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
    alert("started")
    const enemy=new Player(Board(10))
    enemy.index=Number(!player.index)
    
    enemy.boardElem = BoardElem("Enemy", enemy.board.state)
    document.body.appendChild(enemy.boardElem)

    let currentPlayerIndex;
    // throw new Error("da enemy index is "+enemy.index)
    get(child(dbMatchRef,`p${enemy.index}_area`))
    .then(snap=>{
        enemy.boardElem.tileElems.forEach(tileElem => {
            tileElem.addEventListener("click", () => {
                if(currentPlayerIndex==enemy.index)return;
                const tileCoords = tileElem.getAttribute("data-coords").split(",")
                if (!enemy.board.isTileEmpty(...tileCoords)) return;

                enemy.board.recieveAttack(...tileCoords)
                set(child(dbMatchRef,`p${enemy.index}_area`),enemy.board.state)
                set(child(dbMatchRef,"currentPlayerIndex"),enemy.index)
            })
        })
    })
    
    
    onValue(child(dbMatchRef,"currentPlayerIndex"),(snap)=>{
        currentPlayerIndex=snap.val()
        if(secondPlayer.isSecondPlayer==currentPlayerIndex){
            document.querySelectorAll("h3")[0].classList.add("current-player-title")
            document.querySelectorAll("h3")[1].classList.remove("current-player-title")
        }else{
            document.querySelectorAll("h3")[1].classList.add("current-player-title")
            document.querySelectorAll("h3")[0].classList.remove("current-player-title")
        }
    })
    onValue(child(dbMatchRef,`p${player.index}_area`),(snap)=>{
        const updatedState=utils.completeObj({hits:[],misses:[],shipParts:[]},snap.val())
        player.board.updateFromState(updatedState)
            player.boardElem.update()
            if (player.board.isAllSunk()) {
                alert("You LOSE!")
                window.location = "/"
            }
    })
    onValue(child(dbMatchRef,`p${enemy.index}_area/shipParts`),snap=>{
        const updatedState=utils.completeObj([],snap.val())
        enemy.board.placeShipFromPartsCoords(updatedState)
        enemy.boardElem.update()
    })
    onValue(child(dbMatchRef,`p${enemy.index}_area`),snap=>{
        const updatedState=utils.completeObj({hits:[],misses:[],shipParts:[]},snap.val())
        enemy.board.updateFromState(updatedState)
        enemy.boardElem.update()
        if (enemy.board.isAllSunk()) {
            alert("You WON!")
            window.location = "/"
        }
    })
}





















// // startGame()