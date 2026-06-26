"use client";

import {
airportPhrases,
airportVocabulary
} from "./phrases";


export default function AirportGuide(){


return (

<div>


<h2>
✈️ Airport English Guide
</h2>



<h3>
💬 Useful Phrases
</h3>


{
airportPhrases.map((section,index)=>(

<div
key={index}
style={{
background:"#1e293b",
padding:15,
borderRadius:12,
marginBottom:15
}}
>


<h4>
{section.category}
</h4>


{
section.phrases.map((p,i)=>(

<p key={i}>
• {p}
</p>

))

}


</div>


))

}




<h3>
📚 Vocabulary
</h3>


{
airportVocabulary.map((v,index)=>(

<div
key={index}
style={{
background:"#0f172a",
padding:12,
borderRadius:10,
marginBottom:8
}}
>


<b>
{v.word}
</b>


<p>
{v.meaning}
</p>


</div>

))

}


</div>

)

}