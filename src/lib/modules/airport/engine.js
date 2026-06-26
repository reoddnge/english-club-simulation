export function generateAirport(){


return {


flights:[

{

number:"TK101",

destination:"London",

gate:"A12",
departureTime: "22:30"

},


{

number:"TK205",

destination:"Tokyo",

gate:"B04",
departureTime: "21:00"

},

{

number:"TK304",

destination:"Amsterdam",

gate:"C45",
departureTime: "23:20"

},
{

number:"TK409",

destination:"New York",

gate:"D91",
departureTime: "20:30"

},
{

number:"TK506",

destination:"Tehran",

gate:"E86",
departureTime: "22:00"

},


],



};


}

export function getAirportInfo(world){

return {


title:"Airport Departure Board",


allowedRoles:[
"Ticket Inspector"
],


data:
world.flights.map(f=>({

flight:f.number,

destination:f.destination,

gate:f.gate,

departure:f.departureTime


}))


};


}