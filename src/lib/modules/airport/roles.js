export const airportRoles={


Passenger:{


unique:false,
description:
"Travel through the airport and complete your journey. Check flight information, talk to airport staff, answer questions from border control, and make sure you reach the correct destination. Follow airport procedures and solve any travel-related challenges you encounter.",
abilities:[
"Needs information from staff"
]
},



"Ticket Inspector":{
unique:true,
description:
"Help passengers by providing accurate flight and airport information. Check tickets, guide travelers to the correct locations, answer questions, and assist passengers in navigating the airport efficiently.",
abilities:[
"Can see flight database"
]
},


"Border Control Officer":{
unique:true,
description:
"Protect the country's border by interviewing arriving passengers. Verify travel documents, ask questions about their trip and purpose of travel, assess whether their story is credible, and decide whether they should be allowed to enter the country."
}


};