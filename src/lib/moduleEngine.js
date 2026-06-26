import {GAME_MODULES} from "./gameModules";



export function getModule(moduleId){

return GAME_MODULES[moduleId];

}



export function getModuleRoles(moduleId){

return Object.keys(
GAME_MODULES[moduleId]?.roles || {}
);

}



export function getModuleEvents(moduleId){


return (
GAME_MODULES[moduleId]?.events || []
);


}