/* BeritaNasional SlopCheck — client-side, ID+EN. Adapted from SlopGuard 9-signal scorer. */
const CLICKBAIT=["100x","1000x","guaranteed profit","pasti cuan","dijamin cuan","klik link","click the link","dm me","dm saya","airdrop gratis","gratis klik","gacor","maxwin","slot gacor","togel","viral banget","auto kaya","cepat kaya","get rich quick","limited offer","promo terbatas","cuma hari ini","only today","subscribe dan menang","giveaway","bagi-bagi","heboh","gempar","tak disangka","bikin geger","merinding"];
const CLICHE=["delve","in today's fast-paced","game-changer","game changer","unlock the future","as an ai","as a language model","revolutionize","elevate your","seamless experience","cutting-edge solution","leverage the power","merevolusi","memukau","tak terbayangkan"];
const cnt=(re,t)=>{const m=t.match(re);return m?m.length:0};
function analyze(raw){
  const text=(raw||"").trim();const sigs=[];
  if(!text)return{score:0,verdict:"EMPTY",sigs,tokens:0,chars:0};
  const chars=text.length,words=text.toLowerCase().split(/\s+/).filter(Boolean),tokens=words.length;
  const push=(id,label,value,detail)=>sigs.push({id,label,value:Math.max(0,Math.min(100,Math.round(value))),detail});
  const letters=(text.match(/[A-Za-z]/g)||[]).length,upper=(text.match(/[A-Z]/g)||[]).length;
  push("caps","CAPS shouting",Math.min(100,(letters?upper/letters:0)*160),Math.round((letters?upper/letters:0)*100)+"% huruf kapital");
  const bang=cnt(/!{2,}|\?{2,}|!+\?+|\?+!+/g,text);
  push("punct","Spam tanda seru/tanya",Math.min(100,bang*34+cnt(/[!?]{3,}/g,text)*10),bang?bang+" ledakan !!!/???":"normal");
  const emoji=cnt(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,text);
  push("emoji","Spam emoji",Math.min(100,emoji*14),emoji+" emoji / "+tokens+" kata");
  const tags=cnt(/#\w+/g,text);
  push("tags","Hashtag stuffing",Math.min(100,Math.max(0,tags-2)*25),tags+" hashtag");
  const links=cnt(/https?:\/\/|t\.me\/|bit\.ly|wa\.me|klik link/gi,text);
  push("links","Spam link",Math.min(100,links*38),links+" link terdeteksi");
  const low=text.toLowerCase(),bait=CLICKBAIT.filter(p=>low.includes(p));
  push("bait","Clickbait & money-bait",Math.min(100,bait.length*32),bait.slice(0,3).join(", ")||"tanpa frasa umpan");
  const cl=CLICHE.filter(p=>low.includes(p));
  push("cliche","AI-cliché",Math.min(100,cl.length*40),cl.slice(0,3).join(", ")||"orisinal");
  const uniq=new Set(words).size,div=tokens?uniq/tokens:1;
  push("repeat","Repetisi & templating",tokens<4?30:Math.min(100,Math.max(0,(0.72-div)*220)),"diversitas kata "+Math.round(div*100)+"%");
  const short=tokens<=8&&(bait.length>0||emoji>=3||tags>=3)?70:0;
  push("short","Short-form spam",short,tokens+" kata");
  const w={caps:12,punct:12,emoji:10,tags:8,links:10,bait:18,cliche:12,repeat:12,short:6};
  let t=0,s=0;for(const g of sigs){t+=g.value*(w[g.id]||0);s+=w[g.id]||0}
  let score=Math.round(t/(s||1));const by=Object.fromEntries(sigs.map(g=>[g.id,g.value]));
  if(by.cliche>=80)score=Math.max(score,45);if(by.bait>=64)score=Math.max(score,62);
  if(by.bait>=90)score=Math.max(score,68);if(by.links>=76)score=Math.max(score,65);
  if(by.bait>0&&by.emoji>=42)score=Math.max(score,65);
  score=Math.min(100,score);
  return{score,verdict:score<=30?"CLEAN":score<=60?"SUSPECT":"SLOP",sigs,tokens,chars};
}
const $=id=>document.getElementById(id);
const SAMPLES={bersih:"Kementerian ESDM mengonfirmasi tiga smelter nikel mulai beroperasi komersial pada kuartal I 2026 dengan serapan 4.200 pekerja. Data bersumber dari dokumen resmi dan pernyataan juru bicara kementerian.",slop:"GRATIS CUAN 100x!!! SLOT GACOR HARI INI 🔥🔥🔥🔥 klik link ini sekarang, dijamin kaya!!! wa.me/62812xxxxx #cuan #gacor #viral",cliche:"In today's fast-paced world, this game-changer will revolutionize your seamless experience and unlock the future. Delve into our cutting-edge solution!!!"};
function color(v){return v==="CLEAN"?"#1c5c1f":v==="SUSPECT"?"#b45309":v==="SLOP"?"#B91C1C":"#888"}
function render(r){
  $("score").textContent=r.tokens?r.score+"/100":"--";
  const v=$("verdict");v.textContent=r.tokens?(r.verdict==="CLEAN"?"CLEAN ✓":r.verdict==="SUSPECT"?"SUSPECT ⚠":"SLOP ⛔"): "MENUNGGU";v.style.color=color(r.verdict);
  $("meta").textContent=r.tokens?r.tokens+" kata · "+r.chars+" karakter · standar redaksi ≤30":"ketik atau tempel teks…";
  $("sigs").innerHTML=r.sigs.map(s=>`<div class="sig"><div class="sig-top"><span>${s.label}</span><span>${s.value}</span></div><div class="bar"><i style="width:${s.value}%;background:${s.value>60?"#B91C1C":s.value>30?"#d97706":"#2f7d32"}"></i></div><small>${s.detail}</small></div>`).join("");
}
document.addEventListener("DOMContentLoaded",()=>{
  const inp=$("input");if(!inp)return;
  const upd=()=>render(analyze(inp.value));
  inp.addEventListener("input",upd);
  document.querySelectorAll(".chip").forEach(b=>b.addEventListener("click",()=>{inp.value=SAMPLES[b.dataset.sample]||"";upd();inp.focus()}));
  render(analyze(""));
  const d=new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Jakarta"});const c=$("clock");if(c)c.textContent=d;
  const f=$("news-form");if(f)f.addEventListener("submit",e=>{e.preventDefault();$("news-msg").textContent="Terima kasih! Cek email untuk konfirmasi (demo — hubungkan ke Buttondown/Mailchimp saat launch).";f.reset()});
});
