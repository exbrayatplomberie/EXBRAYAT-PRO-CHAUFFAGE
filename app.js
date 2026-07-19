'use strict';
const {PDFDocument,rgb,StandardFonts,PDFName,PDFDict,PDFString,PDFHexString,PDFArray}=PDFLib;
const STORE='exbrayat_chauffage_dossiers_v010', SETTINGS='exbrayat_chauffage_settings_v010';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const CHECKS={
 gaz:['Nettoyage du corps de chauffe et du brûleur','Vérification du circulateur chauffage','Vérification / réglage de la régulation','Vérification des dispositifs de sécurité','Contrôle du conduit de raccordement','VMC gaz : sécurité et conduit','Vérification des débits de gaz','Contrôle de l’embouement','Purge du circuit hydraulique','Contrôle de la pression du circuit','Fonctionnement du circulateur hydraulique','Pression des vases d’expansion','Dimensionnement de la chaudière','Ballon : anodes et accessoires','Vacuité conduits de fumée','Dispositifs extérieurs','Détartrage'],
 fioul:['Démontage et nettoyage du brûleur','Nettoyage du pré-filtre fioul','Nettoyage du filtre de pompe','Nettoyage du corps de chauffe','Sécurités du brûleur','Sécurités de la chaudière','Circulateur de chauffage','Conduit de raccordement','Contrôle de l’embouement','Purge du circuit','Pression du circuit','Circulateur hydraulique','Vases d’expansion','Dimensionnement chaudière','Ramonage conduit de fumée','Ramonage conduit raccordement','Ballon : anodes et accessoires','Amenée d’air / évacuation','Régulation appareil','Régulation installation'],
 granules:['Conduit de raccordement','Vacuité du conduit de fumée','Terminal d’évacuation','Amenées d’air comburant','Ventilateur et éléments aérauliques','Décendrage','Joints et éléments amovibles','Organes de sécurité','Circuit d’alimentation combustible','Connexions électriques','Circulateur','Radiateurs et canalisations','Pression réseau hydraulique','Ramonage conduit de fumée','Vase d’expansion','Vidange pot à boues','Bougie d’allumage']
};
const FIELD_MAP={
 gaz:{template:'attestation-gaz.pdf',prefix:'A2-',fields:{contrat:'No contrat',entreprise:'Coordonnees prestataire',client:'Coordonnees client',adresse:'Adresse installation',local:'Local chaudiere',marque:'marque1',puissance:'puissance1',evacuation:'type1',miseService:'mes1',serie:'ns1',dernierEntretien:'Date entretien',dernierRamonage:'Date ramonage',bruleurMarque:'marque2',bruleurPuissance:'puissance2',bruleurDate:'mes2',bruleurSerie:'ns2',tempFumees:'Temp fumees',tempAmbiante:'Temp ambiante',co2:'Teneur co2',o2:'Teneur o2',co:'Teneur co',appareilMesure:'Appareil mesure',rendement:'Rendement1',defauts:'Defauts corriges',usage:'Usage',ameliorations:'Ameliorations',remplacement:'Remplacement',ville:'Fait a',dateVisite:'Fait le',dateVisite2:'Date visite'},groups:17},
 fioul:{template:'attestation-fioul.pdf',prefix:'A2-',fields:{contrat:'N° DU CONTRAT',entreprise:'Coordonnees prestataire',client:'Coordonnees client',adresse:'Adresse installation',local:'Local chaudiere',marque:'marque1',puissance:'puissance1',evacuation:'type1',miseService:'mes1',serie:'ns1',dernierEntretien:'Date entretien',dernierRamonage:'Date ramonage',bruleurMarque:'marque2',bruleurPuissance:'puissance2',bruleurDate:'mes2',gicleur:'gicleur',bruleurSerie:'ns2',tempFumees:'Temp fumees',tempAmbiante:'Temp ambiante',co2:'Teneur co2',o2:'Teneur o2',pressionGicleur:'Pression gicleur',co:'Teneur co',appareilMesure:'Marque et rélérence',rendement:'Rendement1',defauts:'Defauts corriges',usage:'Usage',ameliorations:'Ameliorations',remplacement:'Remplacement',ville:'Fait a',dateVisite:'Fait le',dateVisite2:'Date visite'},groups:20},
 granules:{template:'attestation-granules.pdf',prefix:'A2-',fields:{contrat:'N° DU CONTRAT',entreprise:'Coordonnees prestataire',client:'Coordonnees client',adresse:'Adresse installation',local:'Local chaudiere',marque:'marque1',puissance:'puissance1',evacuation:'type1',miseService:'mes1',serie:'ns1',dernierEntretien:'Date entretien',dernierRamonage:'Date ramonage',co:'Teneur co',appareilMesure:'Appareil mesure',defauts:'Defauts corriges',usage:'Usage',ameliorations:'Ameliorations',remplacement:'Remplacement',ville:'Fait a',dateVisite:'Fait le',dateVisite2:'Date visite'},groups:17}
};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function defaults(){return {entrepriseNom:'SARL EXBRAYAT CEDRIC PLOMBERIE CHAUFFAGE',entrepriseAdresse:'26 avenue de Jumeaux\n63570 BRASSAC-LES-MINES',entrepriseTel:'06 17 16 15 38',entrepriseEmail:'cedric.exbrayat@orange.fr',technicien:'EXBRAYAT Cédric'}}
function settings(){try{return {...defaults(),...JSON.parse(localStorage.getItem(SETTINGS)||'{}')}}catch{return defaults()}}
function renderSettings(){const s=settings();Object.keys(s).forEach(k=>{const e=$('#'+k);if(e)e.value=s[k]})}
function switchPage(id){$$('.page').forEach(p=>p.classList.toggle('active',p.id===id));$$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));if(id==='entretien'){requestAnimationFrame(()=>$$('.signatures canvas').forEach(c=>c.resizeSignature&&c.resizeSignature()));}scrollTo(0,0)}
$$('nav button').forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
$$('.modules button[data-type]').forEach(b=>b.onclick=()=>{type.value=b.dataset.type;updateType();switchPage('entretien')});
function updateType(){const t=type.value;$('#moduleTitle').textContent={gaz:'Entretien chaudière gaz',fioul:'Entretien chaudière fioul',granules:'Entretien poêle / chaudière granulés'}[t];$('#burnerCard').style.display=t==='fioul'||t==='gaz'?'block':'none';$('#gicleurPression').style.display=t==='fioul'?'flex':'none';$('#tirageField').style.display=t==='granules'?'flex':'none';$('#excesField').style.display=t==='granules'?'flex':'none';renderChecks(t)}
function renderChecks(t,values=[]){const box=$('#checks');box.innerHTML='';CHECKS[t].forEach((label,i)=>{const row=document.createElement('div');row.className='check-row';row.innerHTML=`<span>${i+1}. ${label}</span><select name="check${i+1}"><option>Oui</option><option>Non</option><option>Sans objet</option></select>`;row.querySelector('select').value=values[i]||'Oui';box.appendChild(row)})}
type.onchange=updateType;
function setupCanvas(id){
 const c=$('#'+id),ctx=c.getContext('2d',{willReadFrequently:true});let drawing=false,ink=false;
 function configure(){ctx.lineWidth=2.6;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#111'}
 function resize(){
  const r=c.getBoundingClientRect();
  if(r.width<10||r.height<10)return;
  const d=Math.max(1,window.devicePixelRatio||1);
  let old='';try{if(c.width>1&&c.height>1&&c.dataset.hasInk==='1')old=c.toDataURL('image/png')}catch(_){ }
  const nw=Math.max(1,Math.round(r.width*d)),nh=Math.max(1,Math.round(r.height*d));
  if(c.width===nw&&c.height===nh)return;
  c.width=nw;c.height=nh;ctx.setTransform(d,0,0,d,0,0);configure();
  if(old){const im=new Image();im.onload=()=>{ctx.drawImage(im,0,0,r.width,r.height);c.dataset.hasInk='1'};im.src=old}
 }
 function point(e){const r=c.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
 function down(e){e.preventDefault();resize();drawing=true;ink=true;c.dataset.hasInk='1';const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+.1,p.y+.1);ctx.stroke();try{c.setPointerCapture(e.pointerId)}catch(_){} }
 function move(e){if(!drawing)return;e.preventDefault();const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke()}
 function up(e){if(!drawing)return;if(e)e.preventDefault();drawing=false;try{if(e)c.releasePointerCapture(e.pointerId)}catch(_){} }
 c.dataset.hasInk='0';c.resizeSignature=resize;
 c.addEventListener('pointerdown',down,{passive:false});
 c.addEventListener('pointermove',move,{passive:false});
 c.addEventListener('pointerup',up,{passive:false});
 c.addEventListener('pointercancel',up,{passive:false});
 c.addEventListener('pointerleave',e=>{if(e.buttons===0)up(e)},{passive:false});
 c.clearSignature=()=>{resize();ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);ctx.restore();const d=Math.max(1,window.devicePixelRatio||1);ctx.setTransform(d,0,0,d,0,0);configure();ink=false;c.dataset.hasInk='0'};
 if('ResizeObserver' in window){new ResizeObserver(()=>resize()).observe(c)}else window.addEventListener('resize',resize);
 requestAnimationFrame(resize);
 return c
}
setupCanvas('sigTech');setupCanvas('sigClient');$$('[data-clear]').forEach(b=>b.onclick=()=>{const c=$('#'+b.dataset.clear);if(c.clearSignature)c.clearSignature()});
function croppedSignatureData(canvas){
 if(canvas.dataset.hasInk!=='1')return '';
 const ctx=canvas.getContext('2d',{willReadFrequently:true}),img=ctx.getImageData(0,0,canvas.width,canvas.height),a=img.data;
 let minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){if(a[(y*canvas.width+x)*4+3]>20){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}}
 if(maxX<0)return '';
 const pad=Math.max(10,Math.round(Math.min(canvas.width,canvas.height)*.05));
 minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(canvas.width-1,maxX+pad);maxY=Math.min(canvas.height-1,maxY+pad);
 const out=document.createElement('canvas');out.width=maxX-minX+1;out.height=maxY-minY+1;out.getContext('2d').drawImage(canvas,minX,minY,out.width,out.height,0,0,out.width,out.height);
 return out.toDataURL('image/png');
}
function data(){const o=Object.fromEntries(new FormData($('#form')).entries());o.checks=CHECKS[o.type].map((_,i)=>o['check'+(i+1)]||'Oui');o.sigTech=croppedSignatureData($('#sigTech'));o.sigClient=croppedSignatureData($('#sigClient'));o.id=o.id||`${Date.now()}`;o.savedAt=new Date().toISOString();return o}
function save(){if(!$('#form').reportValidity())return;const d=data(),list=load();const i=list.findIndex(x=>x.id===d.id);i>=0?list[i]=d:list.unshift(d);localStorage.setItem(STORE,JSON.stringify(list));$('#form').dataset.id=d.id;renderHistory();toast('Entretien enregistré')}
function load(){try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return []}}
function renderHistory(){const q=($('#search').value||'').toLowerCase(),box=$('#history');box.innerHTML='';load().filter(d=>`${d.clientNom} ${d.ville} ${d.type}`.toLowerCase().includes(q)).forEach(d=>{const r=document.createElement('div');r.className='history-item';r.innerHTML=`<div><strong>${d.clientNom||'Sans nom'}</strong><div>${d.ville||''} — ${d.type} — ${d.dateVisite||''}</div></div><div><button>Ouvrir</button> <button>Supprimer</button></div>`;const [a,b]=r.querySelectorAll('button');a.onclick=()=>fill(d);b.onclick=()=>{if(confirm('Supprimer cet entretien ?')){localStorage.setItem(STORE,JSON.stringify(load().filter(x=>x.id!==d.id)));renderHistory()}};box.appendChild(r)});if(!box.children.length)box.innerHTML='<p class="hint">Aucun entretien enregistré.</p>'}
function fill(d){$('#form').reset();type.value=d.type||'gaz';updateType();Object.entries(d).forEach(([k,v])=>{const e=$('#form').elements[k];if(e&&typeof v==='string')e.value=v});renderChecks(d.type,d.checks);$('#form').dataset.id=d.id;drawSaved('sigTech',d.sigTech);drawSaved('sigClient',d.sigClient);switchPage('entretien')}
function drawSaved(id,url){const c=$('#'+id),ctx=c.getContext('2d');if(c.clearSignature)c.clearSignature();if(!url)return;const im=new Image();im.onload=()=>{ctx.drawImage(im,0,0,c.clientWidth,c.clientHeight);c.dataset.hasInk='1'};im.src=url}
function newForm(){if(!confirm('Créer une nouvelle fiche ?'))return;$('#form').reset();delete $('#form').dataset.id;type.value='gaz';$('[name=dateVisite]').value=new Date().toISOString().slice(0,10);updateType();$$('canvas').forEach(c=>c.clearSignature?c.clearSignature():c.getContext('2d').clearRect(0,0,c.width,c.height))}
$('#saveBtn').onclick=save;$('#newBtn').onclick=newForm;$('#search').oninput=renderHistory;
$('#saveSettings').onclick=()=>{const s={};Object.keys(defaults()).forEach(k=>s[k]=$('#'+k).value);localStorage.setItem(SETTINGS,JSON.stringify(s));toast('Coordonnées enregistrées')};
function cleanPdfText(v){return String(v??'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/\u00a0/g,' ')}
function companyText(){const s=settings();return [s.entrepriseNom,s.entrepriseAdresse,`Tel : ${s.entrepriseTel}`,s.entrepriseEmail].filter(Boolean).join('\n')}
function clientText(d){return [d.clientNom,d.clientTel].filter(Boolean).join('\n')}
function formatDate(v){if(!v)return '';const p=v.split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v}
function widgetName(dict){const parent=dict.lookupMaybe(PDFName.of('Parent'),PDFDict);const t=dict.lookupMaybe(PDFName.of('T'),PDFString)||dict.lookupMaybe(PDFName.of('T'),PDFHexString)||parent?.lookupMaybe(PDFName.of('T'),PDFString)||parent?.lookupMaybe(PDFName.of('T'),PDFHexString);try{return t?.decodeText?.()||''}catch{return ''}}
function widgetRect(dict){const a=dict.lookupMaybe(PDFName.of('Rect'),PDFArray);if(!a||a.size()<4)return null;const n=i=>a.lookup(i).asNumber();const x1=n(0),y1=n(1),x2=n(2),y2=n(3);return {x:Math.min(x1,x2),y:Math.min(y1,y2),width:Math.abs(x2-x1),height:Math.abs(y2-y1)}}
function collectWidgets(doc){const out=[];doc.getPages().forEach((page,pageIndex)=>{const annots=page.node.Annots();if(!annots)return;for(let i=0;i<annots.size();i++){const ref=annots.get(i),dict=doc.context.lookup(ref,PDFDict);if(!dict)continue;const subtype=dict.lookupMaybe(PDFName.of('Subtype'),PDFName);if(subtype?.toString()!=='/Widget')continue;const name=widgetName(dict),rect=widgetRect(dict);if(name&&rect)out.push({page,pageIndex,name,rect,ref,dict})}});return out}
function wrapLines(text,font,size,maxWidth){const lines=[];for(const raw of cleanPdfText(text).split(/\r?\n/)){const words=raw.split(/\s+/).filter(Boolean);if(!words.length){lines.push('');continue}let line='';for(const w of words){const test=line?line+' '+w:w;if(font.widthOfTextAtSize(test,size)<=maxWidth)line=test;else{if(line)lines.push(line);line=w}}if(line)lines.push(line)}return lines}
function paintFieldBackground(page,rect,{margin=.6,color=rgb(1,1,1)}={}){
 page.drawRectangle({x:rect.x-margin,y:rect.y-margin,width:rect.width+margin*2,height:rect.height+margin*2,color});
}
function drawInRect(page,rect,text,font,{multiline=false,align='left',top=false,ruled=false,sizeHint=0}={}){
 if(text===undefined||text===null||text==='')return;
 const value=cleanPdfText(text),pad=3,maxW=Math.max(2,rect.width-pad*2),maxH=Math.max(2,rect.height-pad*2);
 let size=sizeHint||((multiline||ruled)?7.4:7.0),lines=(multiline||ruled)?wrapLines(value,font,size,maxW):[value.replace(/\s*\n\s*/g,' ')];
 while(size>=5.6){const widest=Math.max(...lines.map(l=>font.widthOfTextAtSize(l,size)),0);if(widest<=maxW&&lines.length*size*1.35<=maxH)break;size-=.25;lines=(multiline||ruled)?wrapLines(value,font,size,maxW):lines}
 const lineH=size*1.35;let y=top||ruled?rect.y+rect.height-size-4:rect.y+Math.max(2,(rect.height-size)/2+.6);
 for(const line of lines){let x=rect.x+pad;if(align==='center')x=rect.x+(rect.width-font.widthOfTextAtSize(line,size))/2;page.drawText(line,{x,y,size,font,color:rgb(0,0,0)});y-=lineH;if(y<rect.y+1)break}
}
function removeWidgets(doc){for(const page of doc.getPages()){const annots=page.node.Annots();if(!annots)continue;const kept=[];for(let i=0;i<annots.size();i++){const ref=annots.get(i),dict=doc.context.lookup(ref,PDFDict),sub=dict?.lookupMaybe(PDFName.of('Subtype'),PDFName)?.toString();if(sub!=='/Widget')kept.push(ref)}if(kept.length){const arr=doc.context.obj(kept);page.node.set(PDFName.of('Annots'),arr)}else page.node.delete(PDFName.of('Annots'))}doc.catalog.delete(PDFName.of('AcroForm'))}
function checkGroupOrder(type){if(type==='gaz')return ['Groupe1','Groupe2','Groupe3','Groupe4','Groupe5','Groupe6','Groupe7','Groupe8','Groupe81','Groupe82','Groupe83','Groupe84','Groupe85','Groupe86','Groupe9','Groupe10','Groupe11'];if(type==='fioul')return Array.from({length:20},(_,i)=>`Groupe${i+1}`);return Array.from({length:17},(_,i)=>`Groupe${i+1}`)}
async function createPdf(){if(!$('#form').reportValidity())return;save();const d=data(),cfg=FIELD_MAP[d.type];const response=await fetch(cfg.template,{cache:'no-store'});if(!response.ok)throw new Error(`Le modele PDF ${cfg.template} est introuvable sur GitHub (${response.status}).`);const bytes=await response.arrayBuffer();const head=new Uint8Array(bytes.slice(0,5));if(String.fromCharCode(...head)!=='%PDF-')throw new Error(`Le fichier ${cfg.template} recu n'est pas un PDF valide.`);const doc=await PDFDocument.load(bytes,{ignoreEncryption:true});const font=await doc.embedFont(StandardFonts.Helvetica);const bold=await doc.embedFont(StandardFonts.HelveticaBold);const widgets=collectWidgets(doc);
 const values={
  'No contrat':d.contrat,'N° DU CONTRAT':d.contrat,
  'A2-Coordonnees prestataire':companyText(),'A2-Coordonnees client':clientText(d),'A2-Adresse installation':d.adresse,'A2-Local chaudiere':d.local,
  'A2-marque1':d.marque,'A2-puissance1':d.puissance,'A2-type1':d.evacuation,'A2-mes1':d.miseService,'A2-ns1':d.serie,
  'A2-Date entretien':d.dernierEntretien,'A2-Date ramonage':d.dernierRamonage,'A2-marque2':d.bruleurMarque,'A2-puissance2':d.bruleurPuissance,'A2-mes2':d.bruleurDate,'A2-ns2':d.bruleurSerie,
  'A2-Temp fumees':d.tempFumees,'A2-Temp ambiante':d.tempAmbiante,'A2-Teneur co2':d.co2,'A2-Teneur o2':d.o2,'A2-Pression gicleur':d.pressionGicleur,'A2-Teneur co':d.co,'A2-Appareil mesure':d.appareilMesure,'A2-Marque et rélérence':d.appareilMesure,'A2-Rendement1':d.rendement,
  'A2-Defauts corriges':d.defauts,'A2-Usage':d.usage,'A2-Ameliorations':d.ameliorations,'A2-Remplacement':d.remplacement,'A2-Fait a':d.ville,'A2-Fait le':formatDate(d.dateVisite),'A2-Date visite':formatDate(d.dateVisite)
 };
 const multilineNames=new Set(['A2-Coordonnees prestataire','A2-Coordonnees client','A2-Adresse installation','A2-Local chaudiere','A2-Appareil mesure','A2-Marque et rélérence']);
 const ruledNames=new Set(['A2-Defauts corriges','A2-Usage','A2-Ameliorations','A2-Remplacement']);
 const topNames=new Set(['A2-Coordonnees prestataire','A2-Coordonnees client','A2-Adresse installation','A2-Local chaudiere','A2-Appareil mesure','A2-Marque et rélérence']);
 const gasCleanNames=new Set([
  'No contrat','N° DU CONTRAT','A2-Coordonnees prestataire','A2-Coordonnees client','A2-Adresse installation','A2-Local chaudiere',
  'A2-marque1','A2-puissance1','A2-type1','A2-mes1','A2-ns1','A2-Date entretien','A2-Date ramonage',
  'A2-marque2','A2-puissance2','A2-mes2','A2-ns2','A2-Temp fumees','A2-Temp ambiante','A2-Teneur co2','A2-Teneur o2',
  'A2-Teneur co','A2-Appareil mesure','A2-Rendement1','A2-Defauts corriges','A2-Usage','A2-Ameliorations','A2-Remplacement',
  'A2-Fait a','A2-Fait le','A2-Date visite'
 ]);
 for(const w of widgets){
  if(!Object.prototype.hasOwnProperty.call(values,w.name))continue;
  if(d.type==='gaz'&&gasCleanNames.has(w.name))paintFieldBackground(w.page,w.rect,{margin:.9});
  drawInRect(w.page,w.rect,values[w.name],font,{multiline:multilineNames.has(w.name),top:topNames.has(w.name),ruled:ruledNames.has(w.name),sizeHint:ruledNames.has(w.name)?7.7:0});
 }
 const groups=checkGroupOrder(d.type);groups.forEach((g,i)=>{const selected=d.checks[i]||'Oui';const ws=widgets.filter(w=>w.name===`${cfg.prefix}${g}`).sort((a,b)=>a.rect.x-b.rect.x);const idx=selected==='Non'?1:selected==='Sans objet'?2:0;if(ws[idx])drawInRect(ws[idx].page,ws[idx].rect,'X',bold,{align:'center'})});
 const co=Number(String(d.co||'').replace(',','.'));const coWidgets=widgets.filter(w=>w.name===`${cfg.prefix}Groupe18`).sort((a,b)=>b.rect.y-a.rect.y);if(coWidgets.length){const idx=co>=50?2:co>=10?1:0;if(coWidgets[idx])drawInRect(coWidgets[idx].page,coWidgets[idx].rect,'X',bold,{align:'center'})}
 removeWidgets(doc);
 try{const logoBytes=await fetch('logo-exbrayat.png',{cache:'no-store'}).then(r=>r.arrayBuffer()),logo=await doc.embedPng(logoBytes),p0=doc.getPages()[0],ps=p0.getSize();p0.drawImage(logo,{x:ps.width-125,y:ps.height-62,width:105,height:45,opacity:.92})}catch(e){console.warn('Logo non ajoute',e)}
 const last=doc.getPages()[doc.getPageCount()-1];
 async function placeSignature(dataUrl,box){if(!dataUrl)return;const png=await doc.embedPng(await fetch(dataUrl).then(r=>r.arrayBuffer()));const scale=Math.min((box.width-10)/png.width,(box.height-10)/png.height);const width=png.width*scale,height=png.height*scale;last.drawImage(png,{x:box.x+(box.width-width)/2,y:box.y+(box.height-height)/2,width,height})}
 if(d.type==='gaz'){await placeSignature(d.sigTech,{x:56,y:43,width:235,height:92});await placeSignature(d.sigClient,{x:313,y:43,width:226,height:92})}
 else{await placeSignature(d.sigTech,{x:56,y:38,width:235,height:88});await placeSignature(d.sigClient,{x:313,y:38,width:226,height:88})}
 const out=await doc.save({useObjectStreams:false});const blob=new Blob([out],{type:'application/pdf'}),url=URL.createObjectURL(blob),name=`ATTESTATION-${d.type.toUpperCase()}-${(d.clientNom||'CLIENT').replace(/[^a-z0-9]/gi,'_')}-${d.dateVisite||''}.pdf`;if(navigator.share&&navigator.canShare){try{const file=new File([blob],name,{type:'application/pdf'});if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});return}}catch(e){}}
 const w=window.open(url,'_blank');if(!w){const a=document.createElement('a');a.href=url;a.download=name;a.click()}setTimeout(()=>URL.revokeObjectURL(url),60000)}
$('#pdfBtn').onclick=()=>createPdf().catch(e=>{console.error(e);alert('Erreur pendant la création du PDF : '+e.message)});
renderSettings();renderHistory();$('[name=dateVisite]').value=new Date().toISOString().slice(0,10);updateType();if('serviceWorker' in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{});
