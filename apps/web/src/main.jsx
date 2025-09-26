import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

function BootSplash() {
  return (
    <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#fff"}}>
      <div style={{display:"flex",gap:8,alignItems:"center",color:"#334155"}}>
        <div style={{width:16,height:16,borderRadius:"9999px",border:"2px solid #cbd5e1",borderTopColor:"#0f172a",animation:"spin 1s linear infinite"}} />
        <span>Loading…</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

class BootErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { error: null }; }
  static getDerivedStateFromError(e){ return { error: e }; }
  componentDidCatch(e, info){ console.error("BootErrorBoundary:", e, info); }
  render(){
    if (this.state.error) {
      return (
        <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#fff"}}>
          <div style={{maxWidth:720,padding:"1rem"}}>
            <h1 style={{margin:0,fontWeight:600,fontSize:18}}>App crashed during start</h1>
            <pre style={{marginTop:8,fontSize:12,color:"#334155",whiteSpace:"pre-wrap"}}>{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl =
  document.getElementById("root") ||
  (() => { const d = document.createElement("div"); d.id = "root"; document.body.appendChild(d); return d; })();

createRoot(rootEl).render(
  <React.StrictMode>
    <BootErrorBoundary>
      <React.Suspense fallback={<BootSplash />}>
        <App />
      </React.Suspense>
    </BootErrorBoundary>
  </React.StrictMode>
);