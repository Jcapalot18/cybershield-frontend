/* ═══════════ CyberShield Dashboard — app shell ═══════════ */

const NAV = [
  {id:'dashboard', label:'Dashboard', icon:I.grid, section:null},
  {id:'training', label:'AI Training', icon:I.grad, section:'Security tools'},
  {id:'breach', label:'Breach Monitor', icon:I.shield, section:null, tag:'3', tagCls:'red'},
  {id:'scanner', label:'Vulnerability Scanner', icon:I.search, section:null},
  {id:'team', label:'Team', icon:I.users, section:'Account'},
  {id:'billing', label:'Billing', icon:I.card, section:null},
];
const TITLES = {dashboard:['Dashboard','Security operations overview'],training:['AI Training','Live threat-based lessons'],breach:['Breach Monitor','12B+ credential database'],scanner:['Vulnerability Scanner','Real HTTP security checks'],team:['Team','Manage members & training'],billing:['Billing','Subscription & invoices']};

/* ── toasts ── */
function useToasts(){
  const [toasts,setToasts]=useState([]);
  const push=(t,s,kind='green')=>{
    const id=Math.random();
    setToasts(x=>[...x,{id,t,s,kind}]);
    setTimeout(()=>setToasts(x=>x.filter(z=>z.id!==id)),3800);
  };
  return [toasts,push];
}
function Toasts({toasts}){
  const col={green:'var(--green)',red:'var(--red)',yellow:'var(--yellow)',orange:'var(--orange)'};
  const ico={green:I.check,red:I.alert,yellow:I.alert,orange:I.bolt};
  return (
    <div className="toast-wrap">
      {toasts.map(t=>(
        <div className="toast" key={t.id}>
          <div className="toast-ico" style={{background:col[t.kind]+'1a',border:'1px solid '+col[t.kind]+'40',color:col[t.kind]}}>{ico[t.kind]}</div>
          <div><div className="toast-t">{t.t}</div><div className="toast-s">{t.s}</div></div>
        </div>
      ))}
    </div>
  );
}

/* ── upgrade modal ── */
function UpgradeModal({onClose, toast}){
  const m=MOCK;
  const [sel,setSel]=useState('enterprise');
  return (
    <div className="modal-ov" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">Upgrade your plan</div>
        <div className="modal-sub">You're on <b style={{color:'var(--orange)'}}>Business</b>. Unlock more seats, SSO, and white-glove support.</div>
        {m.plans.map(p=>(
          <div key={p.id} className={cls('m-plan', sel===p.id&&'sel', p.gold&&'gold-plan')} onClick={()=>setSel(p.id)}
            style={p.gold&&sel===p.id?{borderColor:'var(--gold-border)',background:'var(--gold-dim)'}:null}>
            <div><div className="m-plan-name" style={p.gold?{color:'var(--gold)'}:null}>{p.name}</div><div className="m-plan-price">${p.price}/mo · {p.seats} · {p.scans}</div></div>
            {p.popular && <span className="badge bm">Current</span>}
            {p.gold && <span className="badge" style={{background:'var(--gold-dim)',color:'var(--gold)',border:'1px solid var(--gold-border)'}}>Best value</span>}
          </div>
        ))}
        <button className={cls('btn','btn-block', sel==='enterprise'?'btn-gold':'btn-primary')} style={{marginTop:'1rem'}}
          onClick={()=>{onClose();toast('Plan updated',"You're now on "+m.plans.find(p=>p.id===sel).name,'green');}}>
          {sel==='business'?'Keep Business':'Switch to '+m.plans.find(p=>p.id===sel).name}
        </button>
        <div style={{marginTop:'.75rem',textAlign:'center',fontSize:'.66rem',color:'var(--dim)'}}>Prorated instantly · Cancel anytime · Secured by Stripe</div>
      </div>
    </div>
  );
}

/* ── app ── */
function App(){
  const m=MOCK;
  const [page,setPage]=useState(()=>{ try{return localStorage.getItem('cs_page')||'dashboard'}catch(e){return 'dashboard'} });
  const [sbOpen,setSbOpen]=useState(false);
  const [upgrade,setUpgrade]=useState(false);
  const [toasts,toast]=useToasts();
  const contentRef=useRef(null);

  const nav=(p)=>{ setPage(p); setSbOpen(false); try{localStorage.setItem('cs_page',p)}catch(e){} if(contentRef.current)contentRef.current.scrollTop=0; };
  const [title,sub]=TITLES[page];

  const Page = {dashboard:DashboardHome, training:TrainingPage, breach:BreachPage, scanner:ScannerPage, team:TeamPage, billing:BillingPage}[page];
  const pageProps = page==='billing' ? {toast, openUpgrade:()=>setUpgrade(true)} : {nav, toast};

  return (
    <div className="app">
      <div className={cls('s-overlay', sbOpen&&'show')} onClick={()=>setSbOpen(false)}></div>
      <aside className={cls('sidebar', sbOpen&&'open')}>
        <div className="s-brand"><a href="CyberShield Landing.html" className="lg"><Logo/><span>Cyber<span className="acc">Shield</span></span></a></div>
        <nav className="s-nav">
          {NAV.map(item=>(
            <React.Fragment key={item.id}>
              {item.section && <div className="s-section">{item.section}</div>}
              <div className={cls('s-item', page===item.id&&'active')} onClick={()=>{ item.id==='billing'? nav('billing'): nav(item.id); }}>
                {item.icon}{item.label}
                {item.tag && <span className={cls('tag',item.tagCls)}>{item.tag}</span>}
              </div>
            </React.Fragment>
          ))}
        </nav>
        <div className="s-footer">
          <div className="s-plan" onClick={()=>setUpgrade(true)}><div className="pn">{m.plan}</div><div className="up">Upgrade →</div></div>
          <div className="s-user">
            <div className="s-av">{m.user.av}</div>
            <div style={{flex:1,minWidth:0}}><div className="s-uname">{m.user.name}</div><div className="s-urole">{m.user.role}</div></div>
            <a href="CyberShield Landing.html" className="s-logout" title="Sign out">{I.logout}</a>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <button className="hamb" onClick={()=>setSbOpen(true)}>{I.menu}</button>
          <div className="tb-title-sub"><div className="tb-title">{title}</div><div className="tb-sub">{sub}</div></div>
          <div className="tb-divider"></div>
          <div className="tb-status"><div className="sdot"></div>All systems operational</div>
          <div className="tb-right">
            <div className="tb-search">{I.search}<input placeholder="Search…"/></div>
            <div className="tb-icon" onClick={()=>toast('Notifications','3 new threat alerts today','orange')}>{I.bell}<div className="badge-dot"></div></div>
            <button className="tb-cta" onClick={()=>nav('scanner')}>{I.play}Run scan</button>
          </div>
        </div>
        <div className="content" ref={contentRef}>
          <Page {...pageProps}/>
        </div>
      </div>

      {upgrade && <UpgradeModal onClose={()=>setUpgrade(false)} toast={toast}/>}
      <Toasts toasts={toasts}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
