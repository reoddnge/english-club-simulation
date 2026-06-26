"use client";

import { useEffect, useState } from "react";

import {
collection,
onSnapshot,
updateDoc,
increment,
addDoc,
serverTimestamp,
doc,
getDoc,
deleteDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  createGame,
  finishGame,
  gamePath
} from "@/lib/gameManager";

import {
  GAME_MODULES
} from "@/lib/gameModules";

import {
  getModuleEvents
} from "@/lib/moduleEngine";

import jsPDF from "jspdf";
import {auth} from "@/lib/firebase";
import {onAuthStateChanged} from "firebase/auth";
import {useRouter} from "next/navigation";

export default function TeacherPage(){


const [currentGame,setCurrentGame]=useState(null);
const [selectedModule,setSelectedModule]=useState("");

const [students,setStudents]=useState([]);
const [messages,setMessages]=useState([]);
const [questRequests,setQuestRequests]=useState([]);

const [selectedId,setSelectedId]=useState(null);

const [actionType,setActionType]=useState("");

const [messageText,setMessageText]=useState("");
const [messageTarget,setMessageTarget]=useState("");
const [gameId,setGameId] = useState(null);
const [showCompleted,setShowCompleted] = useState(false);
const completedRequests =
questRequests.filter(
q => q.status === "approved"
);
const [showEndConfirm,setShowEndConfirm] = useState(false);
const [finalReport,setFinalReport] = useState(null);
const [showReport,setShowReport] = useState(false);
const [worldInfo,setWorldInfo] = useState(null);
const [mounted,setMounted] = useState(false);
const [showInfo,setShowInfo] = useState(false);
const [formSubmissions,setFormSubmissions]=useState([]);
const [showForms,setShowForms]=useState(false);
const [showTools,setShowTools] = useState(false);

useEffect(()=>{


if(!gameId)return;


return onSnapshot(

collection(
db,
"games",
gameId,
"formSubmissions"
),

snap=>{


setFormSubmissions(

snap.docs.map(d=>({

id:d.id,

...d.data()

}))

);


}


)


},[gameId]);

useEffect(()=>{
  setMounted(true);
},[]);

useEffect(()=>{


if(!gameId)
return;


return onSnapshot(

doc(db,"games",gameId),

snap=>{

setCurrentGame({

id:snap.id,

...snap.data()

});

}

);


},[gameId]);

async function startGame(){

console.log("START CLICKED");
console.log("MODULE:", selectedModule);


if(!selectedModule){
  alert("Select module first");
  return;
}


try{


const id = await createGame(selectedModule);


console.log("GAME CREATED:", id);


await updateDoc(
  doc(db,"games",id),
  {
    status:"active",
    startedAt:serverTimestamp(),
    createdAt:serverTimestamp()
  }
);


console.log("GAME UPDATED");


setGameId(id);


setCurrentGame({

id,

moduleId:selectedModule

});


localStorage.setItem(
"activeGameId",
id
);


console.log("DONE");


}catch(err){

console.error(
"START GAME ERROR",
err
);

alert(err.message);

}

}



async function endGame(){

if(!gameId)return;


const gameDoc =
await getDoc(
doc(db,"games",gameId)
);


const gameData =
gameDoc.data();



const endTime =
new Date();



const startTime =
gameData.startedAt
? gameData.startedAt.toDate()
: gameData.createdAt
? gameData.createdAt.toDate()
: new Date();



const duration =
Math.round(
(endTime-startTime)/(1000*60)
);



const leaderboard =
[...students]
.sort(
(a,b)=>
(b.score||0)-(a.score||0)
)
.map((s,index)=>({

id:s.id,

rank:index+1,

name:s.name,

score:s.score||0,

quests:
(s.quests||[])
.filter(q=>q.status==="completed")
.length

}));



const report={

duration,

studentsCount: students.length,

leaderboard,

winner:
leaderboard[0]?.name || "-",

createdAt:serverTimestamp()

};



await updateDoc(
doc(
db,
"games",
gameId
),
{
finalReport:report
}
);



await updateDoc(

doc(
db,
"games",
gameId
),

{

status:"finished",

endedAt:serverTimestamp()

}

);



setFinalReport(report);
setShowReport(true);

await finishGame(gameId);

localStorage.removeItem("activeGameId");

// don't clear immediately


}

async function clearFinishedGame(){

if(!gameId) return;


// delete game document
await deleteDoc(
doc(db,"games",gameId)
);


// clear UI
setShowReport(false);
setFinalReport(null);
setGameId(null);
setCurrentGame(null);
setStudents([]);
setMessages([]);
setQuestRequests([]);


localStorage.removeItem("activeGameId");

}

function downloadPDF(){

if(!finalReport)return;


const pdf = new jsPDF();


const pageWidth = pdf.internal.pageSize.getWidth();


// ===== HEADER =====

pdf.setFillColor(30,41,59);

pdf.rect(
0,
0,
pageWidth,
35,
"F"
);


pdf.setTextColor(255,255,255);

pdf.setFontSize(22);

pdf.text(
"Game Final Report",
20,
22
);



pdf.setTextColor(0,0,0);


// ===== INFO =====


pdf.setFontSize(12);


pdf.text(
`Duration: ${finalReport.duration} minutes`,
20,
55
);


pdf.text(
`Players: ${finalReport.studentsCount}`,
20,
70
);


pdf.text(
`Winner: ${finalReport.winner}`,
20,
85
);




// ===== LINE =====

pdf.setDrawColor(200,200,200);

pdf.line(
20,
95,
190,
95
);



// ===== TITLE =====


pdf.setFontSize(16);

pdf.text(
"Leaderboard",
20,
115
);



// ===== TABLE HEADER =====


let y = 130;


pdf.setFillColor(37,99,235);

pdf.rect(
20,
y-8,
170,
12,
"F"
);


pdf.setTextColor(255,255,255);

pdf.setFontSize(11);


pdf.text(
"Rank",
25,
y
);


pdf.text(
"Student",
55,
y
);


pdf.text(
"Score",
125,
y
);


pdf.text(
"Quests",
160,
y
);



pdf.setTextColor(0,0,0);


y += 12;



// ===== ROWS =====


finalReport.leaderboard.forEach((s)=>{


if(y > 270){

pdf.addPage();

y = 30;

}



pdf.setFontSize(11);


pdf.text(
String(s.rank),
25,
y
);


pdf.text(
s.name,
55,
y
);


pdf.text(
String(s.score),
130,
y
);


pdf.text(
String(s.quests),
165,
y
);



pdf.setDrawColor(230,230,230);

pdf.line(
20,
y+4,
190,
y+4
);



y += 12;


});



// ===== FOOTER =====


pdf.setFontSize(9);

pdf.setTextColor(120);


pdf.text(
"Powered by The Crate",
20,
285
);



pdf.save(
"game-report.pdf"
);


}

const router = useRouter();


useEffect(()=>{

const unsubscribe =
onAuthStateChanged(
auth,
(user)=>{

if(!user){

router.push("/login");

}

});

return unsubscribe;

},[]);

useEffect(()=>{

if(!gameId){
setMessages([]);
return;
}


return onSnapshot(

gamePath(gameId).messages,

snap=>{

setMessages(
snap.docs.map(d=>({
id:d.id,
...d.data()
}))
);

}

);

},[gameId]);






useEffect(()=>{

if(!gameId){
setQuestRequests([]);
return;
}


return onSnapshot(

collection(
db,
"games",
gameId,
"questRequests"
),

snap=>{

setQuestRequests(
snap.docs.map(d=>({
id:d.id,
...d.data()
}))
);

}

);

},[gameId]);

useEffect(()=>{

const savedGame =
localStorage.getItem("activeGameId");


if(savedGame){

setGameId(savedGame);

}

},[]);


useEffect(()=>{

if(!gameId){

setStudents([]);

return;

}


return onSnapshot(

gamePath(gameId).students,

snap=>{


setStudents(

snap.docs.map(d=>({

id:d.id,

...d.data()

}))

);


}


);


},[gameId]);


async function changeScore(id,value){

await updateDoc(

doc(
db,
"games",
gameId,
"students",
id
),

{
score:increment(value)
}

);

}

async function handleQuest(id,decision){


const request =
questRequests.find(
q=>q.id===id
);


if(!request)return;



await updateDoc(

doc(
db,
"games",
gameId,
"questRequests",
id
),

{
status:decision
}

);





const student =
students.find(
s=>s.id===request.studentId
);



if(!student)return;




const updatedQuests =

(student.quests || [])
.map(q=>{


if(q.id===request.questId){

return {

...q,

status:
decision==="approved"
?
"completed"
:
"available"

};

}


return q;


});




await updateDoc(

doc(
db,
"games",
gameId,
"students",
request.studentId
),

{

quests:updatedQuests

}

);





if(decision==="approved"){


await updateDoc(

doc(
db,
"games",
gameId,
"students",
request.studentId
),

{

score:
increment(request.score || 0)

}

);


}




await addDoc(

gamePath(gameId).messages,

{

fromId:"teacher",

fromName:"Teacher",

toId:request.studentId,

text:

decision==="approved"

?

`✅ Quest "${request.questTitle}" approved! You earned ⭐ ${request.score}`

:

`❌ Quest "${request.questTitle}" was denied.`

,

read:false,

createdAt:serverTimestamp()

}


);


}

async function undoQuestApproval(request){

const student =
students.find(
s => s.id === request.studentId
);

if(!student) return;



const updatedQuests =
(student.quests || []).map(q=>{

if(q.id === request.questId){

return {
...q,
status:"available"
};

}

return q;

});



await updateDoc(

doc(
db,
"games",
gameId,
"students",
request.studentId
),

{
quests:updatedQuests,
score:increment(
-(request.score || 0)
)
}


);



await updateDoc(

doc(
db,
"games",
gameId,
"questRequests",
request.id
),

{
status:"reverted"
}

);



await addDoc(

gamePath(gameId).messages,

{

fromId:"teacher",

fromName:"Teacher",

toId:request.studentId,

text:
`⚠️ Quest "${request.questTitle}" was reverted by the teacher.`,

read:false,

createdAt:serverTimestamp()

}

); 
if(completedRequests.length <= 1){
  setShowCompleted(false);
}

}



async function sendEvent(){

if(
!gameId ||
!actionType ||
!currentGame
)
return;


const eventData =
getModuleEvents(currentGame.moduleId)
.find(
e=>e.type===actionType
);


if(!eventData) return;



await addDoc(

gamePath(gameId).events,

{

type:eventData.type,

title:eventData.title,

audio:eventData.audio || null,

message:eventData.message || 
`Teacher triggered ${eventData.title}`,

module:currentGame.moduleId,

targetStudentId:"ALL",

processed:false,

createdAt:serverTimestamp(),


}

);

}


async function sendMessage(){

if(!messageTarget || !messageText)return;


await addDoc(

gamePath(gameId).messages,

{

fromId:"teacher",

fromName:"Teacher",

toId:messageTarget,

text:messageText,

read:false,

createdAt:serverTimestamp()

}

);


setMessageText("");

}


async function broadcastMessage(){

if(!messageText) return;


students.forEach(async s=>{

await addDoc(

gamePath(gameId).messages,

{

fromId:"teacher",

fromName:"Teacher",

toId:s.id,

text:messageText,

read:false,

createdAt:serverTimestamp()

}

);

});


setMessageText("");

}



return (

  

<div 
className="teacherPage"
style={styles.page}
>

<style>
{mobileStyles}
</style>

{/* HEADER */}

<div 
className="header"
style={styles.header}
>


<div style={styles.brand}>


<img
src="/logo.png"
style={styles.logo}
/>





</div>












<div style={styles.actions}>

{mounted && (
<button
style={styles.blueButton}
onClick={()=>setShowTools(true)}
>
🛠 Tools
</button>

)}

{showTools && (

<div
style={styles.overlay}
onClick={()=>setShowTools(false)}
>


<div
style={styles.toolsModal}
onClick={e=>e.stopPropagation()}
>


<div style={{
textAlign:"center",
marginBottom:10
}}>

<h2 style={{
margin:0,
fontSize:26,
fontWeight:800
}}>
🛠 Teacher Tools
</h2>

<p style={{
color:"#94a3b8",
fontSize:14,
marginTop:8
}}>
Simulation controls & classroom management
</p>

</div>


<button

style={styles.toolButton}

disabled={!currentGame}

onClick={()=>{


const info =
GAME_MODULES[
currentGame.moduleId
]?.getInfo?.(
currentGame.world ||
GAME_MODULES[currentGame.moduleId].generate()
);


setWorldInfo(info);
setShowInfo(true);
setShowTools(false);


}}

>

📋 View World Info

</button>



<button

style={styles.toolButton}

onClick={()=>{

setShowForms(true);
setShowTools(false);

}}

>

📝 Student Forms

</button>




<button

style={styles.toolButton}

onClick={()=>{

setShowCompleted(true);
setShowTools(false);

}}

>

🏆 Completed Quests

</button>





<button

style={{
...styles.toolButton,
background:
"linear-gradient(135deg,#991b1b,#dc2626)",
boxShadow:
"0 8px 20px rgba(220,38,38,.25)"
}}

onClick={()=>{

setShowEndConfirm(true);
setShowTools(false);

}}

>

🏁 End Game

</button>



</div>


</div>

)}

{showForms && (

<div
style={styles.overlay}
onClick={()=>setShowForms(false)}
>

<div
style={styles.completedModal}
onClick={e=>e.stopPropagation()}
>


<div style={styles.modalHeader}>

<h2 style={{margin:0}}>
📝 Student Forms
</h2>

<button
style={styles.closeButton}
onClick={()=>setShowForms(false)}
>
✕
</button>

</div>


{
formSubmissions.map(f=>(


<div
key={f.id}
style={styles.card}
>


<h3>
{f.title}
</h3>


<p>
👤 {f.studentName}
</p>


{
GAME_MODULES[currentGame?.moduleId]
?.forms?.[f.formId]
?.fields
?.map(field=>(

<p key={field.id}>

<b>
{field.label}:
</b>

{" "}

{f.answers[field.id] || "-"}

</p>

))
}


</div>


))

}


</div>

</div>

)}


{

!gameId ?

<>


<select

style={styles.input}

value={selectedModule}

onChange={
e=>setSelectedModule(e.target.value)
}

>

<option key="select-world" value="">
Select world
</option>


{
Object.entries(GAME_MODULES)
.map(([id,m],index)=>(

<option
key={`module-${id}-${index}`}
value={id}
>

{m.title}

</option>

))
}

</select>



<button
style={styles.start}
onClick={startGame}
>

🚀 Launch

</button>


</>

: null

}

</div>



{showReport && finalReport &&

<div
style={styles.overlay}
>

<div
style={styles.completedModal}
>


<h2>
🏆 Final Report
</h2>


<p>
⏱ Duration:
<b>
 {finalReport.duration} minutes
</b>
</p>


<h3>
Leaderboard
</h3>


{
finalReport.leaderboard.map(s=>(

<div
key={s.name}
style={styles.card}
>

<h3>
{s.rank===1?"🥇":s.rank===2?"🥈":s.rank===3?"🥉":""}
{s.name}
</h3>


<p>
⭐ {s.score} pts
</p>


<p>
🎯 {s.quests} quests
</p>


</div>

))

}


<div
style={{
display:"flex",
justifyContent:"center",
gap:15,
marginTop:20
}}
>


<button
style={styles.greenButton}
onClick={downloadPDF}
>
📄 Download PDF
</button>


<button
style={styles.blueButton}
onClick={clearFinishedGame}
>
Close
</button>


</div>


</div>

</div>

}

{gameId && (

<div
style={{
display:"flex",
gap:10,
alignItems:"center"
}}
>


</div>

)}
</div>

{showCompleted && (

<div
style={styles.overlay}
onClick={()=>setShowCompleted(false)}
>

<div
style={styles.completedModal2}
onClick={(e)=>e.stopPropagation()}
>

<div style={styles.modalHeader}>

<h2 style={{margin:0}}>
🏆 Completed Quests
</h2>

<button
style={styles.closeButton}
onClick={()=>setShowCompleted(false)}
>
✕
</button>

</div>


<div style={styles.modalBody}>

{
completedRequests.length === 0

?

<div style={styles.emptyState}>
No approved quests yet.
</div>

:

completedRequests.map(q=>(

<div
key={q.id}
style={styles.completedQuestCard}
>

<div>

<h4>
{q.questTitle}
</h4>

<p>
👤 {q.studentName}
</p>

<p>
⭐ {q.score}
</p>

</div>


<button
style={styles.undoButton}
onClick={()=>undoQuestApproval(q)}
>
↩ Undo
</button>


</div>

))

}

</div>

</div>

</div>

)}

{showEndConfirm && (
  <div
    style={styles.overlay}
    onClick={()=>setShowEndConfirm(false)}
  >

    <div
      style={styles.confirmModal}
      onClick={(e)=>e.stopPropagation()}
    >

      <h2>
        🏁 End Simulation?
      </h2>

      <p>
        Are you sure you want to end the game?
        <br/>
        Final reports will be generated.
      </p>


      <div style={styles.confirmButtons}>

        <button
          style={styles.red}
          onClick={async ()=>{
            setShowEndConfirm(false);
            await endGame();
          }}
        >
          End Game
        </button>


        <button
          style={styles.blueButton}
          onClick={()=>
            setShowEndConfirm(false)
          }
        >
          Cancel
        </button>

      </div>


    </div>

  </div>
)}

{showInfo && worldInfo && (

<div
style={styles.overlay}
onClick={()=>setShowInfo(false)}
>

<div
style={styles.infoModal}
onClick={(e)=>e.stopPropagation()}
>

<div style={styles.modalHeader}>

<h2>
📋 {worldInfo.title}
</h2>

<button
style={styles.closeButton}
onClick={()=>setShowInfo(false)}
>
✕
</button>

</div>


<div style={styles.modalBody}>

{
worldInfo.data?.map((item,index)=>(

<div
key={index}
style={styles.infoRow}
>

{
Object.entries(item).map(([key,value])=>(

<div key={key}>

<b>
{key}
:
</b>

{" "}
{value}

</div>

))

}

</div>

))

}


</div>


</div>


</div>

)}

{/* MAIN GRID */}


<div style={styles.panel}>


<h3>
👥 Students
</h3>


{
[...students]

.sort((a,b)=>
(b.score || 0) - (a.score || 0)
)

.map((s,index)=>(


<div

key={s.id}

style={{
...styles.playerCard,

border:
selectedId===s.id
?
"2px solid #3b82f6"
:
"1px solid transparent"

}}

onClick={()=>setSelectedId(s.id)}

>


<div>

<h4>
{s.name}
</h4>

<p>
🎭 {s.role}
</p>

<div style={styles.scoreBadge}>
⭐ {s.score || 0} pts
</div>


</div>



<div>


<button

style={styles.plusButton}

onClick={(e)=>{

e.stopPropagation();

changeScore(s.id,1)

}}

>

+

</button>



<button

style={styles.minusButton}

onClick={(e)=>{

e.stopPropagation();

changeScore(s.id,-1)

}}

>

−

</button>


</div>



</div>


))

}



</div>








<div style={styles.panel}>


<h3>
🎯 Quests
</h3>


{
questRequests
.filter(q=>q.status==="pending")
.map(q=>(


<div
key={q.id}
style={styles.card}
>


<h4>
🎯 {q.questTitle}
</h4>


<p>
👤 Student:
<b>
 {q.studentName}
</b>
</p>


<p>
⭐ Reward:
{q.score}
</p>

{q.message && (

<p
  style={{
    background:"#0f172a",
    padding:10,
    borderRadius:8,
    marginTop:10,
    whiteSpace:"pre-wrap"
  }}
>
  💬 {q.message}
</p>

)}

<div
style={{
display:"flex",
gap:10
}}
>


<button

style={styles.greenButton}

onClick={()=>
handleQuest(q.id,"approved")
}

>

✅ Approve

</button>




<button

style={styles.red}

onClick={()=>
handleQuest(q.id,"rejected")
}

>

❌ Deny

</button>



</div>



</div>


))

}


</div>








<div style={styles.panel}>


<h3>
📩 Inbox
</h3>


{
messages
.filter(m=>m.toId==="teacher")
.sort(
(a,b)=>
(b.createdAt?.seconds || 0)
-
(a.createdAt?.seconds || 0)
)
.map(m=>(


<div
key={m.id}
style={styles.card}
>

<b>
{m.fromName}
</b>


<p>
{m.text}
</p>


</div>


))
}



</div>




{/* DOCK */}

<div 
className="dock"
style={styles.dock}
>


{/* EVENTS */}

<div style={styles.dockBox}>

<h3>
⚡ Events
</h3>


<select

style={styles.input}

value={actionType}

onChange={
e=>setActionType(e.target.value)
}

>

<option key="choose-event" value="">
Choose event
</option>


{

gameId &&

getModuleEvents(
currentGame?.moduleId
)
.map((e,index)=>(

<option
key={`event-${e.type}-${index}`}
value={e.type}
>

{e.title}

</option>

))

}


</select>


<button
style={styles.blueButton}
onClick={sendEvent}
>

Send Event

</button>


</div>





{/* MESSAGE */}

<div style={styles.dockBox}>


<div style={styles.messageHeader}>
  <h3 style={{margin:0}}>
    📡 Message
  </h3>

  <div style={styles.messageButtons}>
    <button
      style={styles.smallBlueButton}
      onClick={sendMessage}
    >
      Send
    </button>

    <button
      style={styles.smallGreenButton}
      onClick={broadcastMessage}
    >
      Send to All
    </button>
  </div>
</div>


<select

style={styles.input}

value={messageTarget}

onChange={
e=>setMessageTarget(e.target.value)
}

>

<option key="select-student" value="">
Select student
</option>


{
students.map(s=>(

<option
key={s.id}
value={s.id}
>

{s.name}

</option>

))

}


</select>



<textarea

style={styles.textarea}

placeholder="Write message..."

value={messageText}

onChange={
e=>setMessageText(e.target.value)
}

/>





</div>







{/* INFO */}

<div style={styles.dockBox}>


<h3>
🎮 Simulation Control
</h3>


<p>
👥 Players:
<b>
 {students.length}
</b>
</p>


<p>

🌎 World: 

<b>
{
gameId
?
GAME_MODULES[currentGame?.moduleId]?.title || "-"
:
"-"
}

</b>

</p>
</div>
</div>
</div>

)

}







const styles={


page:{
display:"grid",
gridTemplateColumns:"repeat(3,1fr)",
gridTemplateRows:"90px minmax(0,1fr) 180px",
gap:15,
padding:15,
height:"100vh",
},



header:{

gridColumn:"1 / -1",

background:
"linear-gradient(135deg,#172554,#1e293b)",

borderRadius:20,

padding:"15px 25px",

display:"flex",

alignItems:"center",

justifyContent:"space-between",
width: "100%"

},




brand:{

display:"flex",

alignItems:"center",

gap:20

},



logo:{

width:80,

height:80,

objectFit:"contain"

},



title:{

fontSize:30,

fontWeight:800

},




status:{

background:"#0f172a",

padding:15,

borderRadius:15

},



actions:{

display:"flex",

gap:10,

alignItems:"center",
marginLeft:"auto"

},



panel:{

background:"#111827",

padding:18,

borderRadius:20,

overflowY:"auto",

minHeight:0,

boxShadow:
"0 15px 30px rgba(0,0,0,.25)"

},




playerCard:{

background:"#1e293b",

padding:15,

borderRadius:15,

marginBottom:10,

display:"flex",

justifyContent:"space-between"

},




card:{

background:"#1f2937",

padding:10,

borderRadius:10,

marginBottom:10,
marginTop: 10
},




input:{

background:"#020617",

color:"white",

padding:10,

borderRadius:8,

border:"1px solid #374151"

},

dock:{

gridColumn:"1 / -1",

background:
"linear-gradient(135deg,#111827,#0f172a)",

padding:15,

borderRadius:22,

display:"grid",

gridTemplateColumns:
"1fr 1.5fr 1fr",

gap:15,

alignItems:"stretch",

boxShadow:
"0 15px 40px rgba(0,0,0,.45)",

overflow:"hidden"

},



dockBox:{
  background:"#0b1220",
  padding:12,
  borderRadius:15,
  display:"flex",
  flexDirection:"column",
  gap:8,
  minHeight:0
},

textarea:{
  height:70,
  resize:"none",
  overflow:"hidden",
  background:"#020617",
  color:"white",
  border:"1px solid #374151",
  borderRadius:8,
  padding:10,
  boxSizing:"border-box",
  display:"block"
},

messageButtons:{
  display:"flex",
  justifyContent:"flex-end",
  gap:10,
  marginTop:"auto"
},



blueButton:{

background:"#2563eb",
color:"white",
border:"none",
padding:"8px 14px",
borderRadius:8,
cursor:"pointer",
fontWeight:"600",
},



greenButton:{

background:"#16a34a",

color:"white",

border:"none",

padding:"8px 14px",

borderRadius:8,

cursor:"pointer",

fontWeight:"600"

},




start:{

background:"#2563eb",

color:"white",

padding:10,

borderRadius:8,
cursor: "pointer"

},



red:{

background:"#dc2626",

color:"white",

padding:10,

borderRadius:8,
cursor: "pointer"

},

scoreBadge:{

background:"#020617",
padding:"8px 14px",
borderRadius:20,
display:"inline-block",
marginTop:8,
fontWeight:"800",
fontSize:12,
color:"#facc15"
},



plusButton:{

background:"#16a34a",
color:"white",
border:"none",
width:30,
height:30,
borderRadius:5,
cursor:"pointer",
fontWeight:"800",
fontSize:15,
transition:"all .2s",
marginRight: 5

},



minusButton:{
background:"#dc2626",
color:"white",
border:"none",
width:30,
height:30,
borderRadius:3,
cursor:"pointer",
fontWeight:"800",
fontSize:15,
transition:"all .2s",



},

messageHeader:{
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  marginBottom:8
},


smallBlueButton:{
  background:"#2563eb",
  color:"white",
  border:"none",
  padding:"4px 10px",
  borderRadius:6,
  cursor:"pointer",
  fontSize:12,
  fontWeight:"600"
},

smallGreenButton:{
  background:"#16a34a",
  color:"white",
  border:"none",
  padding:"4px 10px",
  borderRadius:6,
  cursor:"pointer",
  fontSize:12,
  fontWeight:"600"
},
overlay:{
position:"fixed",
inset:0,
background:"rgba(0,0,0,.65)",
display:"flex",
alignItems:"center",
justifyContent:"center",
zIndex:9999,
animation:"fadeIn .2s ease",
backdropFilter:"blur(14px)",
WebkitBackdropFilter:"blur(14px)",
},

completedModal:{
width:500,
maxHeight:"80vh",
overflowY:"auto",
background:"linear-gradient(145deg,#111827,#020617)",
padding:20,
borderRadius:24,
border:"1px solid #374151",
boxShadow:"0 25px 70px rgba(0,0,0,.7)",
textAlign:"center",
animation:"popIn .75s ease"
},

completedModal2:{
width:500,
maxHeight:"80vh",
overflowY:"auto",
background:"linear-gradient(145deg,#111827,#020617)",
borderRadius:24,
border:"1px solid #374151",
boxShadow:"0 25px 70px rgba(0,0,0,.7)",
textAlign:"center",
animation:"popIn .75s ease"
},

modalHeader:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
padding:"20px",
borderBottom:"1px solid #374151"
},

modalBody:{
padding:"20px",
overflowY:"auto",
maxHeight:"65vh"
},

closeButton:{
background:"#dc2626",
color:"white",
border:"none",
width:"36px",
height:"36px",
borderRadius:"8px",
cursor:"pointer",
fontWeight:"bold"
},

completedQuestCard:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
padding:"15px",
marginBottom:"12px",
background:"#1f2937",
borderRadius:"12px"
},

undoButton:{
background:"#dc2626",
color:"white",
border:"none",
padding:"10px 14px",
borderRadius:"8px",
cursor:"pointer",
fontWeight:"600"
},

emptyState:{
textAlign:"center",
padding:"40px",
color:"#94a3b8"
},

confirmModal:{

background:"linear-gradient(145deg,#111827,#020617)",

padding:35,

borderRadius:24,

width:420,

textAlign:"center",

border:"1px solid #374151",

boxShadow:"0 25px 70px rgba(0,0,0,.7)"

},

confirmButtons:{

display:"flex",

justifyContent:"center",

alignItems:"center",

gap:15,

marginTop:25

},

infoModal:{

width:600,

maxHeight:"80vh",

background:
"linear-gradient(145deg,#111827,#020617)",

borderRadius:24,

overflow:"hidden",

border:"1px solid #334155",

boxShadow:
"0 30px 80px rgba(0,0,0,.8)",
animation:"popIn .75s ease"

},


flightTable:{

width:"100%",

borderCollapse:"collapse",

marginTop:10,

color:"white"

},
toolsModal:{

width:380,

background:
"linear-gradient(145deg,#0f172a,#020617)",

padding:30,

borderRadius:24,

border:"1px solid rgba(148,163,184,.25)",

boxShadow:
"0 30px 90px rgba(0,0,0,.8)",

display:"flex",

flexDirection:"column",

gap:15,
animation:"popIn .25s ease",

},


toolButton:{

width:"100%",

padding:"12px",

marginTop:10,

border:"none",

borderRadius:10,

background:
"linear-gradient(135deg,#1e40af,#2563eb)",

color:"white",

fontWeight:"700",

cursor:"pointer",

transition:"all .2s",

boxShadow:
"0 8px 20px rgba(37,99,235,.25)"

},



};

const mobileStyles = `

@keyframes fadeIn {

from {
  opacity:0;
}

to {
  opacity:1;
}


}


@keyframes popIn {

from {

  opacity:0;

  transform:scale(.95);

}


to {

  opacity:1;

  transform:scale(1);

}

}


@media(max-width:900px){

.teacherPage{

grid-template-columns:1fr !important;

grid-template-rows:auto;

overflow:auto;

}


.dock{

grid-template-columns:1fr !important;

}


.header{

flex-direction:column;

gap:15px;

}


.logo{

width:60px !important;

height:60px !important;

}


.panel{

max-height:none;

}

}

`;

