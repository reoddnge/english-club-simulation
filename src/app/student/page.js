"use client";

import {
  useEffect,
  useState,
  useRef,
  useMemo
} from "react";

import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";

import {
  db 
} from "@/lib/firebase";

import {
  processEvent
} from "@/lib/eventEngine";

import {
 GAME_MODULES
} from "@/lib/gameModules";

import {
  gamePath
} from "@/lib/gameManager";

export default function StudentPage(){


const [students,setStudents]=useState([]);
const [activeStudentId,setActiveStudentId]=useState(null);
const [gameId,setGameId]=useState(null);
const [messages,setMessages]=useState([]);
const [event,setEvent]=useState(null);
const [showInbox,setShowInbox]=useState(false);
const [messageText,setMessageText]=useState("");
const [selectedTarget,setSelectedTarget]=useState("");
const [toast,setToast]=useState(null);
const [lastToastId,setLastToastId]=useState(null);
const [initialized,setInitialized]=useState(false);
const toastTimer = useRef(null);
const [toastVisible,setToastVisible]=useState(false);
const lastMessageRef = useRef(null);
const processedEvents = useRef(new Set());
const studentMap = useMemo(()=>{
  return Object.fromEntries(
  students.map(s=>[
  s.id,
  s.name
  ])
  );
},[students]);
const [questRequests,setQuestRequests]=useState([]);
const messageSound = useRef(null);
const eventSound = useRef(null);
const [report,setReport]=useState(null);
const [gameData,setGameData]=useState(null);
const [showPlayers,setShowPlayers] = useState(false);
const [questMessage, setQuestMessage] = useState("");
const [formData,setFormData] = useState({});
const [showForms,setShowForms] = useState(false);
const announcementAudio = useRef(null);
const [showTools,setShowTools] = useState(false);
const [showGuide,setShowGuide] = useState(false);
const [showAI,setShowAI] = useState(false);
const [aiQuestion,setAiQuestion] = useState("");
const [aiAnswer,setAiAnswer] = useState("");
const [aiLoading,setAiLoading] = useState(false);
/* ================= SESSION ================= */
useEffect(()=>{

messageSound.current = new Audio("/audio/notification.mp3");
messageSound.current.volume = 0.7;


eventSound.current = new Audio("/audio/event.mp3");
eventSound.current.volume = 0.7;


},[]);


useEffect(()=>{

const params =
new URLSearchParams(
window.location.search
);


const urlStudent =
params.get("student");


const urlGame =
params.get("game");


const student =
urlStudent ||
localStorage.getItem("studentId");


const game =
urlGame ||
localStorage.getItem("activeGameId");


if(student)
localStorage.setItem(
"studentId",
student
);


if(game)
localStorage.setItem(
"activeGameId",
game
);


setActiveStudentId(student);

setGameId(game);


setActiveStudentId(student);

setGameId(game);


},[]);





/* ================= Very CLEAN TOAST ================= */


useEffect(()=>{


return ()=>{


if(toastTimer.current){

clearTimeout(
toastTimer.current
);

}


};


},[]);







/* ================= STUDENTS ================= */


useEffect(()=>{


if(!gameId){

setStudents([]);

return;

}



const unsub =
onSnapshot(

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



return unsub;


},[gameId]);






const me =
students.find(
s=>s.id===activeStudentId
)
|| null;


const currentModule =
gameData?.moduleId
?
GAME_MODULES[gameData.moduleId]
:
null;

const Guide =
currentModule?.guide || null;

const availableForms =
currentModule?.forms || {};

const roleData =
me && currentModule
?
currentModule.roles?.[me.role]
:
null;


const roleDescription =
roleData?.description ||
"No role description";







/* ================= EVENTS ================= */


useEffect(()=>{


if(
!gameId ||
!activeStudentId ||
students.length===0
)
return;



const unsub = onSnapshot(

gamePath(gameId).events,


async snap=>{


const events =
snap.docs.map(d=>({

id:d.id,

...d.data()

}));




const student =
students.find(
s=>s.id===activeStudentId
);



if(!student)return;




const myEvents =
events.filter(e=>

(
e.targetStudentId===activeStudentId ||
e.targetStudentId==="ALL"
)
&&
e.processed !== true

);




for(const e of myEvents){


if(processedEvents.current.has(e.id)){
  continue;
}


processedEvents.current.add(e.id);



await processEvent(
  e,
  student,
  gameId
);



await updateDoc(

doc(
db,
"games",
gameId,
"events",
e.id
),

{

processed:true

}

);



setEvent(e);



if(eventSound.current){

eventSound.current.currentTime = 0;

eventSound.current.play()
.catch(err=>console.log(err));

}


}


}


);



return unsub;



},[
gameId,
activeStudentId,
students.length
]);








/* ================= MESSAGES ================= */


useEffect(()=>{


if(!gameId){

setMessages([]);

return;

}



const unsub =
onSnapshot(

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



return unsub;



},[gameId]);






const inbox =

messages

.filter(m=>

m.toId===activeStudentId

||

m.toId==="ALL"

)

.sort(
(a,b)=>
(b.createdAt?.seconds||0)
-
(a.createdAt?.seconds||0)
);





const unreadCount =
inbox.filter(
m=>!m.read
).length;


useEffect(()=>{

if(!gameId)return;


return onSnapshot(

doc(db,"games",gameId),

snap=>{

const data=snap.data();

if(data?.finalReport){

setReport(data.finalReport);

}

}

);


},[gameId]);



async function openMessage(msg){

lastMessageRef.current = msg.id;


setLastToastId(msg.id);


if(msg.read)
return;



await updateDoc(

doc(
db,
"games",
gameId,
"messages",
msg.id
),

{

read:true

}

);


setMessages(prev=>

prev.map(m=>

m.id===msg.id

?

{
...m,
read:true
}

:

m

)

);


}









/* ================= QUEST REQUESTS ================= */


useEffect(()=>{


if(!gameId){

setQuestRequests([]);

return;

}




const unsub =
onSnapshot(

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



return unsub;



},[gameId]);









/* ================= TOAST ================= */


useEffect(()=>{


if(!activeStudentId)return;



const unread =

messages.filter(m=>

(
m.toId===activeStudentId
||
m.toId==="ALL"
)
&&
!m.read
&&
m.fromId !== activeStudentId

);



const newest =
[...unread]
.sort(
(a,b)=>
(b.createdAt?.seconds||0)
-
(a.createdAt?.seconds||0)
)[0];




if(!initialized){


if(newest){

setLastToastId(
newest.id
);

}


setInitialized(true);

return;


}



if(
newest &&
newest.id!==lastToastId &&
newest.id!==lastMessageRef.current
){


setLastToastId(
newest.id
);
lastMessageRef.current = newest.id;


setToast({


  

sender:

newest.fromId==="teacher"

?

"👨‍🏫 Teacher"

:

studentMap[newest.fromId] || "👤 Player",


text:newest.text


});

setToastVisible(true);


if(messageSound.current){

messageSound.current.currentTime = 0;

messageSound.current.play()
.then(()=>{
console.log("sound played");
})
.catch(err=>{
console.log("sound failed",err);
});

}


if(toastTimer.current)

clearTimeout(
toastTimer.current
);



toastTimer.current =
setTimeout(()=>{

setToastVisible(false);


setTimeout(()=>{

setToast(null);

},500);

},5000);



}



},[
messages,
activeStudentId,
initialized,
lastToastId
]);


/* ================= game data ================= */

useEffect(()=>{


if(!gameId)
return;


return onSnapshot(

doc(db,"games",gameId),

snap=>{

setGameData({

id:snap.id,

...snap.data()

});

}

);


},[gameId]);


/* ================= audio ================= */



/* ================= QUEST ================= */


async function submitQuest(q){


if(!me)return;



const updated =

(me.quests||[])
.map(item=>{


if(item.id===q.id)

return {

...item,

status:"waiting"

};


return item;


});





await updateDoc(

doc(
db,
"games",
gameId,
"students",
activeStudentId
),

{

quests:updated

}

);





await addDoc(

collection(
db,
"games",
gameId,
"questRequests"
),

{

studentId:activeStudentId,

studentName:me.name,

questId:q.id,

questTitle:q.title,

score:q.score||0,

status:"pending",
message: questMessage,
createdAt:serverTimestamp()

}


);


}









/* ================= SEND MESSAGE ================= */


async function sendMessage(){


if(
!messageText ||
!selectedTarget ||
!activeStudentId
)
return;



await addDoc(

gamePath(gameId).messages,

{

fromId:activeStudentId,

fromName:me.name,

toId:selectedTarget,

text:messageText,

read:false,

createdAt:serverTimestamp()

}


);

async function showStudentList() {


}

setMessageText("");

setSelectedTarget("");


}







if(!me)

return (

<div style={styles.page}>

Waiting for player...

</div>

);





return (

  

<div style={styles.page}>

<style>
{mobileStyles}
</style>

<div style={styles.hud} className="studentHud">


<div>

<p style={styles.worldName}>
🌎 {currentModule?.title}
</p>


<h2 style={styles.playerName}>
👤 {me.name}
</h2>


<p style={styles.playerRole}>
🎭 {me.role}
</p>





<div style={styles.studentScore}>
⭐ {me.score || 0}
</div>


</div>




<div className="studentActions">


<button

style={styles.blueButton}

onClick={()=>setShowTools(true)}

>

🛠 Tools

</button>



<button
style={styles.blueButton}

onClick={()=>setShowInbox(true)}

>

💬 Inbox


{
unreadCount > 0 &&

<span style={styles.badge}>

{unreadCount}

</span>

}


</button>


</div>

</div>

{
showTools && (

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
🧰 Student Tools
</h2>


<p style={{
color:"#94a3b8",
fontSize:14,
marginTop:8
}}>
Player controls & classroom interaction
</p>


</div>



<button

style={styles.toolButton}

onClick={()=>{

setShowGuide(true);
setShowTools(false);

}}

>

📘 View Guide

</button>



<button

style={styles.toolButton}

onClick={()=>{

setShowPlayers(true);
setShowTools(false);

}}

>

👥 View Players

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



</div>


</div>

)}

{
showGuide && Guide &&

<div

style={styles.overlay}

onClick={()=>setShowGuide(false)}

>


<div

style={styles.formModal}

onClick={e=>e.stopPropagation()}

>


<button

style={styles.closeBtn}

onClick={()=>setShowGuide(false)}

>

✖

</button>


<Guide />


</div>


</div>

}

{
showPlayers &&

<div
style={styles.overlay}
onClick={()=>setShowPlayers(false)}
>

<div
style={styles.playersModal}
onClick={e=>e.stopPropagation()}
>

<button
style={styles.closeBtn}
onClick={()=>setShowPlayers(false)}
>
✖
</button>

<h2 style={{marginBottom:10}}>
👥 Active Players
</h2>

{
students.map(s=>(

<div
key={s.id}
style={styles.playerRow}
>

<div>
<b>{s.name}</b>
</div>

<div>
🎭 {s.role}
</div>

</div>

))
}

</div>

</div>
}


{event &&

<div style={styles.overlay}>

<div style={styles.eventModal}>


<div style={styles.eventIcon}>
🎯
</div>


<h1 style={styles.eventTitle}>
{event.title || event.type}
</h1>


{
event.audio && (

<button

style={styles.audioButton}

onClick={()=>{

if(announcementAudio.current){

announcementAudio.current.pause();

}


announcementAudio.current =
new Audio(event.audio);


announcementAudio.current.currentTime = 0;


announcementAudio.current.play()
.catch(err=>console.log(err));


}}

>

🔊 Play Announcement

</button>

)

}



<p style={styles.eventDescription}>
{event.description}
</p>


<button
style={styles.eventButton}
onClick={()=>{

if(announcementAudio.current){

announcementAudio.current.pause();

announcementAudio.current = null;

}

setEvent(null);

}}
>

Continue 🚀

</button>


</div>

</div>

}






<div style={styles.card}>

<h3>
📘 Role description
</h3>

<p>

{
roleDescription || "No role description"
}

</p>

</div>





<div style={styles.card}>


<h3>
🎯 Quests
</h3>



{

(me.quests||[])
.map(q=>(



<div
key={q.id}
style={styles.questCard}
>



<b>
{q.title}
</b>

<p>
{q.description}
</p>

<p>

⭐ {q.score}

</p>


{q.visibleInfo && (

<div
style={{
background:"#020617",
padding:10,
borderRadius:8,
marginTop:10,
whiteSpace:"pre-line"
}}
>

{
q.dynamicInfo === "flights"

?

gameData?.world?.flights?.map(f=>

`${f.number} | ${f.destination} | Gate ${f.gate} | Departure ${f.departureTime}`

).join("\n")

:

q.info
}



</div>

)}
<div
  style={{
    marginTop:15,
    background:"#0b1220",
    border:"1px solid #334155",
    borderRadius:14,
    overflow:"hidden"
  }}
>

  <div
    style={{
      background:"#1e293b",
      padding:"10px 14px",
      fontWeight:"600"
    }}
  >
    📝 Quest Report
  </div>

  <textarea
    value={questMessage}
    onChange={(e)=>
      setQuestMessage(
        e.target.value.slice(0,300)
      )
    }
    placeholder="Describe what you did to complete this quest..."
    style={{
      width:"100%",
      minHeight:120,
      background:"#020617",
      color:"white",
      border:"none",
      outline:"none",
      resize:"vertical",
      padding:"14px",
      boxSizing:"border-box",
      fontSize:14,
      lineHeight:1.5
    }}
  />

  <div
    style={{
      padding:"8px 14px",
      fontSize:12,
      opacity:.7,
      textAlign:"right"
    }}
  >
    {questMessage.length}/300
  </div>

</div>
<button

style={{

...styles.completeBtn,

background:

q.status==="waiting"

?

"#64748b"

:

q.status==="completed"

?

"#16a34a"

:

"#2563eb",

cursor:
q.status==="available"
?
"pointer"
:
"default"

}}

disabled={
q.status==="waiting" ||
q.status==="completed"
}

onClick={()=>submitQuest(q)}

>

{

q.status==="waiting"

?

"⏳ Waiting"

:

q.status==="completed"
?
"🏆 Completed"
:
q.status==="waiting"
?
"⏳ Awaiting approval"
:
"🚀 Submit Quest"

}




</button>


</div>


))


}


</div>
<div style={styles.inventoryCard}>

  <h3 style={styles.inventoryTitle}>
    🎒 Inventory
  </h3>

  {
    (me.inventory || []).length === 0
    ?
    <div style={styles.emptyInventory}>
      No items yet
    </div>
    :
    <div style={styles.inventoryGrid}>

      {
        me.inventory.map(item => (

          <div
            key={item}
            style={styles.inventoryItem}
          >

            <span style={styles.itemIcon}>
              📦
            </span>

            {item}

          </div>

        ))
      }

    </div>
  }

</div>

{showForms && (

<div
style={styles.overlay}
onClick={()=>setShowForms(false)}
>


<div
style={styles.formModal}
onClick={e=>e.stopPropagation()}
>


<button
style={styles.closeBtn}
onClick={()=>setShowForms(false)}
>
✖
</button>


<h2 style={styles.formTitle}>
📝 Available Forms
</h2>


<div style={styles.formsContainer}>

{
Object.values(availableForms).map(form=>(

<div
key={form.id}
style={styles.formCard}
>


<h3 style={styles.formName}>
{form.title}
</h3>


<div style={styles.formFields}>

{
form.fields.map(field=>(


<div
key={field.id}
style={styles.fieldGroup}
>


<label style={styles.label}>
{field.label}
</label>


{
field.type==="select"


?


<select

style={styles.formInput}

value={
formData[field.id] || ""
}

onChange={
e=>

setFormData({

...formData,

[field.id]:
e.target.value

})

}

>

<option>
Select
</option>


{
field.options.map(o=>(

<option key={o}>
{o}
</option>

))
}


</select>


:


<input

style={styles.formInput}

type={field.type}

value={
formData[field.id] || ""
}

onChange={
e=>

setFormData({

...formData,

[field.id]:
e.target.value

})

}

/>


}


</div>


))

}

</div>



<button

style={styles.submitFormBtn}

onClick={async()=>{


await addDoc(

collection(
db,
"games",
gameId,
"formSubmissions"
),

{

studentId:activeStudentId,

studentName:me.name,

formId:form.id,

title:form.title,

answers:formData,

status:"pending",

createdAt:serverTimestamp()

}

);


setFormData({});

setShowForms(false);


}}

>

Submit Form 🚀

</button>


</div>


))

}

</div>


</div>

</div>

)}
{
showAI &&

<div

style={styles.overlay}

onClick={()=>setShowAI(false)}

>


<div

style={styles.formModal}

onClick={e=>e.stopPropagation()}

>


<button

style={styles.closeBtn}

onClick={()=>setShowAI(false)}

>

✖

</button>


<h2
style={{
textAlign:"center"
}}
>
🤖 English Helper
</h2>


<p
style={{
color:"#94a3b8",
textAlign:"center"
}}
>

Ask how to say something naturally in English.

</p>



<textarea

style={styles.messageBox}

placeholder=
"Example: How do I tell a customer the flight is delayed?"

value={aiQuestion}

onChange={
e=>setAiQuestion(e.target.value)
}

/>



<button

style={styles.completeBtn}

onClick={async()=>{


if(!aiQuestion)
return;


setAiLoading(true);


try{


const res =
await fetch("/api/english-helper",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

question:aiQuestion,

role:me.role,

world:currentModule?.title

})

});


const data =
await res.json();


setAiAnswer(
data.answer
);


}

catch(err){

console.log(err);

setAiAnswer(
"AI connection error."
);

}

finally{

setAiLoading(false);

}



}}

>


{
aiLoading
?
"Thinking..."
:
"Ask AI"
}


</button>



{

aiAnswer &&

<div

style={{

marginTop:20,

background:"#020617",

padding:15,

borderRadius:12,

whiteSpace:"pre-wrap"

}}

>

{aiAnswer}

</div>

}


</div>


</div>

}

{showInbox &&

<div 
style={styles.overlay}
onClick={()=>setShowInbox(false)}
>

<div 
style={styles.inboxModal}
onClick={e=>e.stopPropagation()}
>


<button
style={styles.closeBtn}
onClick={()=>setShowInbox(false)}
>
✖
</button>


<div style={styles.inbox}>


<h3 style={styles.inboxTitle}>
📥 Inbox
</h3>



{

inbox.map(m=>(


<div

key={m.id}

style={{
...styles.message,
background:m.read
?
"#111827"
:
"linear-gradient(135deg,#2563eb,#1e40af)"
}}

onClick={()=>openMessage(m)}

>


<b>

{
m.fromName || "Player"
}

</b>


<p>

{m.text}

</p>


</div>


))


}


</div>






<div style={styles.compose}>






<select
style={styles.select}

value={selectedTarget}

onChange={
e=>setSelectedTarget(e.target.value)
}

>

<option>
Select
</option>


{

students.map(p=>(


<option
key={p.id}
value={p.id}
>

{p.name}

</option>


))

}



<option value="teacher">

Teacher

</option>



<option value="ALL">

All

</option>



</select>





<textarea

style={styles.messageBox}

placeholder="Write a message..."

value={messageText}

onChange={
e=>setMessageText(e.target.value)
}

/>



<button
onClick={sendMessage}
>

Send

</button>




</div>

</div>

</div>

}






{toast &&

<div 
style={{
...styles.toast,

opacity: toastVisible ? 1 : 0,

transform:
toastVisible
?
"translateY(0)"
:
"translateY(-30px)"

}}
>


<b>
{toast.sender}
</b>


<p>
{toast.text}
</p>


</div>

}

{report &&

<div style={styles.overlay}>


<div style={styles.reportBox}>


<h2 style={{marginBottom:10, fontSize:25}}>
🏆 Final Report
</h2>


<div style={styles.reportStats}>

<p>
⏱ <b>{report.duration}</b> minutes
</p>


<p>
👥 <b>{report.studentsCount}</b> players
</p>


<p>
🥇 Winner:
<b> {report.winner}</b>
</p>


</div>



<h3>
Leaderboard
</h3>


{
report.leaderboard.map(s=>(

<div
key={s.id || s.name}
style={styles.card}
>


<h4>

{s.rank===1?"🥇":
s.rank===2?"🥈":
s.rank===3?"🥉":""}

{s.name}

</h4>


<p>
⭐ {s.score} points
</p>


<p>
🎯 {s.quests} quests
</p>


</div>

))

}


<button

style={styles.completeBtn}

onClick={()=>setReport(null)}

>

Close

</button>



</div>


</div>

}


</div>

)

}







const styles={


page:{
minHeight:"100vh",
background:"#0b1220",
color:"white",
padding:20
},


hud:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:10,
width:"100%"
},


completedModal:{

width:550,

maxHeight:"80vh",

overflowY:"auto",

background:
"linear-gradient(145deg,#111827,#020617)",

padding:25,

borderRadius:24,

border:"1px solid rgba(148,163,184,.2)",

boxShadow:
"0 30px 80px rgba(0,0,0,.8)",

color:"white"

},


card:{

background:
"linear-gradient(135deg,#1e293b,#0f172a)",

padding:18,

borderRadius:16,

marginBottom:15,

border:
"1px solid rgba(148,163,184,.15)",

boxShadow:
"0 10px 25px rgba(0,0,0,.25)"

},


questCard:{
background:"#0f172a",
padding:12,
marginTop:10,
borderRadius:10,
boxShadow: "0px 10px 40px rgba(0,0,0,.7)"
},


completeBtn:{
background:"#2563eb",
color:"white",
border:"none",
padding:"8px 14px",
borderRadius:8,
cursor:"pointer",
fontWeight:"600",
marginTop: 20
},


blueButton:{

background:"#2563eb",
color:"white",
padding:"12px 20px",
border:"none",
borderRadius:8,
cursor:"pointer",
fontSize:15,
fontWeight:"bold",
display:"flex",
alignItems:"center",
gap:8,
marginTop:5,
fontWeight:"600",
animation:"popIn .25s ease"
},


badge:{
background:"#ef4444",
color:"white",
minWidth:22,
height:22,
borderRadius:"50%",
display:"flex",
alignItems:"center",
justifyContent:"center",
fontSize:12,
fontWeight:"bold"
},


overlay:{
position:"fixed",
inset:0,
background:"rgba(0,0,0,.65)",
backdropFilter:"blur(14px)",
WebkitBackdropFilter:"blur(14px)",
display:"flex",
alignItems:"center",
justifyContent:"center",
zIndex:1000,
animation:"fadeIn .2s ease",
},


eventModal:{
width:420,
background:"linear-gradient(145deg,#1e293b,#020617)",
padding:"35px 40px",
borderRadius:24,
textAlign:"center",
boxShadow:"0 25px 70px rgba(0,0,0,.6)",
border:"1px solid rgba(255,255,255,.1)",
animation:"popIn .25s ease"
},

eventIcon:{
width:80,
height:80,
margin:"0 auto 15px",
borderRadius:"50%",
background:"linear-gradient(135deg,#2563eb,#7c3aed)",
display:"flex",
alignItems:"center",
justifyContent:"center",
fontSize:40,
boxShadow:"0 10px 30px rgba(37,99,235,.5)"
},

eventButton:{
marginTop:25,
width:"100%",
padding:"12px",
border:"none",
borderRadius:12,
background:"#2563eb",
color:"white",
fontSize:16,
fontWeight:"800",
cursor:"pointer"
},

inboxModal:{
position:"relative",
width:"95%",
maxWidth:700,
height:"85vh",
background:"#111827",
display:"flex",
flexDirection:"column",
borderRadius:20,
overflow:"hidden",
paddingTop:40
},


inbox:{
padding:15,
overflowY:"auto",
flex:1,
minHeight:0
},


compose:{
padding:15,
display:"flex",
flexDirection:"column",
gap:10,
borderTop:"1px solid #334155",
background:"#0f172a"
},

message:{
padding:12,
marginBottom:10,
borderRadius:12,
cursor:"pointer",
border:"1px solid #334155",
wordBreak:"break-word"
},


helpBtn:{
position:"fixed",
bottom:20,
right:20
},


toast:{
position:"fixed",
top:20,
right:20,
background:"#1f2937",
padding:"15px 20px",
borderRadius:12,
transition:"opacity .5s ease, transform .5s ease",
pointerEvents:"none",
zIndex:999,
minWidth:250
},

closeBtn:{
  position:"absolute",
  top:12,
  right:12,
  zIndex:10,
  background:"#dc2626",
  color:"white",
  border:"none",
  padding:"8px 12px",
  borderRadius:8,
  cursor:"pointer"
},

inboxTitle:{
marginBottom:20,
fontSize:22
},

messageBox:{
height:120,
resize:"none",
padding:14,
borderRadius:12,
border:"1px solid #334155",
background:"#020617",
color:"white",
fontSize:15,
outline:"none"
},

select:{
padding:12,
borderRadius:10,
background:"#020617",
color:"white",
border:"1px solid #334155"
},

playerName:{
marginBottom:5,
fontSize:26,
fontWeight:"800"
},


playerRole:{
margin:0,
color:"#94a3b8",
fontSize:16
},


studentScore:{
marginTop:10,
display:"inline-block",
background:"#020617",
color:"#facc15",
padding:"8px 16px",
borderRadius:20,
fontWeight:"800",
fontSize:14,
border:"1px solid #334155"
},

eventTitle: {
  fontSize: 22,
  fontWeight: 600,
  paddingBottom: 10
},

worldName:{

color:"#60a5fa",
fontWeight:"800",
fontSize:14,
marginBottom:8

},


roleMiniDescription:{

color:"#94a3b8",
fontSize:14,
maxWidth:280,
lineHeight:"20px",
marginTop:8

},

eventDescription:{
color:"#cbd5e1",
fontSize:16,
lineHeight:"24px",
marginTop:15,
marginBottom:10
},

reportBox:{

width:500,

maxHeight:"80vh",

overflowY:"auto",

background:"linear-gradient(145deg,#111827,#020617)",

padding:30,

borderRadius:24,

boxShadow:"0 25px 70px rgba(0,0,0,.7)",

border:"1px solid #334155",

textAlign:"center"

},


reportStats:{

display:"flex",

justifyContent:"space-around",

background:"#020617",

padding:15,

borderRadius:15,

marginBottom:20

},

inventoryCard:{
  background:"linear-gradient(145deg,#111827,#0f172a)",
  padding:20,
  borderRadius:16,
  marginTop:12,
  border:"1px solid #334155",
  boxShadow:"0 10px 30px rgba(0,0,0,.4)"
},

inventoryTitle:{
  marginBottom:15,
  fontSize:20,
  fontWeight:"700"
},

inventoryGrid:{
  display:"flex",
  flexWrap:"wrap",
  gap:10
},

inventoryItem:{
  background:"#1e293b",
  border:"1px solid #475569",
  padding:"10px 14px",
  borderRadius:12,
  display:"flex",
  alignItems:"center",
  gap:8,
  fontSize:14,
  fontWeight:"600"
},

itemIcon:{
  fontSize:18
},

emptyInventory:{
  background:"#0b1220",
  padding:15,
  borderRadius:12,
  color:"#94a3b8",
  textAlign:"center"
},
playersModal:{
width:500,
maxHeight:"70vh",
overflowY:"auto",
background:"#111827",
padding:25,
borderRadius:16,
position:"relative",
animation:"popIn .75s ease"
},

playerRow:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
padding:"12px",
marginBottom:"8px",
background:"#1e293b",
borderRadius:"10px"
},

formModal:{

width:520,

maxHeight:"85vh",

overflowY:"auto",

background:
"linear-gradient(145deg,#111827,#020617)",

padding:30,

borderRadius:24,

position:"relative",

border:"1px solid #334155",

boxShadow:
"0 30px 90px rgba(0,0,0,.8)",
animation:"popIn .75s ease"
},


formTitle:{

textAlign:"center",

fontSize:24,

marginBottom:25,

fontWeight:"800"

},


formsContainer:{

display:"flex",

flexDirection:"column",

gap:20

},


formCard:{

background:"#0f172a",

padding:20,

borderRadius:18,

border:"1px solid #334155",

boxShadow:
"0 10px 25px rgba(0,0,0,.35)"

},


formName:{

marginBottom:20,

fontSize:18,

color:"#60a5fa"

},


formFields:{

display:"flex",

flexDirection:"column",

gap:15

},


fieldGroup:{

display:"flex",

flexDirection:"column",

gap:8

},


label:{

fontSize:14,

fontWeight:"700",

color:"#cbd5e1"

},


formInput:{

background:"#020617",

color:"white",

border:"1px solid #475569",

padding:"12px",

borderRadius:10,

outline:"none",

fontSize:14

},


submitFormBtn:{

marginTop:20,

width:"100%",

background:"#2563eb",

color:"white",

border:"none",

padding:"12px",

borderRadius:12,

fontWeight:"800",

cursor:"pointer",

fontSize:15

},

audioButton:{

marginTop:15,

width:"100%",

padding:"12px",

border:"none",

borderRadius:12,

background:
"linear-gradient(135deg,#f59e0b,#ea580c)",

color:"white",

fontSize:16,

fontWeight:"800",

cursor:"pointer",

boxShadow:
"0 10px 25px rgba(245,158,11,.35)"

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

animation:"popIn .25s ease"

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

from{
opacity:0;
}

to{
opacity:1;
}

}

@keyframes popIn {

from{
opacity:0;
transform:scale(.95);
}

to{
opacity:1;
transform:scale(1);
}

}


/* DESKTOP */

.studentHud{

display:flex;
justify-content:space-between;
align-items:center;

}


.studentActions{

display:flex;
flex-direction:row;
gap:10px;
align-items:center;
justify-content:flex-end;

}


.inboxBtn{

position:relative;

}


/* MOBILE */

@media(max-width:700px){


.studentHud{

flex-direction:column;
align-items:stretch;
gap:15px;

}

.studentHud > div:first-child{

text-align:center;

}

.studentActions{

display:flex;

flex-direction:row;

width:100%;

gap:10px;

justify-content:center;

align-items:center;

}


.studentActions button{

flex:1;

max-width:180px;

justify-content:center;

}


}

`;