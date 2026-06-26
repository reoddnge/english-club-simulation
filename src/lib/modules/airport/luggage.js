export function generateLuggageId(){

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const randomLetter =
letters[
Math.floor(Math.random()*letters.length)
];


const randomNumber =
Math.floor(
1000 + Math.random()*9000
);


return `${randomLetter}${randomNumber}`;

}