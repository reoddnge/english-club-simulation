import { type } from "firebase/firestore/pipelines";

export const airportForms = {


passportCheck: {

id:"passportCheck",

title:"Passenger Passport Check",

fields:[

{
id:"fullName",
label:"Full Name",
type:"text"
},
{
    id: "dateOfBirth",
    label:"Date of Birth",
    type: "date"
},
{
    id:"nationality",
    label:"Nationality",
    type:"text"
},

{
    id:"visa",
    label:"Visa Type",
    type:"select",
    options:[
    "Tourist",
    "Business",
    "Student"
    ]

},
{
    id: "destination",
    label: "Destination",
    type: "text"
},
{
    id: "lengthOfStay",
    label: "Length of Stay (days)",
    type: "text"
},
{
    id: "accomodationType",
    label: "Accomodation Type",
    type: "text",
},
{
    id: "travelHistory",
    label: "travel History",
    type: "text"
}
]


},


};