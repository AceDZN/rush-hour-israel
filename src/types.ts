export type Mode = 'road' | 'bus' | 'rail';
export type Tool = Mode | 'stop' | 'upgrade' | 'interchange' | 'service' | 'erase';
export type NodeKind = 'home' | 'school' | 'jobs' | 'clinic' | 'junction' | 'station';
export interface MapNode { id:string; x:number; z:number; h:number; kind:NodeKind; label:string; }
export interface Point { x:number; z:number; h:number; }
export interface Corridor { a:string; b:string; via?:Point[]; bridge?:boolean; forbidden?:boolean; modes?:Mode[]; roadLimit?:number; railLimit?:number; nuisance?:number; closeAt?:number; label?:string; }
export interface Demand { origin:string; destination:string; count:number; at:number; car:boolean; deadline?:number; }
export type PlanAction = {type:'link'; a:string; b:string; mode:Mode} | {type:'stop'|'service'|'interchange';node:string} | {type:'upgrade';a:string;b:string;mode:Mode} | {type:'schedule';a:string;b:string;mode:Mode;phase:number};
export interface Level { id:number; title:string; region:string; lesson:string; hint:string; feedback:string; nodes:MapNode[]; corridors:Corridor[]; demand:Demand[]; budget:number; duration:number; deadline:number; target:number; tools:Tool[]; initial:PlanAction[]; baseline:PlanAction[]; nearMiss:PlanAction[]; alternate?:PlanAction[]; serviceSites?:string[]; noiseLimit?:number; footprintLimit?:number; walkRadius?:number; headway?:Partial<Record<Mode,number>>; transferPenalty?:number; induced?:{at:number;count:number;origin:string;destination:string}; }
