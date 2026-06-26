function addMinutes(time, minutes){

const [hours, mins] = time.split(":").map(Number);

const date = new Date();

date.setHours(
hours,
mins + minutes
);


return date
.toTimeString()
.slice(0,5);

}
export const airportEvents = [

{

type:"delay",

title:"Flight Delay",

audio:"/audio/event_flyDelay.mp3",

apply(world){


const delayMinutes = [

15,
30,
45

][
Math.floor(
Math.random()*3
)
];


return {


...world,


flights:

world.flights.map(f=>({


...f,


departureTime:

addMinutes(
f.departureTime,
delayMinutes
),


delayed:true


}))


};


}


},

{
    type: "firstClass",
    title: "First Class",
    audio: "/audio/event_firstClass.mp3"
    
},

];