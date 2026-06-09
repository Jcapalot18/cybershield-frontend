/* ═══════════ CyberShield Dashboard — pages (home, training) ═══════════ */

/* ─────────── Score history line chart ─────────── */
function ScoreChart({history, industry}){
  const W=620, H=210, padL=34, padR=14, padT=16, padB=28;
  const iw=W-padL-padR, ih=H-padT-padB;
  const months=history.map(h=>h.m);
  const allVals=[...history.map(h=>h.score), ...industry];
  const lo=Math.max(0, Math.floor((Math.min(...allVals)-8)/10)*10);
  const hi=Math.min(100, Math.ceil((Math.max(...allVals)+6)/10)*10);
  const x=i=>padL + (i/(history.length-1))*iw;
  const y=v=>padT + ih - ((v-lo)/(hi-lo))*ih;
  const linePath=arr=>arr.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)).join(' ');
  const cPath=linePath(history.map(h=>h.score));
  const iPath=linePath(industry);
  const areaPath=cPath+` L${x(history.length-1)} ${padT+ih} L${padL} ${padT+ih} Z`;
  const yTicks=[]; for(let v=lo; v<=hi; v+=(hi-lo)/4) yTicks.push(Math.round(v));
  const [tip,setTip]=useState(null);
  const wrapRef=useRef(null);
  const lenRef=useRef(null);
  useEffect(()=>{ if(lenRef.current){ const L=lenRef.current.getTotalLength(); lenRef.current.style.strokeDasharray=L; lenRef.current.style.strokeDashoffset=L; lenRef.current.getBoundingClientRect(); lenRef.current.style.transition='stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)'; lenRef.current.style.strokeDashoffset='0'; } },[]);
  const last=history[history.length-1].score, first=history[0].score;
  return (
    <div className="chart-wrap" ref={wrapRef} style={{position:'relative'}}>
      <div className="chart-legend">
        <div className="chart-leg"><span className="sw" style={{background:'var(--orange)'}}></span>Your score <b>{last}</b></div>
        <div className="chart-leg"><span className="sw" style={{background:'var(--muted)',opacity:.6}}></span>Industry avg <b>{industry[industry.length-1]}</b></div>
        <div className="chart-leg" style={{marginLeft:'auto'}}><span style={{color:'var(--green)',fontWeight:800}}>▲ +{last-first}</span>&nbsp;over 6 months</div>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="areaG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--orange)" stopOpacity="0.22"/><stop offset="1" stopColor="var(--orange)" stopOpacity="0"/></linearGradient>
        </defs>
        {yTicks.map((t,i)=>(
          <g key={i}>
            <line className="chart-grid-line" x1={padL} x2={W-padR} y1={y(t)} y2={y(t)}/>
            <text className="chart-axis-lbl" x={padL-8} y={y(t)+3} textAnchor="end">{t}</text>
          </g>
        ))}
        {months.map((m,i)=>(<text key={m} className="chart-axis-lbl" x={x(i)} y={H-9} textAnchor="middle">{m}</text>))}
        <path d={iPath} fill="none" stroke="var(--muted)" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round"/>
        <path d={areaPath} fill="url(#areaG)"/>
        <path ref={lenRef} d={cPath} fill="none" stroke="var(--orange)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{filter:'drop-shadow(0 2px 8px rgba(255,107,0,0.4))'}}/>
        {history.map((h,i)=>(
          <circle key={i} className="chart-dot" cx={x(i)} cy={y(h.score)} r={tip===i?5.5:3.5} fill="var(--orange)" stroke="var(--bg)" strokeWidth="2"
            onMouseEnter={()=>setTip(i)} onMouseLeave={()=>setTip(null)}/>
        ))}
      </svg>
      {tip!=null && (
        <div className="chart-tip show" style={{left:`${(x(tip)/W)*100}%`, top:`${(y(history[tip].score)/H)*100 + 8}%`}}>
          <b style={{color:'var(--orange)'}}>{history[tip].score}</b> / 100<div style={{color:'var(--muted)',fontSize:'.62rem'}}>{history[tip].m} 2026</div>
        </div>
      )}
    </div>
  );
}

/* ─────────── KPI card ─────────── */
function Kpi({tone,icon,label,value,suffix,foot,trend,trendDir,spark,delay}){
  const v=useCountUp(value,1100);
  const display = Number.isInteger(value) ? Math.round(v) : v.toFixed(0);
  return (
    <div className={cls('kpi','k'+tone)} style={{animationDelay:(delay||0)+'ms'}}>
      <div className="kpi-top">
        <div className="kpi-eyebrow">{icon}{label}</div>
        {trend && <div className={cls('kpi-trend',trendDir)}>{trendDir==='up'?I.arrowUp:trendDir==='down'?I.trendDn:null}{trend}</div>}
      </div>
      <div className={cls('kpi-val','v'+tone)}>{display}{suffix}</div>
      <div className="kpi-foot">{foot}</div>
      {spark && <Spark data={spark} color={tone==='g'?'var(--green)':tone==='o'?'var(--orange)':tone==='r'?'var(--red)':'var(--yellow)'}/>}
    </div>
  );
}

/* ─────────── Risk exposure widget ─────────── */
function RiskWidget({score}){
  let level,color,low,high,desc;
  if(score>=80){level='Low risk';color='var(--green)';low=5000;high=25000;desc='Strong posture. Keep scanning and training to maintain this level.';}
  else if(score>=65){level='Medium risk';color='var(--yellow)';low=25000;high=75000;desc='Several gaps remain. Fixing the recommended items cuts your exposure.';}
  else if(score>=45){level='High risk';color='var(--orange)';low=75000;high=150000;desc='Multiple critical vulnerabilities. Action recommended soon.';}
  else {level='Critical risk';color='var(--red)';low=150000;high=250000;desc='Critical gaps. You are highly vulnerable — act immediately.';}
  return (
    <div className="card hover">
      <div className="card-hd">
        <div className="card-hd-l"><div className="card-ico" style={{background:'var(--red-dim)',border:'1px solid rgba(239,68,68,.2)',color:'var(--red)'}}>{I.alert}</div>
          <div><div className="card-title">Breach exposure</div><div className="card-sub">Based on {score}/100 score</div></div></div>
        <div className="badge" style={{background:color+'1a',color,border:'1px solid '+color+'40'}}>{level}</div>
      </div>
      <div className="card-body">
        <div style={{fontSize:'2rem',fontWeight:900,letterSpacing:'-0.04em',color,fontVariantNumeric:'tabular-nums'}}>${low.toLocaleString()}–${high.toLocaleString()}</div>
        <div style={{fontSize:'.74rem',color:'var(--muted)',lineHeight:1.6,marginTop:'.5rem'}}>{desc}</div>
        <div style={{marginTop:'.875rem',padding:'.75rem .875rem',background:'rgba(255,255,255,.02)',border:'1px solid var(--border2)',borderRadius:9,fontSize:'.72rem',color:'var(--muted)'}}>
          CyberShield costs <b style={{color:'var(--text)'}}>$199/mo</b> — one avoided breach pays for <b style={{color:'var(--orange)'}}>{Math.round(low/199/12)}+ years</b>.
        </div>
      </div>
    </div>
  );
}

/* ─────────── DASHBOARD HOME ─────────── */
function DashboardHome({nav, toast}){
  const m=MOCK;
  const actIco={scan:I.search,training:I.grad,breach:I.shield,team:I.users,report:I.file};
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Security operations</div>
          <div className="page-h1">Good morning, {m.user.name.split(' ')[0]}</div>
          <div className="page-desc">Here's the security posture for {m.company} — last updated 12 minutes ago.</div>
        </div>
        <button className="btn btn-primary" onClick={()=>nav('scanner')}>{I.play}Run new scan</button>
      </div>

      <div className="g4">
        <Kpi tone="g" icon={I.shieldCheck} label="Security score" value={84} foot="Excellent — top 12% of SMBs" trend="+7" trendDir="up" spark={[51,58,63,69,77,84]} delay={0}/>
        <Kpi tone="o" icon={I.grad} label="Trainings done" value={12} foot="of 24 modules · 4 this month" trend="+4" trendDir="up" spark={[2,4,5,8,10,12]} delay={60}/>
        <Kpi tone="r" icon={I.shield} label="Breaches found" value={3} foot="across 24 monitored emails" trend="+1" trendDir="down" spark={[1,1,2,2,2,3]} delay={120}/>
        <Kpi tone="y" icon={I.search} label="Scans this month" value={18} foot="Unlimited on Business plan" trend="+6" trendDir="up" spark={[4,7,9,12,15,18]} delay={180}/>
      </div>

      <div className="g-2-1">
        <div className="card hover">
          <div className="card-hd">
            <div className="card-hd-l"><div className="card-ico" style={{background:'var(--orange-dim)',border:'1px solid var(--orange-border)',color:'var(--orange)'}}>{I.trendUp}</div>
              <div><div className="card-title">Security score history</div><div className="card-sub">Your posture vs. industry average</div></div></div>
            <div className="card-act" onClick={()=>toast('Report exported','May 2026 security report (PDF)')}>{I.download}Export report</div>
          </div>
          <ScoreChart history={m.scoreHistory} industry={m.industryAvg}/>
        </div>

        <div className="card hover">
          <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'var(--green-dim)',border:'1px solid rgba(16,185,129,.2)',color:'var(--green)'}}>{I.shieldCheck}</div>
            <div><div className="card-title">Current score</div><div className="card-sub">Composite of 4 signals</div></div></div></div>
          <div className="score-wrap">
            <ScoreRing score={m.score}/>
            <div className="score-info">
              {m.breakdown.map((b,i)=>(
                <div key={i}>
                  <div className="sbar-top"><span className="sbar-label">{b.label}</span><span className="sbar-pct" style={{color:b.color}}>{b.pct}%</span></div>
                  <div className="sbar-track"><div className="sbar-fill" style={{width:b.pct+'%',background:b.color,transitionDelay:(i*120)+'ms'}}></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="g-1-2">
        <RiskWidget score={m.score}/>
        <div className="card hover">
          <div className="card-hd">
            <div className="card-hd-l"><div className="card-ico" style={{background:'var(--orange-dim)',border:'1px solid var(--orange-border)',color:'var(--orange)'}}>{I.bolt}</div>
              <div><div className="card-title">Live threat intelligence</div><div className="card-sub">From CyberWire Daily · updated today</div></div></div>
            <div className="card-act" onClick={()=>nav('training')}>View all{I.arrowR}</div>
          </div>
          {m.threats.map((t,i)=>(
            <div className="row hover" key={i}>
              <div style={{width:3,height:32,borderRadius:2,background:t.c,flexShrink:0}}></div>
              <div className="row-main"><div className="row-title">{t.t}</div><div className="row-sub">{t.s}</div></div>
              <span className={cls('badge',t.b)}>{t.sev}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="g2">
        <div className="card hover">
          <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'rgba(255,255,255,.04)',border:'1px solid var(--border)',color:'var(--muted)'}}>{I.clock}</div>
            <div><div className="card-title">Recent activity</div><div className="card-sub">Across your organization</div></div></div></div>
          {m.activity.map((a,i)=>(
            <div className="row" key={i}>
              <div className="row-ico" style={{background:a.c+'14',border:'1px solid '+a.c+'33',color:a.c}}>{actIco[a.type]}</div>
              <div className="row-main"><div className="row-title" style={{fontWeight:500,color:'rgba(255,255,255,.78)'}}>{a.t}</div><div className="row-sub">{a.time}</div></div>
            </div>
          ))}
        </div>

        <div className="card hover">
          <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'var(--orange-dim)',border:'1px solid var(--orange-border)',color:'var(--orange)'}}>{I.check}</div>
            <div><div className="card-title">Recommended next steps</div><div className="card-sub">3 actions to raise your score</div></div></div></div>
          <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'.75rem'}}>
            <NextStep color="var(--red)" title="Fix missing HSTS header" sub="Detected on meridianlaw.com · +6 pts" cta="Fix" onClick={()=>nav('scanner')}/>
            <NextStep color="var(--yellow)" title="Strengthen DMARC policy" sub="Currently p=none · +5 pts" cta="Review" onClick={()=>nav('scanner')}/>
            <NextStep color="var(--orange)" title="2 members owe training" sub="Mike & Lena · +4 pts" cta="Remind" onClick={()=>{toast('Reminders sent','Mike & Lena notified by email');}}/>
          </div>
        </div>
      </div>
    </div>
  );
}
function NextStep({color,title,sub,cta,onClick}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:'.875rem',padding:'.8rem .9rem',background:'rgba(255,255,255,.02)',border:'1px solid var(--border2)',borderRadius:10}}>
      <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0,boxShadow:'0 0 8px '+color}}></div>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:'.79rem',fontWeight:600}}>{title}</div><div style={{fontSize:'.66rem',color:'var(--muted)',marginTop:1}}>{sub}</div></div>
      <button className="btn btn-ghost" style={{padding:'7px 14px',fontSize:'.7rem'}} onClick={onClick}>{cta}</button>
    </div>
  );
}

/* ─────────── AI TRAINING ─────────── */
function TrainingPage({toast}){
  const m=MOCK;
  const [mods,setMods]=useState(m.modules);
  const done=mods.filter(x=>x.done).length;
  const avgProg=Math.round(mods.reduce((a,b)=>a+b.prog,0)/mods.length);
  function start(idx){
    setMods(ms=>ms.map((x,i)=> i===idx ? {...x, prog:100, done:true} : x));
    toast('Module completed','Quiz passed · +5 pts to your score');
  }
  return (
    <div className="page">
      <div className="page-head">
        <div><div className="eyebrow">AI security training</div><div className="page-h1">Weekly training</div>
          <div className="page-desc">5-minute lessons generated from live threat intelligence — your team learns this week's attacks.</div></div>
      </div>

      <div className="g3">
        <Kpi tone="o" icon={I.grad} label="Modules completed" value={done} suffix={' / '+mods.length} foot="Across your team" delay={0}/>
        <Kpi tone="g" icon={I.check} label="Avg quiz score" value={92} suffix="/100" foot="Last 30 days" trend="+8" trendDir="up" delay={60}/>
        <Kpi tone="y" icon={I.users} label="Team completion" value={avgProg} suffix="%" foot="8 of 10 members on track" delay={120}/>
      </div>

      <div className="banner orange">
        <div className="banner-ico" style={{background:'var(--orange-dim)',border:'1px solid var(--orange-border)',color:'var(--orange)'}}>{I.bolt}</div>
        <div style={{flex:1}}>
          <div className="banner-t">This week's lesson is ready · Week 24</div>
          <div className="banner-s">"OAuth consent attacks" — generated from 3 incidents reported in CyberWire Daily this week. Takes 6 minutes.</div>
        </div>
        <button className="btn btn-primary" style={{alignSelf:'center'}} onClick={()=>start(1)}>{I.play}Start lesson</button>
      </div>

      <div className="t-grid">
        {mods.map((mod,i)=>(
          <div className="t-mod" key={i}>
            <div className="t-mod-banner" style={{background:mod.grad}}>
              <div className="t-week">{mod.week}</div>
              {mod.done && <div className="t-done-badge">{I.check}</div>}
              <div className="ico">{I.grad}</div>
            </div>
            <div className="t-body">
              <div className="t-title">{mod.title}</div>
              <div className="t-desc">{mod.desc}</div>
              <div className="t-prog"><div className="t-prog-fill" style={{width:mod.prog+'%'}}></div></div>
              <div className="t-meta"><span>{mod.done?'Completed':mod.prog>0?mod.prog+'% complete':'Not started'}</span><span>{mod.mins} min</span></div>
              <button className="btn btn-ghost btn-block" style={{marginTop:'.875rem',padding:'9px',fontSize:'.74rem'}} disabled={mod.done} onClick={()=>start(i)}>
                {mod.done?<>{I.check}Completed</>:mod.prog>0?'Resume lesson':'Start lesson'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ScoreChart, Kpi, RiskWidget, DashboardHome, TrainingPage, NextStep });
