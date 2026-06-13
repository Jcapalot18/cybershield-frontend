/* ═══════════ CyberShield Dashboard — data & shared bits ═══════════ */
const { useState, useEffect, useRef, useMemo } = React;

/* ── icon set (stroke) ── */
const I = {
  grid:   <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  shield: <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  shieldCheck: <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  grad:   <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  search: <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  users:  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  card:   <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  user:   <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bolt:   <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  trendUp:<svg viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  trendDn:<svg viewBox="0 0 24 24"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
  arrowUp:<svg viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  arrowR: <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  x:      <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  alert:  <svg viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  bell:   <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  clock:  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  file:   <svg viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  download:<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  play:   <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 4 20 12 6 20 6 4"/></svg>,
  lock:   <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  globe:  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg>,
  mail:   <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>,
  plus:   <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  logout: <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu:   <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  cog:    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  eye:    <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  key:    <svg viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  star:   <svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"/></svg>,
};

/* ── brand mark ── */
function Logo(){
  return (
    <svg viewBox="0 0 30 36" fill="none">
      <path d="M15 1L29 6.5V21C29 30 22 35.5 15 37.5C8 35.5 1 30 1 21V6.5L15 1Z" fill="rgba(255,107,0,0.08)" stroke="#FF6B00" strokeWidth="1.5"/>
      <path d="M15 11L20 14L15 17L10 14Z" fill="rgba(255,107,0,0.2)" stroke="#FF6B00" strokeWidth="1.25" strokeLinejoin="round"/>
      <path d="M10 14L15 17V23L10 20Z" stroke="#FF6B00" strokeWidth="1.25" strokeLinejoin="round"/>
      <path d="M20 14L15 17V23L20 20Z" fill="rgba(255,107,0,0.1)" stroke="#FF6B00" strokeWidth="1.25" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── helpers ── */
const scoreColor = s => s>=80?'var(--green)':s>=65?'var(--yellow)':s>=45?'var(--orange)':'var(--red)';
const scoreGrade = s => s>=80?'Excellent':s>=65?'Good':s>=45?'Fair':'At Risk';
const cls = (...a)=>a.filter(Boolean).join(' ');

/* count-up hook (interval + timestamp based — robust when rAF is throttled) */
function useCountUp(target, dur=1100, deps=[]){
  const [v,setV]=useState(target);
  useEffect(()=>{
    if(typeof target!=='number'||isNaN(target)){setV(target);return;}
    let done=false;
    const t0=Date.now();
    setV(0);
    const id=setInterval(()=>{
      const p=Math.min((Date.now()-t0)/dur,1);
      const e=1-Math.pow(1-p,3);
      setV(target*e);
      if(p>=1){done=true;clearInterval(id);setV(target);}
    },32);
    const safety=setTimeout(()=>{ if(!done){clearInterval(id);setV(target);} }, dur+400);
    return ()=>{clearInterval(id);clearTimeout(safety);};
  },[target,...deps]);
  return v;
}

/* animated score ring */
function ScoreRing({score,size=128,stroke=9}){
  const r=(size-stroke)/2, circ=2*Math.PI*r;
  const v=useCountUp(score,1300);
  const col=scoreColor(score);
  const off=circ-(v/100)*circ;
  return (
    <div className="ring" style={{width:size,height:size}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} style={{transition:'stroke-dashoffset .1s linear',filter:`drop-shadow(0 0 6px ${col}66)`}}/>
      </svg>
      <div className="ring-center">
        <div className="ring-num" style={{color:col}}>{Math.round(v)}</div>
        <div className="ring-lbl" style={{color:col}}>{scoreGrade(score)}</div>
      </div>
    </div>
  );
}

/* sparkline */
function Spark({data,color,w=140,h=42}){
  const max=Math.max(...data),min=Math.min(...data),rng=max-min||1;
  const pts=data.map((d,i)=>[ (i/(data.length-1))*w, h-((d-min)/rng)*(h-6)-3 ]);
  const path=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area=path+` L${w} ${h} L0 ${h} Z`;
  const gid='sp'+color.replace(/[^a-z0-9]/gi,'');
  return (
    <svg className="kpi-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.28"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ───────── MOCK DATA ───────── */
const MOCK = {
  company:'Your Business', plan:'Business', seats:50,
  user:{name:'Dana Whitlock', role:'Owner', av:'DW'},
  score:84,
  scoreHistory:[
    {m:'Dec', score:51}, {m:'Jan', score:58}, {m:'Feb', score:63},
    {m:'Mar', score:69}, {m:'Apr', score:77}, {m:'May', score:84},
  ],
  industryAvg:[48,50,53,55,58,61],
  breakdown:[
    {label:'Vulnerability scanning', pct:92, color:'var(--orange)'},
    {label:'Team training', pct:87, color:'var(--green)'},
    {label:'Breach monitoring', pct:78, color:'var(--cyan)'},
    {label:'Email security', pct:64, color:'var(--yellow)'},
  ],
  threats:[
    {sev:'Critical', t:'Chrome 22 critical vulnerabilities patched', s:'CyberWire Daily · Ep. 2562', c:'var(--red)', b:'bc'},
    {sev:'Critical', t:'Microsoft OAuth authentication abuse campaign', s:'CyberWire Daily · Ep. 2559', c:'var(--red)', b:'bc'},
    {sev:'High', t:'macOS malware targeting crypto developers', s:'CyberWire Daily · Ep. 2561', c:'var(--yellow)', b:'bh'},
    {sev:'High', t:'AI-powered phishing attacks at scale', s:'CyberWire Daily · Ep. 2562', c:'var(--yellow)', b:'bh'},
    {sev:'Medium', t:'Ubiquiti UniFi security vulnerabilities', s:'CyberWire Daily · Ep. 2558', c:'var(--orange)', b:'bm'},
  ],
  activity:[
    {type:'scan', c:'var(--orange)', t:'Vulnerability scan completed on meridianlaw.com', time:'12 min ago'},
    {type:'training', c:'var(--green)', t:'Sarah Chen completed "OAuth consent attacks"', time:'1h ago'},
    {type:'breach', c:'var(--red)', t:'New breach detected for sarah@meridianlaw.com', time:'3h ago'},
    {type:'team', c:'var(--blue)', t:'Mike Torres was added to the team', time:'Yesterday'},
    {type:'report', c:'var(--cyan)', t:'May 2026 security report generated', time:'2 days ago'},
  ],
  emails:[
    {email:'dana@meridianlaw.com', status:'secure', breaches:0},
    {email:'sarah@meridianlaw.com', status:'breached', breaches:2, detail:['LinkedIn (2021)','Dropbox (2016)']},
    {email:'mike@meridianlaw.com', status:'secure', breaches:0},
    {email:'admin@meridianlaw.com', status:'warn', breaches:1, detail:['Adobe (2013)']},
    {email:'billing@meridianlaw.com', status:'secure', breaches:0},
  ],
  scanChecks:['SSL Certificate','HSTS Header','Content Security Policy','X-Frame-Options','SPF Record','DMARC Policy','Secure Cookies','HTTPS Redirect'],
  scanResults:[
    {k:'SSL Certificate', d:'Valid TLS 1.3 certificate, expires in 180 days', v:'Valid · 180d', st:'pass'},
    {k:'HSTS Header', d:'Strict-Transport-Security header is missing', v:'Missing', st:'fail'},
    {k:'Content Security Policy', d:'CSP header present and well-formed', v:'Configured', st:'pass'},
    {k:'X-Frame-Options', d:'Set to SAMEORIGIN — clickjacking protected', v:'SAMEORIGIN', st:'pass'},
    {k:'SPF Record', d:'Valid SPF record found for domain', v:'Pass', st:'pass'},
    {k:'DMARC Policy', d:'Policy set to p=none — provides no enforcement', v:'Weak (p=none)', st:'warn'},
    {k:'Secure Cookies', d:'All cookies use Secure and HttpOnly flags', v:'Secure', st:'pass'},
    {k:'HTTPS Redirect', d:'HTTP traffic redirects to HTTPS', v:'Enforced', st:'pass'},
  ],
  modules:[
    {week:'Week 23', title:'Spotting AI-crafted phishing', desc:'Learn how attackers use LLMs to craft flawless phishing emails — and the tells that remain.', mins:5, prog:100, done:true, grad:'linear-gradient(135deg,#FF6B00,#7a1d00)'},
    {week:'Week 24', title:'OAuth consent attacks', desc:'How "sign in with" prompts get weaponized to hijack accounts without a password.', mins:6, prog:60, done:false, grad:'linear-gradient(135deg,#9333ea,#3b0764)'},
    {week:'Week 25', title:'Ransomware first response', desc:'The first 15 minutes after detection — containment steps that limit the damage.', mins:7, prog:0, done:false, grad:'linear-gradient(135deg,#dc2626,#450a0a)'},
    {week:'Week 22', title:'Password hygiene & 2FA', desc:'Why length beats complexity, and setting up phishing-resistant MFA.', mins:4, prog:100, done:true, grad:'linear-gradient(135deg,#0891b2,#083344)'},
    {week:'Week 21', title:'Wire fraud & BEC scams', desc:'Business email compromise targeting invoices and wire transfers — verification habits.', mins:5, prog:100, done:true, grad:'linear-gradient(135deg,#16a34a,#052e16)'},
    {week:'Week 20', title:'Safe remote work', desc:'VPNs, public Wi-Fi, and securing the home office without slowing down.', mins:5, prog:0, done:false, grad:'linear-gradient(135deg,#d97706,#451a03)'},
  ],
  team:[
    {name:'Dana Whitlock', email:'dana@meridianlaw.com', role:'Owner', status:'active', training:100, last:'Online now', av:'DW'},
    {name:'Sarah Chen', email:'sarah@meridianlaw.com', role:'Admin', status:'active', training:80, last:'12 min ago', av:'SC'},
    {name:'Mike Torres', email:'mike@meridianlaw.com', role:'Member', status:'active', training:40, last:'2h ago', av:'MT'},
    {name:'Priya Nair', email:'priya@meridianlaw.com', role:'Member', status:'active', training:100, last:'Yesterday', av:'PN'},
    {name:'James Okafor', email:'james@meridianlaw.com', role:'Member', status:'pending', training:0, last:'Invited', av:'JO'},
    {name:'Lena Vogt', email:'lena@meridianlaw.com', role:'Member', status:'active', training:60, last:'3 days ago', av:'LV'},
  ],
  invoices:[
    {date:'May 1, 2026', amt:'$199.00', plan:'Business · Monthly', status:'Paid'},
    {date:'Apr 1, 2026', amt:'$199.00', plan:'Business · Monthly', status:'Paid'},
    {date:'Mar 1, 2026', amt:'$199.00', plan:'Business · Monthly', status:'Paid'},
    {date:'Feb 1, 2026', amt:'$49.00', plan:'Starter · Monthly', status:'Paid'},
  ],
  plans:[
    {id:'starter', name:'Starter', price:49, seats:'10 seats', scans:'5 scans/mo'},
    {id:'business', name:'Business', price:199, seats:'50 seats', scans:'Unlimited scans', popular:true},
    {id:'enterprise', name:'Enterprise', price:599, seats:'Unlimited seats', scans:'Everything + SSO', gold:true},
  ],
};

Object.assign(window, { React, useState, useEffect, useRef, useMemo, I, Logo, ScoreRing, Spark, useCountUp, scoreColor, scoreGrade, cls, MOCK });
