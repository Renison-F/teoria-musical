'use strict';
(()=>{
  const M=window.RhythmMath,$=id=>document.getElementById(id);
  const state={meter:'4/4',items:[{id:'half',kind:'note',dotted:false},{id:'eighth',kind:'note',dotted:false}]};
  const name=item=>`${item.kind==='rest'?'Pausa de ':''}${M.figures.find(f=>f.id===item.id).name.toLowerCase()}${item.dotted?' pontuada':''}`;
  let audioContext=null,nodes=[],timers=[],playId=0;
  const svgNS='http://www.w3.org/2000/svg';
  function svgNode(tag,attrs={}){const el=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}
  function noteIcon(item){
    const svg=svgNode('svg',{viewBox:'0 0 48 60',class:'note-icon','aria-hidden':'true',focusable:'false'});
    const glyph=window.RhythmGlyphs[`${item.kind}-${item.id}`];
    if(glyph.staff)svg.append(svgNode('path',{d:'M12 30 H36',stroke:'currentColor','stroke-width':1.2,fill:'none'}));
    svg.append(svgNode('path',{d:glyph.path,fill:'currentColor'}));
    if(item.dotted)svg.append(svgNode('circle',{cx:glyph.dotX,cy:glyph.dotY,r:1.7,fill:'currentColor'}));
    return svg;
  }
  function stopAudio(message='Reprodução encerrada.'){
    playId++;timers.forEach(clearTimeout);timers=[];nodes.forEach(n=>{try{n.stop();}catch{}});nodes=[];
    document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));
    $('stop').disabled=true;$('play-rhythm').disabled=state.items.length===0||M.total(state.items)>M.capacity(M.meters[state.meter]);
    $('audio-message').textContent=message;
  }
  const refValue=()=>{const meter=M.meters[state.meter];return $('reference').value==='whole'?128:$('reference').value==='beat'?meter.beat:M.capacity(meter);};
  function renderEquation(){
    const ref=refValue(),sum=M.total(state.items),cap=M.capacity(M.meters[state.meter]),unit=$('reference').value;
    $('math-reference').textContent=unit==='whole'?'Cada valor abaixo é uma parte da semibreve. A fórmula de compasso continua a mesma.':unit==='beat'?`Cada valor abaixo é uma parte de um tempo de ${M.meters[state.meter].unit}.`:'Cada valor abaixo é uma parte da duração deste compasso.';
    if(!state.items.length){$('equation').textContent='0 — adicione uma figura para começar.';}
    else{
      const vals=state.items.map(i=>M.fraction(M.duration(i),ref)),denominators=state.items.map(i=>ref/M.gcd(M.duration(i),ref));denominators.push(ref/M.gcd(cap,ref));
      const lcm=(a,b)=>a*b/M.gcd(a,b),common=denominators.reduce(lcm,1),raw=state.items.map(i=>`${M.duration(i)*common/ref}/${common}`);
      const initial=vals.join(' + '),converted=raw.join(' + ');
      const conversion=common>1&&converted!==initial?` = ${converted}`:'';
      const value=M.fraction(sum,ref);
      const result=unit==='whole'?(sum%ref===0?`${value} ${sum===ref?'semibreve':'semibreves'}`:`${value} de uma semibreve`):unit==='beat'?(sum<ref?`${value} de um tempo`:`${value} ${sum===ref?'tempo':'tempos'}`):(sum%ref===0?`${value} ${sum===ref?'compasso':'compassos'}`:`${value} do compasso`);
      if(state.items.length===1){const label=name(state.items[0]);$('equation').textContent=`${label.charAt(0).toUpperCase()+label.slice(1)}: ${result}.`;}
      else $('equation').textContent=`${initial}${conversion} = ${result}`;
    }
    $('remaining-equation').textContent=cap===sum?'A soma completa exatamente a capacidade do compasso.':cap>sum?`Capacidade − soma: ${M.fraction(cap,ref)} − ${M.fraction(sum,ref)} = ${M.fraction(cap-sum,ref)}. Esse é o valor que falta.`:`Soma − capacidade: ${M.fraction(sum,ref)} − ${M.fraction(cap,ref)} = ${M.fraction(sum-cap,ref)}. Esse é o excesso.`;
  }
  function renderButtons(){
    const kind=document.querySelector('input[name="kind"]:checked').value,dotted=$('dotted').checked;
    $('figure-buttons').replaceChildren();M.figures.forEach(f=>{const col=document.createElement('div');col.className='col-6';const button=document.createElement('button');button.type='button';button.className='figure-button';const item={id:f.id,kind,dotted};button.setAttribute('aria-label',`Adicionar ${name(item)}`);button.append(noteIcon(item));const text=document.createElement('span');const label=document.createElement('strong');label.textContent=f.name;const value=document.createElement('small');value.textContent=`${M.mixed(M.duration(item),M.meters[state.meter].beat)} tempo(s)${dotted?' · ponto':''}`;text.append(label,value);button.append(text);button.addEventListener('click',()=>{if(state.items.length>=96){$('audio-message').textContent='Limite de 96 figuras. Remova uma figura para continuar.';return;}stopAudio();state.items.push(item);render();});col.append(button);$('figure-buttons').append(col);});
  }
  function renderMap(){
    const meter=M.meters[state.meter],cap=M.capacity(meter),sum=M.total(state.items),width=1000,extent=Math.max(cap,sum);
    const svg=svgNode('svg',{viewBox:`0 0 ${width} 48`,preserveAspectRatio:'none',class:'duration-map',role:'img','aria-label':`${M.mixed(sum,meter.beat)} de ${meter.beats} tempos ocupados`});
    svg.append(svgNode('rect',{width,height:48,class:'bar-gap'}));let x=0;
    state.items.forEach((item,index)=>{const duration=M.duration(item),end=x+duration,parts=end>cap&&x<cap?[{a:x,b:cap,excess:false},{a:cap,b:end,excess:true}]:[{a:x,b:end,excess:x>=cap}];parts.forEach(p=>svg.append(svgNode('rect',{x:p.a/extent*width,y:2,width:Math.max(.3,(p.b-p.a)/extent*width-1),height:44,class:`bar-piece ${p.excess?'excess':item.kind==='rest'?'rest':index%2?'alt':''}`,'data-piece':index})));x=end;});
    for(let i=1;i<meter.beats;i++)svg.append(svgNode('line',{x1:i*meter.beat/extent*width,x2:i*meter.beat/extent*width,y1:0,y2:48,class:'beat-line'}));
    svg.append(svgNode('line',{x1:cap/extent*width-1,x2:cap/extent*width-1,y1:0,y2:48,class:'end-line'}));$('duration-map').replaceWith(svg);svg.id='duration-map';
    $('beat-labels').replaceChildren();for(let i=1;i<=meter.beats;i++){const b=document.createElement('span');b.textContent=`Tempo ${i}`;$('beat-labels').append(b);}
    $('beat-labels').classList.toggle('d-none',sum>cap);
  }
  function render(){
    const meter=M.meters[state.meter],cap=M.capacity(meter),sum=M.total(state.items),left=cap-sum;
    $('meter-type').textContent=meter.type;$('meter-signature').replaceChildren(...[meter.n,meter.d].map(n=>{const el=document.createElement('span');el.textContent=n;return el;}));$('meter-signature').setAttribute('aria-label',`${meter.n} por ${meter.d}`);
    const divisionUnit=meter.beat/meter.division,fig=M.figures.find(f=>f.ticks===divisionUnit);
    $('meter-description').textContent=`${meter.beats} tempos de ${meter.unit}. Cada tempo se divide em ${meter.division} ${fig.name.toLowerCase()}s.`;
    $('sequence').replaceChildren();state.items.forEach((item,index)=>{const button=document.createElement('button');button.type='button';button.className='sequence-item';button.setAttribute('aria-label',`Remover figura ${index+1}: ${name(item)}`);button.title='Clique para remover';button.append(noteIcon(item));const label=document.createElement('span');label.textContent=name(item);const small=document.createElement('small');small.textContent=`${M.mixed(M.duration(item),meter.beat)} tempo(s) · remover`;label.append(small);button.append(label);button.addEventListener('click',()=>{stopAudio();state.items.splice(index,1);render();});$('sequence').append(button);});
    if(!state.items.length){const empty=document.createElement('span');empty.className='empty-sequence';empty.textContent='Seu compasso está vazio. Escolha uma figura ao lado.';$('sequence').append(empty);}
    $('occupied').textContent=`${(sum/cap*100).toLocaleString('pt-BR',{maximumFractionDigits:2})}%`;
    $('metric-used').textContent=M.mixed(sum,meter.beat);$('metric-total').textContent=meter.beats;$('metric-left').textContent=M.mixed(Math.abs(left),meter.beat);$('metric-left-label').textContent=left<0?'Sobram':left===0?'Faltam':'Faltam';
    const status=$('status');status.className=`result-status mb-3 ${left===0?'complete':left<0?'overflow':''}`;status.replaceChildren();const strong=document.createElement('strong');strong.textContent=left===0?'Compasso completo!':left<0?`Passou da capacidade em ${M.mixed(-left,meter.beat)} tempo(s).`:`Faltam ${M.mixed(left,meter.beat)} tempo(s) para completar.`;status.append(strong);
    const detail=document.createElement('span');if(left>0){const suggestion=M.suggest(left);detail.textContent=suggestion.remainder?'O restante é 1/128 da semibreve (metade de uma semifusa), além das figuras maiores que couberem. Escolha outra combinação para completar com as figuras disponíveis.':`Uma combinação possível: ${suggestion.items.map(name).join(' + ')}. Também pode usar pausas com as mesmas durações.`;}else detail.textContent=left<0?'Remova ou substitua uma figura. O excesso aparece em vermelho.':'A soma das notas e pausas corresponde à duração total indicada pela fórmula.';status.append(detail);
    $('clear').disabled=!state.items.length;$('undo').disabled=!state.items.length;$('play-rhythm').disabled=!state.items.length||left<0;
    renderMap();renderButtons();renderEquation();renderTable();
  }
  function renderTable(){const meter=M.meters[state.meter],cap=M.capacity(meter);$('table-caption').textContent=`Valores no compasso ${state.meter}, sem ponto de aumento.`;$('figure-table').replaceChildren();M.figures.forEach(f=>{const tr=document.createElement('tr'),nameCell=document.createElement('th');nameCell.scope='row';nameCell.className='fw-semibold';nameCell.append(noteIcon({id:f.id,kind:'note',dotted:false}),document.createTextNode(f.name));tr.append(nameCell);[128,meter.beat,cap].forEach(ref=>{const td=document.createElement('td');td.textContent=M.fraction(f.ticks,ref);tr.append(td);});$('figure-table').append(tr);});}
  async function ensureAudio(){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Este navegador não oferece áudio.');if(!audioContext)audioContext=new Audio();if(audioContext.state==='suspended')await audioContext.resume();}
  function tone(at,duration,frequency,volume,type='sine'){const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=type;osc.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.005);gain.gain.exponentialRampToValueAtTime(.001,at+Math.max(.01,duration));osc.connect(gain);gain.connect(audioContext.destination);osc.start(at);osc.stop(at+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();nodes=nodes.filter(n=>n!==osc);};nodes.push(osc);}
  function scheduleVisual(delay,selector,id){timers.push(setTimeout(()=>{if(id!==playId)return;document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));document.querySelectorAll(selector).forEach(el=>el.classList.add('playing'));},delay));}
  function tempo(){const value=Number($('tempo').value);if(!Number.isFinite(value)||value<30||value>200){$('tempo').reportValidity();throw new Error('Escolha de 30 a 200 tempos por minuto.');}return value;}
  async function playRhythm(){
    stopAudio();const id=playId;
    try{const bpm=tempo();await ensureAudio();if(id!==playId)return;const meter=M.meters[state.meter],cap=M.capacity(meter),tick=60/bpm/meter.beat,start=audioContext.currentTime+.1;
      $('stop').disabled=false;$('play-rhythm').disabled=true;$('audio-message').textContent='Clique agudo = pulsação; som sustentado = duração da nota. Trechos vazios ficam em silêncio.';
      for(let b=0;b<meter.beats;b++)tone(start+b*meter.beat*tick,.05,b?1300:1800,.08,'triangle');
      let position=0;state.items.forEach((item,index)=>{const duration=M.duration(item);if(item.kind==='note')tone(start+position*tick,duration*tick*.92,440,.12);scheduleVisual(100+position*tick*1000,`[data-piece="${index}"]`,id);position+=duration;});
      timers.push(setTimeout(()=>{if(id===playId)stopAudio('Compasso concluído.');},100+cap*tick*1000));
    }catch(error){$('audio-message').textContent=error.message;}
  }
  async function playComparison(meterId){stopAudio();const id=playId;try{await ensureAudio();if(id!==playId)return;const subdivision=.3,meter=M.meters[meterId],group=meter.division,start=audioContext.currentTime+.1;$('stop').disabled=false;$('audio-message').textContent=`Ouvindo ${meterId}: ${meter.beats} grupos de ${group} colcheias, em dois compassos.`;const groups=document.querySelector(`[data-listen="${meterId}"]`).closest('article').querySelectorAll('.pulse-group');groups.forEach((el,index)=>el.dataset.comparison=`${meterId}-${index}`);for(let i=0;i<12;i++){const inBar=i%6,accent=inBar%group===0;tone(start+i*subdivision,.08,accent?(inBar===0?1000:780):480,accent?.2:.1,'triangle');scheduleVisual(100+i*subdivision*1000,`[data-comparison="${meterId}-${Math.floor(inBar/group)}"]`,id);}timers.push(setTimeout(()=>{if(id===playId)stopAudio(`Exemplo de ${meterId} concluído.`);},100+12*subdivision*1000));}catch(error){$('audio-message').textContent=error.message;}}
  function loadExample(example){stopAudio();if(example==='compound'){state.meter='6/8';state.items=Array.from({length:2},()=>({id:'quarter',kind:'note',dotted:true}));}else{state.meter='4/4';state.items=example==='complete'?[{id:'half',kind:'note',dotted:false},{id:'quarter',kind:'rest',dotted:false},{id:'eighth',kind:'note',dotted:false},{id:'eighth',kind:'note',dotted:false}]:[{id:'half',kind:'note',dotted:false},{id:'eighth',kind:'note',dotted:false}];}$('meter').value=state.meter;render();}
  $('meter').addEventListener('change',()=>{stopAudio();state.meter=$('meter').value;render();});document.querySelectorAll('input[name="kind"],#dotted').forEach(input=>input.addEventListener('change',renderButtons));$('reference').addEventListener('change',renderEquation);$('undo').addEventListener('click',()=>{stopAudio();state.items.pop();render();});$('clear').addEventListener('click',()=>{stopAudio();state.items=[];render();});document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>loadExample(button.dataset.example)));$('play-rhythm').addEventListener('click',playRhythm);$('stop').addEventListener('click',()=>stopAudio());$('tempo').addEventListener('change',()=>stopAudio());document.querySelectorAll('[data-listen]').forEach(button=>button.addEventListener('click',()=>playComparison(button.dataset.listen)));window.addEventListener('pagehide',()=>stopAudio());
  render();
  // Structured actions use the same state as the visible calculator.
  if(document.modelContext?.registerTool){const lifecycle=new AbortController();const read=()=>({meter:state.meter,items:state.items.map(i=>({...i})),beatsUsed:M.fraction(M.total(state.items),M.meters[state.meter].beat),beatsRemaining:M.fraction(M.capacity(M.meters[state.meter])-M.total(state.items),M.meters[state.meter].beat)});
    const tool={name:'configure_rhythm_measure',title:'Montar um compasso',description:'Substitui o compasso e as figuras na calculadora visível e retorna a soma das durações.',annotations:{readOnlyHint:false,untrustedContentHint:false},inputSchema:{type:'object',properties:{meter:{type:'string',enum:Object.keys(M.meters)},items:{type:'array',maxItems:96,items:{type:'object',properties:{id:{type:'string',enum:M.figures.map(f=>f.id)},kind:{type:'string',enum:['note','rest']},dotted:{type:'boolean'}},required:['id','kind','dotted'],additionalProperties:false}}},required:['meter','items'],additionalProperties:false},execute(input){if(!input||!M.meters[input.meter]||!Array.isArray(input.items)||input.items.length>96||input.items.some(i=>!i||!M.figures.some(f=>f.id===i.id)||!['note','rest'].includes(i.kind)||typeof i.dotted!=='boolean'))throw new Error('Compasso ou figuras inválidos.');stopAudio();state.meter=input.meter;state.items=input.items.map(i=>({id:i.id,kind:i.kind,dotted:i.dotted}));$('meter').value=state.meter;render();return read();}};
    try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
})();
