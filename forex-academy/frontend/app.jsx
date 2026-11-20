const { useState, useEffect } = React;
const C = window.CFG;
const api = (a, body, extra = "") => {
  const t = localStorage.getItem("tok") || "";
  const url = `${C.API}?a=${a}&t=${t}${extra}`;
  const opt = body ? { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) } : {};
  return fetch(url, opt).then(r => r.json()).catch(() => ({ error: "Cannot reach server. Check API address in config.js" }));
};
const img = f => C.UPLOADS + f;
const fmt = d => new Date(d.replace(" ", "T")).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function Modal({ onClose, children }) {
  return <div className="modal" onClick={onClose}><div className="card" onClick={e => e.stopPropagation()}>{children}</div></div>;
}

function Auth({ onDone, onClose }) {
  const [mode, setMode] = useState("login"); const [f, setF] = useState({}); const [err, setErr] = useState("");
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const go = async e => {
    e.preventDefault();
    const r = await api(mode, f);
    if (r.error) return setErr(r.error);
    localStorage.setItem("tok", r.token); onDone(r.user);
  };
  return <Modal onClose={onClose}>
    <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
    <form className="f" onSubmit={go} style={{ marginTop: 16 }}>
      {mode === "register" && <input placeholder="Full name" onChange={set("name")} required />}
      <input type="email" placeholder="Email" onChange={set("email")} required />
      <input type="password" placeholder="Password (6+ characters)" onChange={set("password")} required />
      {err && <div className="err">{err}</div>}
      <button className="btn">{mode === "login" ? "Log in" : "Create account"}</button>
    </form>
    <p className="muted small" style={{ marginTop: 14, cursor: "pointer" }} onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
      {mode === "login" ? "New here? Create an account" : "Already registered? Log in"}
    </p>
  </Modal>;
}

function Pay({ kind, item, onClose, user, needLogin }) {
  const [ref, setRef] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  if (!user) { return <Modal onClose={onClose}><h2>Log in first</h2><p className="muted" style={{ margin: "10px 0 16px" }}>Create a free account so we can activate your access.</p><button className="btn" onClick={needLogin}>Log in or sign up</button></Modal>; }
  const send = async e => {
    e.preventDefault();
    const r = await api("pay", { kind, mentorship_id: item?.id, reference: ref });
    r.error ? setErr(r.error) : setMsg("Received! We will verify your payment and activate access, usually within a few hours.");
  };
  return <Modal onClose={onClose}>
    <h2>{kind === "subscription" ? "Unlock Premium" : item.title}</h2>
    <div className="price" style={{ margin: "8px 0" }}>{kind === "subscription" ? C.PRICE + "/month" : item.price}</div>
    <p className="muted small">{C.PAY_INFO}</p>
    {msg ? <p className="ok" style={{ marginTop: 16 }}>{msg}</p> :
      <form className="f" onSubmit={send} style={{ marginTop: 16 }}>
        <input placeholder="Transaction reference / ID" value={ref} onChange={e => setRef(e.target.value)} required />
        {err && <div className="err">{err}</div>}
        <button className="btn gold">I have paid</button>
      </form>}
    {kind === "mentorship" && <a className="btn ghost" style={{ marginTop: 12 }} href={C.CONTACT} target="_blank">Chat with the mentor</a>}
  </Modal>;
}

function Signal({ s, onUnlock }) {
  const [big, setBig] = useState(false);
  return <div className="card">
    <div className="sig-top">
      <span className="pair">{s.pair}</span>
      <span className={"tag " + s.direction.toLowerCase()}>{s.direction}</span>
      <span className="tag">{s.broker}</span>
    </div>
    <div className="levels">
      <div className="lv"><small>Entry</small><b>{s.entry}</b></div>
      <div className={"lv " + (s.locked ? "lock" : "")} onClick={s.locked ? onUnlock : undefined}><small>Take profit</small><b>{s.locked ? "1.23456" : s.tp}</b></div>
      <div className={"lv " + (s.locked ? "lock" : "")} onClick={s.locked ? onUnlock : undefined}><small>Stop loss</small><b>{s.locked ? "1.23456" : s.sl}</b></div>
    </div>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <span className={"tag " + s.status}>{s.status === "active" ? "Running" : s.status === "tp_hit" ? "Take profit hit" : "Stop loss hit"}</span>
      <span className="muted small">{fmt(s.created_at)}</span>
      {s.locked && <button className="btn gold sm" style={{ marginLeft: "auto" }} onClick={onUnlock}>Unlock TP & SL</button>}
    </div>
    {s.note && <p className="muted small" style={{ marginTop: 10 }}>{s.note}</p>}
    {s.image && <img className="shot" src={img(s.image)} alt={s.pair + " chart"} onClick={() => setBig(true)} />}
    {big && <Modal onClose={() => setBig(false)}><img src={img(s.image)} style={{ width: "100%", borderRadius: 12 }} /></Modal>}
  </div>;
}

function Signals({ onUnlock, limit, user }) {
  const [d, setD] = useState(null);
  useEffect(() => { api("signals").then(setD); }, [user]);
  if (!d) return <p className="muted">Loading signals…</p>;
  const list = (d.signals || []).slice(0, limit || 100);
  return <>
    {!d.premium && <div className="banner"><div><h3>Entry is free. TP and SL are Premium.</h3><p className="muted">Get every take-profit and stop-loss level for {C.PRICE} a month.</p></div><button className="btn gold" onClick={onUnlock}>Go Premium</button></div>}
    {list.length ? <div className="grid">{list.map(s => <Signal key={s.id} s={s} onUnlock={onUnlock} />)}</div> : <p className="muted">No signals posted yet. Check back soon.</p>}
  </>;
}

function Results({ limit }) {
  const [r, setR] = useState(null); const [big, setBig] = useState(null);
  useEffect(() => { api("results").then(setR); }, []);
  if (!r) return <p className="muted">Loading results…</p>;
  if (!r.length) return <p className="muted">No results posted yet.</p>;
  return <div className="grid">{r.slice(0, limit || 100).map(x => <div className="card" key={x.id}>
    <div className="sig-top"><span className="pair">{x.pair}</span><span className={"tag " + x.outcome}>{x.outcome === "win" ? "Win" : x.outcome === "loss" ? "Loss" : "Break-even"}</span></div>
    <div className="pips">{x.pips}</div><p className="muted small">{x.title} · {fmt(x.created_at)}</p>
    {x.image && <img className="shot" src={img(x.image)} alt={x.title} onClick={() => setBig(x.image)} />}
  </div>)}{big && <Modal onClose={() => setBig(null)}><img src={img(big)} style={{ width: "100%", borderRadius: 12 }} /></Modal>}</div>;
}

function Library() {
  const [p, setP] = useState(null);
  useEffect(() => { api("pdfs").then(setP); }, []);
  if (!p) return <p className="muted">Loading…</p>;
  if (!p.length) return <p className="muted">PDFs are coming soon.</p>;
  return <div className="grid">{p.map(x => <div className="card" key={x.id}><h3>{x.title}</h3><p className="muted small" style={{ margin: "8px 0 14px" }}>{x.description}</p><a className="btn sm" href={img(x.file)} target="_blank" download>Download PDF</a></div>)}</div>;
}

function Mentorship({ onBuy }) {
  const [m, setM] = useState(null);
  useEffect(() => { api("mentorships").then(setM); }, []);
  if (!m) return <p className="muted">Loading…</p>;
  return <div className="grid">{m.map(x => <div className="card" key={x.id}><span className="tag">{x.duration}</span><h3 style={{ marginTop: 10 }}>{x.title}</h3><p className="muted small" style={{ margin: "8px 0" }}>{x.description}</p><div className="price">{x.price}</div><button className="btn" style={{ marginTop: 12 }} onClick={() => onBuy(x)}>Join mentorship</button></div>)}</div>;
}

function Admin() {
  const [tab, setTab] = useState("signal"); const [msg, setMsg] = useState(""); const [pay, setPay] = useState([]);
  const loadPay = () => api("admin_payments").then(r => Array.isArray(r) && setPay(r));
  useEffect(() => { loadPay(); }, []);
  const submit = action => async e => {
    e.preventDefault(); const form = e.target;
    const r = await api(action, new FormData(form));
    setMsg(r.error || "Saved ✓"); if (!r.error) form.reset();
  };
  const review = async (id, status) => { await api("review_payment", { id, status }); loadPay(); };
  const Sel = ({ name, opts }) => <select name={name}>{opts.map(o => <option key={o}>{o}</option>)}</select>;
  return <section className="wrap">
    <div className="sec-h"><h2>Admin panel</h2></div>
    <div className="tabs">{[["signal", "Post signal"], ["result", "Post result"], ["pdf", "Upload PDF"], ["mentor", "Add mentorship"], ["pay", "Payments"], ["status", "Update signal"]].map(([k, l]) => <button key={k} className={"btn " + (tab === k ? "" : "ghost")} onClick={() => { setTab(k); setMsg(""); }}>{l}</button>)}</div>
    <div className="card" style={{ maxWidth: 640 }}>
      {tab === "signal" && <form className="f" onSubmit={submit("add_signal")}>
        <input name="pair" placeholder="Pair e.g. EURUSD or Volatility 75" required />
        <Sel name="broker" opts={["Deriv", "Weltrade"]} /><Sel name="direction" opts={["BUY", "SELL"]} />
        <input name="entry" placeholder="Entry price" required /><input name="tp" placeholder="Take profit (hidden from free users)" required /><input name="sl" placeholder="Stop loss (hidden from free users)" required />
        <textarea name="note" placeholder="Note (optional)" /><label className="muted small">Chart screenshot</label><input type="file" name="image" accept="image/*" /><button className="btn">Publish signal</button></form>}
      {tab === "result" && <form className="f" onSubmit={submit("add_result")}>
        <input name="title" placeholder="Title e.g. TP hit on Gold" required /><input name="pair" placeholder="Pair" required /><Sel name="outcome" opts={["win", "loss", "breakeven"]} />
        <input name="pips" placeholder="Result e.g. +45 pips or +$120" required /><label className="muted small">Result screenshot</label><input type="file" name="image" accept="image/*" /><button className="btn">Publish result</button></form>}
      {tab === "pdf" && <form className="f" onSubmit={submit("add_pdf")}><input name="title" placeholder="PDF title" required /><textarea name="description" placeholder="Short description" /><input type="file" name="file" accept="application/pdf" required /><button className="btn">Upload PDF</button></form>}
      {tab === "mentor" && <form className="f" onSubmit={submit("add_mentorship")}><input name="title" placeholder="Programme name" required /><textarea name="description" placeholder="What students get" required /><input name="price" placeholder="Price e.g. $149" required /><input name="duration" placeholder="Duration e.g. 6 weeks" required /><button className="btn">Add mentorship</button></form>}
      {tab === "status" && <StatusEditor setMsg={setMsg} />}
      {tab === "pay" && (pay.length ? <table className="tbl"><tbody>{pay.map(p => <tr key={p.id}><td>{p.name}<br /><span className="muted small">{p.email}</span></td><td>{p.kind === "subscription" ? "Premium" : p.mentorship}<br /><span className="muted small">Ref: {p.reference}</span></td><td>{p.status === "pending" ? <><button className="btn sm" onClick={() => review(p.id, "approved")}>Approve</button> <button className="btn ghost sm" onClick={() => review(p.id, "rejected")}>Reject</button></> : <span className={"tag " + p.status}>{p.status}</span>}</td></tr>)}</tbody></table> : <p className="muted">No payments yet.</p>)}
      {msg && <p className={msg.includes("✓") ? "ok" : "err"} style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  </section>;
}

function StatusEditor({ setMsg }) {
  const [d, setD] = useState(null); const load = () => api("signals").then(setD); useEffect(() => { load(); }, []);
  const act = async (fn) => { const r = await fn(); setMsg(r.error || "Saved ✓"); load(); };
  if (!d) return null;
  return <table className="tbl"><tbody>{d.signals.map(s => <tr key={s.id}><td><b>{s.pair}</b> {s.direction}<br /><span className={"tag " + s.status}>{s.status}</span></td>
    <td><button className="btn sm" onClick={() => act(() => api("set_signal_status", { id: s.id, status: "tp_hit" }))}>TP hit</button> <button className="btn ghost sm" onClick={() => act(() => api("set_signal_status", { id: s.id, status: "sl_hit" }))}>SL hit</button> <button className="btn ghost sm" onClick={() => confirm("Delete signal?") && act(() => api("delete", { table: "signals", id: s.id }))}>Delete</button></td></tr>)}</tbody></table>;
}

function Home({ go, onUnlock }) {
  return <>
    <div className="wrap hero">
      <div>
        <h1>Trade with a plan, not a guess.</h1>
        <p>Live Deriv and Weltrade signals, proven results with real screenshots, free PDF guides and 1-on-1 mentorship, all in one academy.</p>
        <div className="row"><button className="btn" onClick={() => go("signals")}>See live signals</button><button className="btn gold" onClick={onUnlock}>Unlock TP & SL, {C.PRICE}</button></div>
        <div className="stats"><div><b>Deriv + Weltrade</b><span className="muted small">supported brokers</span></div><div><b>Free</b><span className="muted small">PDF library</span></div><div><b>{C.PRICE}/mo</b><span className="muted small">full signals</span></div></div>
      </div>
      <div className="vault">
        <div className="sig-top"><span className="pair">XAUUSD</span><span className="tag buy">BUY</span><span className="tag">Weltrade</span></div>
        <div className="levels"><div className="lv"><small>Entry</small><b>2650.40</b></div><div className="lv lock"><small>Take profit</small><b>2662.80</b></div><div className="lv lock"><small>Stop loss</small><b>2644.10</b></div></div>
        <button className="btn gold" style={{ width: "100%" }} onClick={onUnlock}>Unlock the hidden levels</button>
      </div>
    </div>
    <section className="wrap"><div className="sec-h"><h2>Latest signals</h2><button className="btn ghost sm" onClick={() => go("signals")}>View all</button></div><Signals limit={3} onUnlock={onUnlock} /></section>
    <section className="wrap"><div className="sec-h"><h2>Recent results</h2><button className="btn ghost sm" onClick={() => go("results")}>View all</button></div><Results limit={3} /></section>
  </>;
}

function App() {
  const [page, setPage] = useState("home"); const [user, setUser] = useState(null);
  const [modal, setModal] = useState(null);
  useEffect(() => { if (localStorage.getItem("tok")) api("me").then(r => r.user ? setUser(r.user) : localStorage.removeItem("tok")); }, []);
  const go = p => { setPage(p); window.scrollTo(0, 0); };
  const logout = () => { localStorage.removeItem("tok"); setUser(null); go("home"); };
  const pages = [["home", "Home"], ["signals", "Signals"], ["results", "Results"], ["library", "Free PDFs"], ["mentorship", "Mentorship"]];
  if (user?.role === "admin") pages.push(["admin", "Admin"]);
  const unlock = () => setModal({ t: "pay", kind: "subscription" });
  const prem = user && (user.role === "admin" || (user.premium_until && new Date(user.premium_until.replace(" ", "T")) > new Date()));
  const nav = <>{pages.map(([k, l]) => <button key={k} className={page === k ? "on" : ""} onClick={() => go(k)}>{l}</button>)}</>;
  const Head = ({ t, p }) => <div className="sec-h"><div><h2>{t}</h2><p>{p}</p></div></div>;
  return <>
    <nav><div className="wrap">
      <div className="logo" onClick={() => go("home")}><i>◢</i>{C.BRAND}</div>
      <div className="links">{nav}</div>
      {user ? <>{prem ? <span className="tag" style={{ color: "var(--gold)" }}>Premium</span> : <button className="btn gold sm" onClick={unlock}>Go Premium</button>}<button className="btn ghost sm" style={{ marginLeft: 8 }} onClick={logout}>Log out</button></> : <button className="btn sm" onClick={() => setModal({ t: "auth" })}>Log in</button>}
    </div></nav>
    <div className="mob">{nav}</div>
    {page === "home" && <Home go={go} onUnlock={unlock} />}
    {page === "signals" && <section className="wrap"><Head t="Signals" p="Deriv and Weltrade setups with chart screenshots." /><Signals user={user} onUnlock={unlock} /></section>}
    {page === "results" && <section className="wrap"><Head t="Results" p="Every outcome, shown with the real screenshot." /><Results /></section>}
    {page === "library" && <section className="wrap"><Head t="Free PDF library" p="Download and study at your own pace. No payment needed." /><Library /></section>}
    {page === "mentorship" && <section className="wrap"><Head t="Mentorship" p="Learn directly from a trader who reviews your trades." /><Mentorship onBuy={x => setModal({ t: "pay", kind: "mentorship", item: x })} /></section>}
    {page === "admin" && <Admin />}
    <footer><div className="wrap">© {new Date().getFullYear()} {C.BRAND}. Trading carries risk and you can lose money. Signals are education, not financial advice.</div></footer>
    {modal?.t === "auth" && <Auth onClose={() => setModal(null)} onDone={u => { setUser(u); setModal(null); }} />}
    {modal?.t === "pay" && <Pay kind={modal.kind} item={modal.item} user={user} onClose={() => setModal(null)} needLogin={() => setModal({ t: "auth" })} />}
  </>;
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
