import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import { db } from "./firebase";

import { GAME_MODULES } from "./gameModules";

export async function createGame(moduleId, teacherId="teacher"){


const module =
GAME_MODULES[moduleId];


if(!module){
  throw new Error(
    "Module not found: " + moduleId
  );
}


const gameWorld =
module.generate();


const ref = await addDoc(
  collection(db,"games"),
  {

    moduleId,

    teacherId,

    world: gameWorld,

    status:"active",

    createdAt:serverTimestamp()

  }
);


return ref.id;

}




export async function deleteCollection(path){


 const snap =
   await getDocs(
     collection(db,...path)
   );


 await Promise.all(

   snap.docs.map(d=>
      deleteDoc(d.ref)
   )

 );

}



export async function finishGame(gameId){

await updateDoc(

doc(db,"games",gameId),

{
status:"finished"
}

);

}

export const gamePath = (gameId)=>({
 messages: collection(db,"games",gameId,"messages"),
 events: collection(db,"games",gameId,"events"),
 students: collection(db,"games",gameId,"students")
});