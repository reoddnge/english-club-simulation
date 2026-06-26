"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  limit
} from "firebase/firestore";

import { db } from "@/lib/firebase";


import {
  GAME_MODULES
} from "@/lib/gameModules";

import {
  getModule
} from "@/lib/moduleEngine";

export default function JoinPage(){


const router = useRouter();


const [name,setName] = useState("");

const [game,setGame] = useState(null);

const [loading,setLoading] = useState(true);

const [error,setError] = useState("");




/*
====================================
 LOAD ACTIVE GAME
====================================
*/


useEffect(()=>{


async function loadGame(){


try{


const q = query(

collection(db,"games"),

where(
"status",
"==",
"active"
),

limit(1)

);



const snap = await getDocs(q);



if(!snap.empty){


const active =
snap.docs[0];


setGame({

id:active.id,

...active.data()

});


}



}catch(err){


console.log(err);

setError(
"Could not load game"
);


}

finally{


setLoading(false);


}



}



loadGame();


},[]);







/*
====================================
 JOIN GAME
====================================
*/

async function join(){


if(!name.trim()){

setError(
"Enter your nickname"
);

return;

}



if(!game){

setError(
"No game available"
);

return;

}



const moduleId = game.moduleId;

const module = getModule(moduleId);

if(!module){
  setError("Module not found");
  return;
}






const moduleEngine = getModule(moduleId);

if(!moduleId){

setError(
"Game module missing"
);

return;

}



const studentsSnap = await getDocs(
  collection(
    db,
    "games",
    game.id,
    "students"
  )
);

const existingRoles =
  studentsSnap.docs.map(
    d => d.data().role
  );

const rolesConfig =
  GAME_MODULES[moduleId].roles;

// Roles that are unique and not yet assigned

const availableUniqueRoles =
  Object.entries(rolesConfig)
    .filter(([roleName, roleData]) =>
      roleData.unique === true &&
      !existingRoles.includes(roleName)
    )
    .map(([roleName]) => roleName);

let role;

if(availableUniqueRoles.length > 0){

  role =
    availableUniqueRoles[
      Math.floor(
        Math.random() *
        availableUniqueRoles.length
      )
    ];

}else{

  // Fallback to non-unique roles
  const reusableRoles =
    Object.entries(rolesConfig)
      .filter(([roleName, roleData]) =>
        !roleData.unique
      )
      .map(([roleName]) => roleName);

  role =
    reusableRoles[
      Math.floor(
        Math.random() *
        reusableRoles.length
      )
    ];

}

const world =
game.world || getModule(moduleId).generate();


const studentData = {

name:name.trim(),

role

};


// assign random flight only for passengers

if(role==="Passenger"){

studentData.flight =
world.flights[
Math.floor(
Math.random()*world.flights.length
)
];

}

const studentId =
crypto.randomUUID
?
crypto.randomUUID()
:
Date.now().toString();


const student = {

name:name.trim(),

role,

score:20,

money:100,


moduleData:world,


quests:
moduleEngine.generateQuests(
role,
world,
studentData
).map(q=>({

id:q.id,

title:q.title,

score:q.score,

description:q.description,

visibleInfo:q.visibleInfo || false,

dynamicInfo:q.dynamicInfo || null,

status:"available"

})),

joinedAt:serverTimestamp()

};



await setDoc(

doc(
db,
"games",
game.id,
"students",
studentId
),

student

);




localStorage.setItem(
"studentId",
studentId
);



localStorage.setItem(
"activeGameId",
game.id
);



router.push("/student");


}

return (

<div style={styles.page}>


<div style={styles.card}>


<div style={styles.logo}>
🎮
</div>


<h1 style={styles.headerText}>
Simulation Club
</h1>



<p style={styles.subtitle}>

Enter the active simulation

</p>





{
loading &&

<p>
Loading game...
</p>

}





{

!loading && !game &&

<div style={styles.error}>

No teacher has started a game yet.

</div>

}






{

game &&

<>


<div style={styles.gameBox}>


<h2 style={styles.gameTitle}>

{
GAME_MODULES[
game.moduleId
]?.title
||
game.moduleId
}

</h2>



<p style={styles.gameDescription}>

{
GAME_MODULES[
game.moduleId
]?.description
}

</p>


</div>







<input

style={styles.input}

placeholder="Enter nickname"

value={name}

onChange={
e=>setName(e.target.value)
}

/>







<button

style={styles.button}

onClick={join}

>

Enter Simulation 🚀

</button>



</>



}






{

error &&

<div style={styles.error}>

{error}

</div>

}





<div style={styles.info}>


<span>

🧩 Module:

{
game?.moduleId || "Waiting"
}

</span>




<span>

👥 Players join automatically

</span>



<span>

⭐ Starting score: 20

</span>



</div>





</div>

</div>


);


}







const styles = {


page:{


minHeight:"100vh",


background:
"linear-gradient(135deg,#020617,#0f172a)",


display:"flex",

justifyContent:"center",

alignItems:"center",

padding:20,

fontFamily:"Inter, sans-serif",

color:"white"

},



card:{


width:400,

background:"#111827",

padding:35,

borderRadius:24,

textAlign:"center",

boxShadow:
"0 25px 60px rgba(0,0,0,.5)"

},



logo:{

fontSize:70,

marginBottom:10

},



subtitle:{

opacity:.6,

marginBottom:25

},



gameBox:{

background:"#0f172a",

border:"1px solid #334155",

padding:15,

borderRadius:14,

marginBottom:20,

textAlign:"center"

},



input:{

width:"100%",

boxSizing:"border-box",

padding:14,

borderRadius:12,

border:"1px solid #374151",

background:"#020617",

color:"white",

fontSize:16,

outline:"none"

},



button:{

width:"100%",

marginTop:15,

padding:15,

borderRadius:12,

border:"none",

background:
"linear-gradient(90deg,#2563eb,#7c3aed)",

color:"white",

fontSize:16,

fontWeight:"bold",

cursor:"pointer"

},



error:{

marginTop:15,

background:"#7f1d1d",

padding:12,

borderRadius:10,

fontSize:14

},



info:{

marginTop:25,

background:"#0b1220",

padding:15,

borderRadius:14,

display:"flex",

flexDirection:"column",

gap:8,

fontSize:14,

opacity:.8

},

headerText: {
  fontSize: 22,
  fontWeight: 600
},

gameTitle: {
  fontSize: 20,
  fontWeight: 500,
  paddingBottom: 10
},

gameDescription: {
  fontSize: 15
}

};