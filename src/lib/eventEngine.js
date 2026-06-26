import {
doc,
updateDoc,
serverTimestamp,
getDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { getModule } from "./moduleEngine";



export async function processEvent(
event,
student,
gameId
){

if(!event || !student || !gameId)
return;


if(event.status==="done")
return;


const eventRef = doc(
db,
"games",
gameId,
"events",
event.id
);


const module =
getModule(event.module);


if(!module)
return;


const eventDefinition =
module.events.find(
e=>e.type===event.type
);


if(!eventDefinition)
return;


// lock

await updateDoc(
eventRef,
{
status:"processing"
}
);


// ============================
// APPLY WORLD CHANGE
// ============================

const gameRef = doc(
db,
"games",
gameId
);


const gameSnap =
await getDoc(gameRef);


const gameData =
gameSnap.data();


const updatedWorld =
eventDefinition.apply
?
eventDefinition.apply(
gameData.world
)
:
gameData.world;



await updateDoc(
gameRef,
{
world: updatedWorld
}
);



// finish event

await updateDoc(
eventRef,
{
status:"done",
processedAt:serverTimestamp()
}
);


}