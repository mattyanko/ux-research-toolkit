/* Independent planning approximations; see the methods panel and README. */
(function(root){
'use strict';
// Acklam inverse standard-normal CDF, absolute error about 1e-9 centrally.
function z(p){
 if(!(p>0&&p<1))throw Error('Probability must be between 0 and 1.');
 const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[.00778469570904146,.32246712907004,2.445134137143,3.75440866190742];
 const poly=(v,x)=>v.reduce((r,k)=>r*x+k,0);
 if(p<.02425){let q=Math.sqrt(-2*Math.log(p));return poly(c,q)/(poly(d,q)*q+1);}
 if(p>1-.02425)return -z(1-p);
 let q=p-.5,r=q*q;return poly(a,r)*q/(poly(b,r)*r+1);
}
function calculate(type,v){
 if(type==='goalRate')v={...v,direction:'greater'};
 const positive=k=>{if(!Number.isFinite(v[k])||v[k]<=0)throw Error('Enter a positive value for '+k+'.');return v[k];};
 const prob=k=>{const x=positive(k)/100;if(x>=1)throw Error(k+' must be below 100%.');return x;};
 if(!Number.isFinite(v.loss)||v.loss<0||v.loss>90)throw Error('Unusable sessions must be between 0% and 90%.');
 let raw,groups=1,warning='',formula,achieved,alpha,adjustedAlpha,tails=2,familyCount=1,claim='',population,uncorrectedN;
 if(type==='discovery'){
  const p=prob('occurrence'),target=prob('target');raw=Math.log1p(-target)/Math.log1p(-p);formula='Binomial discovery model';
  achieved=1-(1-p)**Math.ceil(raw);
  warning='This is the chance of observing a particular problem at least once, assuming its occurrence rate is correct and participants are independent. It does not guarantee finding this percentage of all problems.';
 }else{
  const confidence=prob('confidence');if(confidence<.8)throw Error('Use a confidence level from 80% to below 100%.');
  alpha=1-confidence;
  if(v.correction && v.correction!=='none')throw Error('Sample-size calculations are unadjusted. Family corrections are explained separately.');
  adjustedAlpha=alpha;
  const isEstimate=type==='rate'||type==='mean';
  if(!isEstimate){
   const direction=v.direction||'two';
   if(!['two','greater','less'].includes(direction))throw Error('Choose a supported test direction.');
   tails=direction==='two'?2:1;
  }
  const za=z(1-adjustedAlpha/tails);
  if(type==='rate'){
   let p=prob('rate'),m=prob('margin');raw=za*za*p*(1-p)/(m*m);
   uncorrectedN=Math.max(2,Math.ceil(raw));formula='Normal approximation · proportion precision';
   if(v.population!==undefined){
    if(!Number.isSafeInteger(v.population)||v.population<2||v.population>1e12)throw Error('Population size must be a whole number from 2 to 1 trillion.');
    population=v.population;
    raw=population*raw/(population-1+raw);
    formula+=' · finite population correction, n = N n₀ / (N − 1 + n₀)';
   }
   if(raw*p<10||raw*(1-p)<10)warning='Expected successes or failures are below 10. Use a small-sample finite-population / binomial method appropriate to the sampling design before finalizing recruitment.';
  }
  else if(type==='mean'){raw=(za*positive('sd')/positive('margin'))**2;formula='Normal approximation · mean precision';}
  else{
   let power=prob('power');if(power<.5)throw Error('Power must be at least 50%.');const zb=z(power);
   if(type==='ordinal'){
    if(v.direction && v.direction!=='two')throw Error('This ordinal approximation supports two-sided comparisons only.');
    const normalize=(a,name)=>{
     if(!Array.isArray(a)||![5,7].includes(a.length)||a.some(x=>!Number.isFinite(x)||x<0||x>100))throw Error(name+' needs five or seven nonnegative category percentages.');
     const sum=a.reduce((s,x)=>s+x,0);
     if(Math.abs(sum-100)>.01)throw Error(name+' category percentages must sum to 100%; currently '+sum.toFixed(2)+'%.');
     return a.map(x=>x/sum);
    };
    const p=normalize(v.distributionA,'Group A'),q=normalize(v.distributionB,'Group B');
    if(p.length!==q.length)throw Error('Both groups need the same ordered categories.');
    let superiority=0,lowerA=0,tie=0;
    for(let i=0;i<p.length;i++){superiority+=q[i]*(lowerA+.5*p[i]);lowerA+=p[i];tie+=((p[i]+q[i])/2)**3;}
    const effect=superiority-.5;
    if(Math.abs(effect)<1e-8)throw Error('These distributions have no directional rank effect (probability of superiority is 50%). Mann–Whitney is not an omnibus test for every distribution difference; choose a different anticipated effect or analysis.');
    // Equal allocation, Zhao et al. (2008), Eq. 12; total N then round per group.
    const total=(za+zb)**2*(1-tie)/(3*effect**2);
    raw=total/2;groups=2;
    formula='Tie-adjusted asymptotic Wilcoxon–Mann–Whitney · Zhao et al. (2008), Eq. 12';
    claim=`Under your category distributions, P(B > A) + ½P(B = A) = ${(100*superiority).toFixed(1)}%. This compares independent ordered ratings, not mean scores or T2B percentages.`;
    warning='Asymptotic planning approximation with ties and equal group sizes; assumes independent respondents. It is not exact power or a test of medians alone. Sparse categories, small samples, and unusual distributions warrant simulation of the intended analysis.';
   }
   else if(type==='benchmarkRate'||type==='goalRate'){
    const p0=prob('benchmark'),p1=prob('expected');
    if(p0===p1)throw Error('Expected rate must differ from the benchmark. An expected rate exactly at the goal cannot provide the requested power to show it exceeds the goal.');
    if(v.direction==='greater'&&p1<p0)throw Error('For an above-goal test, the expected rate must be above the benchmark.');
    if(v.direction==='less'&&p1>p0)throw Error('For a below-benchmark test, the expected rate must be below the benchmark.');
    raw=(za*Math.sqrt(p0*(1-p0))+zb*Math.sqrt(p1*(1-p1)))**2/(p1-p0)**2;
    formula='Normal approximation · one-sample proportion score test';
    const relation=tails===2?'differs from':v.direction==='less'?'is below':'exceeds';
    claim=`Test whether the population positive-rating percentage ${relation} ${v.benchmark}%, assuming a true percentage of ${v.expected}%.`;
    if(Math.min(raw*p0,raw*(1-p0),raw*p1,raw*(1-p1))<10)warning='Some expected outcome counts are below 10. Confirm this plan with an exact binomial procedure.';
   }
   else if(type==='benchmarkMean'){
    if(!Number.isFinite(v.benchmark)||!Number.isFinite(v.expected))throw Error('Enter both the benchmark and expected mean score.');
    const difference=v.expected-v.benchmark;
    if(difference===0)throw Error('Expected mean must differ from the benchmark.');
    if(v.direction==='greater'&&difference<0)throw Error('Expected mean must exceed the benchmark for this direction.');
    if(v.direction==='less'&&difference>0)throw Error('Expected mean must be below the benchmark for this direction.');
    raw=((za+zb)*positive('sd')/Math.abs(difference))**2;
    formula='Normal approximation · one-sample mean test';
    claim=`Test the population mean against ${v.benchmark}, assuming a true mean of ${v.expected}. The benchmark is treated as fixed.`;
   }
   else if(type==='rates'){const p1=prob('rateA'),p2=prob('rateB'),p=(p1+p2)/2;if(p1===p2)throw Error('The expected rates must differ.');if(v.direction==='greater'&&p2<p1||v.direction==='less'&&p2>p1)throw Error('Expected rates must agree with the chosen B versus A direction.');raw=(za*Math.sqrt(2*p*(1-p))+zb*Math.sqrt(p1*(1-p1)+p2*(1-p2)))**2/(p2-p1)**2;groups=2;formula='Normal approximation · independent proportions';if(Math.min(raw*p1,raw*(1-p1),raw*p2,raw*(1-p2))<10)warning='Some expected outcome counts are below 10. Confirm with a small-sample method.';}
   else if(type==='independent'||type==='paired'){groups=type==='independent'?2:1;raw=groups*((za+zb)*positive('sd')/positive('difference'))**2;formula='Normal approximation · '+(groups===2?'independent means':'paired differences');claim=`Detect a ${v.difference}-point ${tails===2?'difference':v.direction==='greater'?'increase in B versus A':'decrease in B versus A'} in mean scores, assuming the specified variability.`;}
   else throw Error('Unknown scenario.');
  }
  if(type==='rates')claim=`Detect a difference between ${v.rateA}% positive ratings in A and ${v.rateB}% in B, with different respondents in each condition.`;
  if(!warning)warning='Planning approximation. Small samples may require more participants with a t-based or exact method.';
 }
 const perGroup=Math.max(2,Math.ceil(raw)),recruitPerGroup=Math.ceil(perGroup/(1-v.loss/100));
 // A single participant can satisfy a discovery target.
 const n=type==='discovery'?Math.max(1,Math.ceil(raw)):perGroup;
 const recruit=type==='discovery'?Math.ceil(n/(1-v.loss/100)):recruitPerGroup;
 if(!Number.isSafeInteger(n*groups)||n*groups>1e8)throw Error('These assumptions require over 100 million participants. Revisit the precision or difference.');
 if(population)warning+=' Correction assumes simple random sampling without replacement from this fixed population; it does not account for nonresponse or recruitment bias.';
 if(population&&recruit>population)warning+=' The recruitment target exceeds the population at this exclusion rate; revisit feasibility rather than treating that target as available people.';
 return {n,total:n*groups,groups,recruit:recruit*groups,recruitPerGroup:recruit,warning,formula,achieved,alpha,adjustedAlpha,tails,familyCount,claim,population,uncorrectedN};
}
const api={z,calculate};if(typeof module!=='undefined')module.exports=api;else root.SamplePlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this);
