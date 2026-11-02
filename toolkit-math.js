(function(root){
'use strict';
const planner=typeof module!=='undefined'?require('./calculator.js'):root.SamplePlanner;
const {z}=planner;
function number(x,name,min,max){if(!Number.isFinite(x)||x<min||x>max)throw Error(`${name} must be between ${min} and ${max}.`);return x;}
function count(n){number(n,'Usable sample',1,1e7);if(!Number.isInteger(n))throw Error('Sample counts must be whole numbers.');return n;}
function critical(c,one=false){number(c,'Confidence',80,99.99);return z(1-(1-c/100)/(one?1:2));}
function wilson(x,n,c=95,one=false){count(n);count(x||1);if(!Number.isInteger(x)||x<0||x>n)throw Error('Positive responses must be a whole number between 0 and n.');const p=x/n,k=critical(c,one),den=1+k*k/n,mid=(p+k*k/(2*n))/den,half=k*Math.sqrt(p*(1-p)/n+k*k/(4*n*n))/den;return {estimate:p,low:Math.max(0,mid-half),high:Math.min(1,mid+half)};}
function reverse(mode,v){
 const n=count(v.n),k=critical(v.confidence);
 if(mode==='rate'){const p=number(v.rate,'Expected positive percentage',.000001,99.999999)/100;return {value:100*k*Math.sqrt(p*(1-p)/n),unit:'percentage points',n};}
 const sd=number(v.sd,'SD',.000001,1e6);
 if(mode==='mean')return {value:k*sd/Math.sqrt(n),unit:'score points',n};
 number(v.power,'Power',50,99.99);const b=z(v.power/100);
 if(mode==='paired')return {value:(k+b)*sd/Math.sqrt(n),unit:'score points',n};
 if(mode!=='independent')throw Error('Choose a supported analysis.');
 if(n<4)throw Error('Use at least four total participants for two independent groups.');
 const a=Math.floor(n/2),groupB=n-a;return {value:(k+b)*sd*Math.sqrt(1/a+1/groupB),unit:'score points',n,groupA:a,groupB};
}
function goal(mode,v){
 let interval;
 const n=count(v.n),one=v.direction==='above';
 if(mode==='rate')interval=wilson(v.positive,n,v.confidence,one);
 else{
  if(n<2)throw Error('A mean result needs at least two participants.');
  const sd=number(v.sd,'Observed SD',.000001,1e6),mean=number(v.mean,'Observed mean',-1e9,1e9),half=critical(v.confidence,one)*sd/Math.sqrt(n);
  interval={estimate:mean,low:mean-half,high:mean+half};
 }
 number(v.goal,'Goal',mode==='rate'?0:-1e9,mode==='rate'?100:1e9);
 const target=mode==='rate'?v.goal/100:v.goal;
 const status=interval.low>target?'above':!one&&interval.high<target?'below':'uncertain';
 return {...interval,status,one,target};
}
function segments(rows,v){
 if(rows.length<1||rows.length>20)throw Error('Use between 1 and 20 segments.');
 number(v.loss,'Unusable sessions',0,90);
 const required=planner.calculate(v.metric,{loss:0,confidence:v.confidence,rate:v.rate,margin:v.margin,sd:v.sd}).n;
 const shares=rows.map(r=>number(r.share,'Segment population percentage',.000001,100));
 if(v.overlap==='exclusive'&&Math.abs(shares.reduce((a,b)=>a+b,0)-100)>.01)throw Error('For exhaustive, non-overlapping segments, population percentages must total 100%.');
 const recruit=Math.ceil(required/(1-v.loss/100));
 return {required,recruit,minimum:v.overlap==='exclusive'?required*rows.length:required,maximum:required*rows.length,recruitMinimum:v.overlap==='exclusive'?recruit*rows.length:recruit,recruitMaximum:recruit*rows.length,natural:Math.max(...shares.map(p=>Math.ceil(required/(p/100)))),rows:rows.length};
}
const api={wilson,reverse,goal,segments};if(typeof module!=='undefined')module.exports=api;else root.ToolkitMath=api;
})(typeof globalThis!=='undefined'?globalThis:this);
