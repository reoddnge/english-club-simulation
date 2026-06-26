"use client";

import {useState} from "react";
import {signInWithEmailAndPassword} from "firebase/auth";
import {auth} from "@/lib/firebase";
import {useRouter} from "next/navigation";


export default function Login(){


const [email,setEmail]=useState("");
const [password,setPassword]=useState("");
const [error,setError]=useState("");

const router = useRouter();



async function login(){

try{

await signInWithEmailAndPassword(
auth,
email,
password
);


router.push("/teacher");


}catch(e){

setError(
"Invalid email or password"
);

}

}



return (

<div style={styles.page}>


<div style={styles.card}>


<img
src="/logo.png"
style={styles.logo}
/>


<h1 style={styles.title}>
The Crate
</h1>


<p style={styles.subtitle}>
English Simulation Platform
</p>



<input

style={styles.input}

placeholder="Email"

value={email}

onChange={
e=>setEmail(e.target.value)
}

/>



<input

style={styles.input}

placeholder="Password"

type="password"

value={password}

onChange={
e=>setPassword(e.target.value)
}

/>



{
error &&

<p style={styles.error}>
{error}
</p>

}



<button

style={styles.button}

onClick={login}

>

🚀 Enter Simulation

</button>



<div style={styles.footer}>

🎮 Teacher Control Center

</div>


</div>


</div>


)

}



const styles={


page:{

height:"100vh",

display:"flex",

justifyContent:"center",

alignItems:"center",

background:
"radial-gradient(circle at top,#172554,#020617)",

color:"white",

fontFamily:"Arial"

},



card:{

width:380,

padding:40,

borderRadius:25,

textAlign:"center",

display:"flex",

flexDirection:"column",

alignItems:"center"

},



logo:{

width:100,

height:100,

objectFit:"contain",

marginBottom:10

},



title:{

fontSize:38,

fontWeight:900,

margin:0

},



subtitle:{

color:"#94a3b8",

marginBottom:30

},



input:{

width:"100%",

boxSizing:"border-box",

padding:14,

marginBottom:15,

borderRadius:12,

border:"1px solid #334155",

background:"#020617",

color:"white",

fontSize:15

},



button:{

width:"100%",

padding:14,

borderRadius:12,

border:"none",

background:
"linear-gradient(135deg,#2563eb,#1d4ed8)",

color:"white",

fontSize:16,

fontWeight:800,

cursor:"pointer"

},



error:{

color:"#f87171",

fontSize:14,

marginBottom:15

},



footer:{

marginTop:30,

fontSize:13,

color:"#64748b"

}


};