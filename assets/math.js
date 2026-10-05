'use strict';
(function(root){
  const figures=[{id:'whole',name:'Semibreve',ticks:128,den:1},{id:'half',name:'Mínima',ticks:64,den:2},{id:'quarter',name:'Semínima',ticks:32,den:4},{id:'eighth',name:'Colcheia',ticks:16,den:8},{id:'sixteenth',name:'Semicolcheia',ticks:8,den:16},{id:'thirtysecond',name:'Fusa',ticks:4,den:32},{id:'sixtyfourth',name:'Semifusa',ticks:2,den:64}];
  const meters={'2/4':{n:2,d:4,beats:2,beat:32,division:2,type:'Binário simples',unit:'semínima'},'3/4':{n:3,d:4,beats:3,beat:32,division:2,type:'Ternário simples',unit:'semínima'},'4/4':{n:4,d:4,beats:4,beat:32,division:2,type:'Quaternário simples',unit:'semínima'},'2/2':{n:2,d:2,beats:2,beat:64,division:2,type:'Binário simples',unit:'mínima'},'3/8':{n:3,d:8,beats:3,beat:16,division:2,type:'Ternário simples',unit:'colcheia'},'6/8':{n:6,d:8,beats:2,beat:48,division:3,type:'Binário composto',unit:'semínima pontuada'},'9/8':{n:9,d:8,beats:3,beat:48,division:3,type:'Ternário composto',unit:'semínima pontuada'},'12/8':{n:12,d:8,beats:4,beat:48,division:3,type:'Quaternário composto',unit:'semínima pontuada'}};
  const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);const fraction=(n,d)=>{if(!n)return '0';const g=gcd(n,d);return d/g===1?String(n/g):`${n/g}/${d/g}`;};
  const mixed=(n,d)=>{const sign=n<0?'-':'';n=Math.abs(n);const a=Math.floor(n/d),r=n%d;return sign+(r?(a?`${a} ${fraction(r,d)}`:fraction(r,d)):String(a));};
  const duration=item=>{const f=figures.find(f=>f.id===item.id);if(!f)throw new Error('Figura desconhecida.');return f.ticks*(item.dotted?1.5:1);};
  const capacity=m=>128*m.n/m.d;const total=items=>items.reduce((sum,item)=>sum+duration(item),0);
  const suggest=ticks=>{let left=ticks;const result=[];if(ticks===1)return {items:[],remainder:1};if(ticks%2){result.push({id:'sixtyfourth',dotted:true,kind:'note'});left-=3;}for(const f of figures){while(left>=f.ticks){result.push({id:f.id,dotted:false,kind:'note'});left-=f.ticks;}}return {items:result,remainder:left};};
  root.RhythmMath={figures,meters,gcd,fraction,mixed,duration,capacity,total,suggest};
})(typeof window==='undefined'?globalThis:window);
