import { airportRoles } from "./roles";
import { generateAirportQuests } from "./quests";
import { airportEvents } from "./events";
import { generateAirport, getAirportInfo } from "./engine";
import {airportForms} from "./forms";
import AirportGuide from "./guide";

export const airportModule = {

id:"airport",

title:"Airport Simulation",

description:
"Students simulate an airport environment.",

guide: AirportGuide,

roles:airportRoles,

generate:generateAirport,

generateQuests:generateAirportQuests,

events:airportEvents,

getInfo:getAirportInfo,
forms: airportForms

};


export default airportModule;