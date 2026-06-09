/* ═══════════ CyberShield Dashboard — pages 2 (breach, scanner, team, billing) ═══════════ */

/* ─────────── BREACH MONITOR ─────────── */
function BreachPage({toast}){
  const m=MOCK;
  const [emails,setEmails]=useState(m.emails);
  const [val,setVal]=useState('');
  const [checking,setChecking]=useState(false);
  const found=emails.filter(e=>e.status!=='secure').length;
  const totalBreaches=emails.reduce((a,b)=>a+b.breaches,0);

  function check(){
    const e=val.trim().toLowerCase();
    if(!e||!e.includes('@')){toast('Invalid email','Enter a valid email address','red');return;}
    setChecking(true);
    setTimeout(()=>{
      setChecking(false); setVal('');
      const hit=Math.random()>0.55;
      const sample=['LinkedIn (2021)','Dropbox (2016)','Adobe (2013)','Canva (2019)','Twitter (2022)'];
      const n=hit?1+Math.floor(Math.random()*2):0;
      const det=[]; for(let i=0;i<n;i++)det.push(sample[Math.floor(Math.random()*sample.length)]);
      const status=n===0?'secure':n>=2?'breached':'warn';
      setEmails(es=>[{email:e,status,breaches:n,detail:det,isNew:true},...es.filter(x=>x.email!==e)]);
      toast(n?'Breaches found':'Email is secure', n?`${n} breach${n>1?'es':''} detected for ${e}`:`No breaches found for ${e}`, n?'red':'green');
    },1600);
  }
  const sc={secure:'var(--green)',warn:'var(--yellow)',breached:'var(--red)'};
  const sl={secure:'Secure',warn:'1 breach',breached:'Breached'};
  return (
    <div className="page">
      <div className="page-head"><div><div className="eyebrow">Breach monitor</div><div className="page-h1">Breach monitoring</div>
        <div className="page-desc">Continuously checked against 12B+ compromised credentials from 800+ known breaches.</div></div></div>

      <div className="g4">
        <Kpi tone="o" icon={I.mail} label="Emails monitored" value={emails.length} foot="Auto-checked every 24h" delay={0}/>
        <Kpi tone="r" icon={I.alert} label="Affected accounts" value={found} foot="Need password rotation" delay={60}/>
        <Kpi tone="y" icon={I.shield} label="Total breaches" value={totalBreaches} foot="Across all monitored emails" delay={120}/>
        <Kpi tone="g" icon={I.check} label="Database size" value={12} suffix="B+" foot="Compromised credentials" delay={180}/>
      </div>

      <div className="g-2-1">
        <div className="card hover">
          <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'var(--red-dim)',border:'1px solid rgba(239,68,68,.2)',color:'var(--red)'}}>{I.search}</div>
            <div><div className="card-title">Monitored email addresses</div><div className="card-sub">{emails.length} addresses · {found} affected</div></div></div></div>
          {emails.map((e,i)=>(
            <div className="row" key={e.email} style={e.isNew?{animation:'cardIn .4s var(--spring) both'}:null}>
              <div className="row-dot" style={{background:sc[e.status],boxShadow:'0 0 8px '+sc[e.status]}}></div>
              <div className="row-main">
                <div className="row-title">{e.email}</div>
                {e.detail&&e.detail.length>0 ? <div className="row-sub" style={{color:'var(--red)'}}>Found in: {e.detail.join(', ')}</div> : <div className="row-sub">No exposures found</div>}
              </div>
              <span className={cls('badge', e.status==='secure'?'bg':e.status==='warn'?'bh':'bc')}>{e.status==='secure'?'Secure':e.breaches+' breach'+(e.breaches>1?'es':'')}</span>
            </div>
          ))}
        </div>

        <div className="card hover" style={{position:'sticky',top:0}}>
          <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'var(--orange-dim)',border:'1px solid var(--orange-border)',color:'var(--orange)'}}>{I.mail}</div>
            <div><div className="card-title">Check an email</div><div className="card-sub">Instant lookup</div></div></div></div>
          <div className="card-body">
            <div className="f-group"><label className="f-label">Email address</label>
              <input className="f-input" type="email" placeholder="employee@company.com" value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()}/></div>
            <button className="btn btn-primary btn-block" onClick={check} disabled={checking}>
              {checking? <><span style={{width:14,height:14,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}></span>Checking 12B+ records…</> : <>{I.search}Check for breaches</>}
            </button>
            <div style={{marginTop:'1rem',padding:'.875rem',background:'rgba(255,255,255,.02)',border:'1px solid var(--border2)',borderRadius:9,fontSize:'.72rem',color:'var(--muted)',lineHeight:1.6}}>
              We check against <b style={{color:'var(--text)'}}>HaveIBeenPwned</b>'s database. Found something? Rotate that password and enable 2FA immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── VULNERABILITY SCANNER ─────────── */
function ScannerPage({toast}){
  const m=MOCK;
  const steps=['SSL Certificate','Security Headers','DNS Configuration','Cookie Security'];
  const [url,setUrl]=useState('');
  const [phase,setPhase]=useState('idle'); // idle | scanning | done
  const [active,setActive]=useState(-1);
  const [results,setResults]=useState(null);
  const [scanUrl,setScanUrl]=useState('');
  const timers=useRef([]);

  function run(){
    let u=url.trim(); if(!u){toast('Enter a URL','e.g. https://yourcompany.com','red');return;}
    if(!/^https?:\/\//.test(u)) u='https://'+u;
    setScanUrl(u.replace(/^https?:\/\//,'').replace(/\/$/,''));
    setPhase('scanning'); setActive(0); setResults(null);
    timers.current.forEach(clearTimeout); timers.current=[];
    steps.forEach((_,i)=>{ timers.current.push(setTimeout(()=>setActive(i+1), (i+1)*750)); });
    timers.current.push(setTimeout(()=>{ setPhase('done'); setResults(m.scanResults); toast('Scan complete','6 passed · 1 failed · 1 warning'); }, steps.length*750+400));
  }
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
  const pass=results?results.filter(r=>r.st==='pass').length:0;
  const fail=results?results.filter(r=>r.st==='fail').length:0;
  const warn=results?results.filter(r=>r.st==='warn').length:0;
  const stIco={pass:I.check,fail:I.x,warn:I.alert};

  return (
    <div className="page">
      <div className="page-head"><div><div className="eyebrow">Vulnerability scanner</div><div className="page-h1">Vulnerability scanner</div>
        <div className="page-desc">Real HTTP checks for SSL, security headers, DNS, and cookies — 100% accurate, with plain-English fixes.</div></div></div>

      <div className="g4">
        <Kpi tone="o" icon={I.search} label="Scans this month" value={18} foot="Unlimited on Business" delay={0}/>
        <Kpi tone="r" icon={I.alert} label="Open issues" value={fail+warn} foot={results?'On last scan':'Run a scan to see'} delay={60}/>
        <Kpi tone="g" icon={I.check} label="Checks passed" value={pass} suffix={results?' / 8':''} foot={results?'On last scan':'8 checks per scan'} delay={120}/>
        <Kpi tone="y" icon={I.shieldCheck} label="Accuracy" value={100} suffix="%" foot="Real HTTP, not simulated" delay={180}/>
      </div>

      <div className="g-1-2">
        <div className="card hover" style={{alignSelf:'start'}}>
          <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'var(--orange-dim)',border:'1px solid var(--orange-border)',color:'var(--orange)'}}>{I.shieldCheck}</div>
            <div><div className="card-title">New scan</div><div className="card-sub">Real HTTP · ~30s</div></div></div></div>
          <div className="card-body">
            <div className="f-group"><label className="f-label">Target URL</label>
              <input className="f-input" type="text" placeholder="https://yourcompany.com" value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&phase!=='scanning'&&run()}/></div>
            <button className="btn btn-primary btn-block" onClick={run} disabled={phase==='scanning'}>
              {phase==='scanning'? <><span style={{width:14,height:14,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}></span>Scanning…</> : <>{I.play}Run vulnerability scan</>}
            </button>
          </div>
          {phase!=='idle' && (
            <>
              <div className="prog-bar"><div className="prog-fill" style={{width:(phase==='done'?100:(active/steps.length)*100)+'%'}}></div></div>
              <div className="scan-steps">
                {steps.map((s,i)=>(
                  <div key={i} className={cls('step', phase==='done'||active>i?'done':active===i?'active':'')}>
                    <div className="step-ico">{phase==='done'||active>i?'✓':i+1}</div>{s}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card hover">
          <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'var(--orange-dim)',border:'1px solid var(--orange-border)',color:'var(--orange)'}}>{I.file}</div>
            <div><div className="card-title">Scan results</div><div className="card-sub">{scanUrl||'No scan yet'}</div></div></div>
            {results && <div className="card-act" onClick={()=>toast('Report exported','Vulnerability report (PDF)')}>{I.download}PDF</div>}
          </div>
          {!results && phase!=='scanning' && (
            <div className="empty"><div className="empty-ico">{I.shieldCheck}</div><div className="empty-txt">Enter a URL and run a scan to see your full vulnerability report with prioritized fixes.</div></div>
          )}
          {phase==='scanning' && !results && (
            <div className="empty"><div className="empty-ico" style={{animation:'pulse 1.5s infinite'}}>{I.search}</div><div className="empty-txt">Running real HTTP checks against {scanUrl}…</div></div>
          )}
          {results && (
            <>
              <div className="scan-sum">
                <div className="scan-sum-cell"><div className="scan-sum-val" style={{color:'var(--green)'}}>{pass}</div><div className="scan-sum-lbl">Passed</div></div>
                <div className="scan-sum-cell"><div className="scan-sum-val" style={{color:'var(--red)'}}>{fail}</div><div className="scan-sum-lbl">Failed</div></div>
                <div className="scan-sum-cell"><div className="scan-sum-val" style={{color:'var(--yellow)'}}>{warn}</div><div className="scan-sum-lbl">Warnings</div></div>
              </div>
              <div style={{padding:'1rem 1.25rem',display:'flex',flexDirection:'column',gap:'.5rem'}}>
                {results.map((r,i)=>(
                  <div className="result-row" key={i}>
                    <div><div className="result-k">{r.k}</div><div className="result-d">{r.d}</div></div>
                    <div className={cls('result-v',r.st)}>{stIco[r.st]}{r.v}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card hover">
        <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'rgba(255,255,255,.04)',border:'1px solid var(--border)',color:'var(--muted)'}}>{I.check}</div>
          <div><div className="card-title">What we check</div><div className="card-sub">8 security checks per scan</div></div></div></div>
        <div className="checks-grid">
          {m.scanChecks.map((c,i)=>(<div className="check-chip" key={i}>{I.check}{c}</div>))}
        </div>
      </div>
    </div>
  );
}

/* ─────────── TEAM ─────────── */
function TeamPage({toast}){
  const m=MOCK;
  const [team,setTeam]=useState(m.team);
  const [name,setName]=useState(''); const [email,setEmail]=useState('');
  const active=team.filter(t=>t.status==='active').length;
  function invite(){
    if(!name.trim()||!email.trim()||!email.includes('@')){toast('Missing info','Enter a name and valid email','red');return;}
    if(team.length>=m.seats){toast('No seats left','Upgrade to add more members','red');return;}
    const av=name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
    setTeam(t=>[...t,{name:name.trim(),email:email.trim(),role:'Member',status:'pending',training:0,last:'Invited',av,isNew:true}]);
    toast('Invite sent',`${name.trim()} was invited to the team`);
    setName('');setEmail('');
  }
  const roleCol={Owner:'var(--orange)',Admin:'var(--cyan)',Member:'var(--muted)'};
  return (
    <div className="page">
      <div className="page-head"><div><div className="eyebrow">Team management</div><div className="page-h1">Your team</div>
        <div className="page-desc">Track training, manage seats, and see who's protected across {m.company}.</div></div></div>

      <div className="g3">
        <Kpi tone="o" icon={I.users} label="Team members" value={team.length} suffix={' / '+m.seats} foot="Seats in use" delay={0}/>
        <Kpi tone="g" icon={I.check} label="Active members" value={active} foot="Signed in this week" delay={60}/>
        <Kpi tone="y" icon={I.grad} label="Avg training" value={Math.round(team.reduce((a,b)=>a+b.training,0)/team.length)} suffix="%" foot="Completion across team" delay={120}/>
      </div>

      <div className="card hover">
        <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'var(--orange-dim)',border:'1px solid var(--orange-border)',color:'var(--orange)'}}>{I.users}</div>
          <div><div className="card-title">Members</div><div className="card-sub">{team.length} of {m.seats} seats used</div></div></div>
          <div style={{display:'flex',alignItems:'center',gap:10,minWidth:160}}>
            <div className="bar-mini" style={{width:90}}><i style={{width:(team.length/m.seats*100)+'%',background:'var(--orange)'}}></i></div>
            <span style={{fontSize:'.68rem',color:'var(--muted)',fontWeight:700}}>{m.seats-team.length} left</span>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="tbl">
            <thead><tr><th>Member</th><th>Role</th><th>Training</th><th>Status</th><th>Last active</th></tr></thead>
            <tbody>
              {team.map((t,i)=>(
                <tr key={t.email} style={t.isNew?{animation:'cardIn .4s var(--spring) both'}:null}>
                  <td><div className="cell-user"><div className="t-av">{t.av}</div><div><div style={{fontWeight:600}}>{t.name}</div><div style={{fontSize:'.66rem',color:'var(--muted)'}}>{t.email}</div></div></div></td>
                  <td><span style={{color:roleCol[t.role],fontWeight:700,fontSize:'.72rem'}}>{t.role}</span></td>
                  <td><div className="bar-mini"><i style={{width:t.training+'%',background:t.training>=80?'var(--green)':t.training>=40?'var(--yellow)':'var(--red)'}}></i></div><span style={{fontSize:'.72rem',fontWeight:700}}>{t.training}%</span></td>
                  <td><span className={cls('chip',t.status==='active'?'on':'pend')}>{t.status}</span></td>
                  <td style={{color:'var(--muted)',fontSize:'.72rem'}}>{t.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{padding:'1rem 1.25rem',borderTop:'1px solid var(--border)',display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:'.75rem',alignItems:'end',background:'rgba(255,255,255,.01)'}}>
          <div className="f-group" style={{margin:0}}><label className="f-label">Full name</label><input className="f-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Smith"/></div>
          <div className="f-group" style={{margin:0}}><label className="f-label">Email</label><input className="f-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="jane@company.com" onKeyDown={e=>e.key==='Enter'&&invite()}/></div>
          <button className="btn btn-primary" onClick={invite}>{I.plus}Add member</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── BILLING ─────────── */
function BillingPage({toast, openUpgrade}){
  const m=MOCK;
  return (
    <div className="page">
      <div className="page-head"><div><div className="eyebrow">Billing & plans</div><div className="page-h1">Billing</div>
        <div className="page-desc">Manage your subscription, usage, and invoices.</div></div>
        <button className="btn btn-ghost" onClick={()=>toast('Opening portal','Redirecting to secure billing portal…')}>{I.lock}Manage in portal</button>
      </div>

      <div className="g-2-1">
        <div className="card hover">
          <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'var(--orange-dim)',border:'1px solid var(--orange-border)',color:'var(--orange)'}}>{I.card}</div>
            <div><div className="card-title">Current plan</div><div className="card-sub">Renews June 1, 2026</div></div></div>
            <div className="badge bm">Business</div></div>
          <div className="card-body">
            <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:'1.25rem',whiteSpace:'nowrap'}}>
              <span style={{fontSize:'2.6rem',fontWeight:900,letterSpacing:'-0.05em'}}>$199</span><span style={{color:'var(--muted)'}}>/month</span>
            </div>
            <Usage label="Team seats" used={6} total={50} unit="seats" color="var(--orange)"/>
            <Usage label="Vulnerability scans" used={18} total={'∞'} unit="scans this month" color="var(--green)"/>
            <Usage label="Emails monitored" used={24} total={'∞'} unit="addresses" color="var(--cyan)"/>
            <div style={{display:'flex',gap:'.75rem',marginTop:'1.25rem'}}>
              <button className="btn btn-gold" style={{flex:1}} onClick={openUpgrade}>{I.arrowUp}Upgrade to Enterprise</button>
              <button className="btn btn-ghost" onClick={()=>toast('Plan downgrade','Contact support to change plan','yellow')}>Change</button>
            </div>
          </div>
        </div>

        <div className="card hover">
          <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'rgba(6,182,212,.08)',border:'1px solid rgba(6,182,212,.2)',color:'var(--cyan)'}}>{I.card}</div>
            <div><div className="card-title">Payment method</div><div className="card-sub">Default card</div></div></div></div>
          <div className="card-body">
            <div style={{display:'flex',alignItems:'center',gap:'.875rem',padding:'1rem',background:'rgba(255,255,255,.02)',border:'1px solid var(--border2)',borderRadius:11,marginBottom:'1rem'}}>
              <div style={{width:42,height:30,borderRadius:6,background:'linear-gradient(120deg,#FF6B00,#7a1d00)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.55rem',fontWeight:900,color:'#fff'}}>VISA</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:'.82rem'}}>•••• •••• •••• 4242</div><div style={{fontSize:'.66rem',color:'var(--muted)'}}>Expires 08 / 2028</div></div>
              <span className="chip on">Default</span>
            </div>
            <button className="btn btn-ghost btn-block" onClick={()=>toast('Update card','Opening secure card form…')}>{I.lock}Update payment method</button>
            <div style={{marginTop:'1rem',fontSize:'.7rem',color:'var(--muted)',lineHeight:1.6,textAlign:'center'}}>Payments secured by Stripe · PCI DSS compliant · Cancel anytime</div>
          </div>
        </div>
      </div>

      <div className="card hover">
        <div className="card-hd"><div className="card-hd-l"><div className="card-ico" style={{background:'rgba(255,255,255,.04)',border:'1px solid var(--border)',color:'var(--muted)'}}>{I.file}</div>
          <div><div className="card-title">Invoices</div><div className="card-sub">Billing history</div></div></div>
          <div className="card-act" onClick={()=>toast('Downloading','All invoices (ZIP)')}>{I.download}Download all</div></div>
        <div style={{overflowX:'auto'}}>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {m.invoices.map((inv,i)=>(
                <tr key={i}>
                  <td style={{fontWeight:600}}>{inv.date}</td>
                  <td style={{color:'var(--muted)'}}>{inv.plan}</td>
                  <td style={{fontWeight:700}}>{inv.amt}</td>
                  <td><span className="chip on">{inv.status}</span></td>
                  <td style={{textAlign:'right'}}><span className="card-act" style={{justifyContent:'flex-end'}} onClick={()=>toast('Invoice','Downloading '+inv.date+' (PDF)')}>{I.download}PDF</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function Usage({label,used,total,unit,color}){
  const pct = total==='∞' ? Math.min(used/40*100,72) : (used/total*100);
  return (
    <div style={{marginBottom:'1rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:2}}>
        <span style={{fontSize:'.74rem',color:'var(--muted)',fontWeight:500}}>{label}</span>
        <span style={{fontSize:'.74rem',fontWeight:700}}><span style={{color}}>{used}</span> / {total} <span style={{color:'var(--muted)',fontWeight:400,fontSize:'.66rem'}}>{unit}</span></span>
      </div>
      <div className="meter"><i style={{width:pct+'%',background:color}}></i></div>
    </div>
  );
}

Object.assign(window, { BreachPage, ScannerPage, TeamPage, BillingPage, Usage });
