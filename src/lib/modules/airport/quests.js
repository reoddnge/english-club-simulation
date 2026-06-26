export function generateAirportQuests(role, world, student){

const flights = world?.flights || [];


if(role==="Passenger"){


return [

{
id:"find_gate",

title:"Find your gate",

score:5,

description:
`Your destination is ${student.flight.destination}. Ask the ticket inspector for your gate number.`

},
{
    id: "border_pass",
    title: "Border Control Interview",
    score:5,
    description: "Present your travel documents and answer the officer's questions about your trip. Explain who you are, where you are coming from, why you are visiting the country, and how long you plan to stay. The officer will decide whether you are allowed to enter."
}

];


}



if(role==="Ticket Inspector"){

return [

{

id:"inspect_flights",

title:"Inspect all flights",

score:15,

visibleInfo:true,

description:
"Verify passengers' tickets and flight information. Help travelers find their correct gate, check important travel details, answer questions, and guide them through the airport process.",

dynamicInfo:"flights",
generateInfo:(world)=>{

return world.flights.map(f=>

`${f.number} | ${f.destination} | Gate ${f.gate} | Departure ${f.departureTime}`

).join("\n");

}

}

];

}



if(role==="Border Control Officer"){

return [

{

id:"interview_passenger",

title:"Interview passengers",

score:15,

description:
"Interview arriving passengers and verify their travel documents. Ask questions about their purpose of travel, planned activities, length of stay, accommodation, and travel history. Use the information you gather to decide whether they meet the requirements for entry. Then, submit the form."

}

];

}


return [];

}