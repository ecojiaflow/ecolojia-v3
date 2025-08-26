// PATH: frontend/src/pages/Auth/LoginPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/authService";

const LoginPage: React.FC = () => {
  const nav = useNavigate();
  const [email,setEmail] = useState(""); const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false); const [error,setError]=useState<string|null>(null);

  async function onSubmit(e: React.FormEvent){
    e.preventDefault(); setLoading(true); setError(null);
    try{ await authService.login({ email, password }); nav("/dashboard"); }
    catch(e:any){ setError(e?.message||"Échec de connexion"); }
    finally{ setLoading(false); }
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--eco-bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div className="eco-card" style={{ width:"100%", maxWidth:460, padding:24 }}>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800 }}>Se connecter</h1>
        <p style={{ marginTop:8, color:"#607069" }}>Ravi de vous revoir 🌱</p>
        <form onSubmit={onSubmit} style={{ marginTop:16 }}>
          <label style={{ display:"block", fontWeight:700, marginBottom:8 }}>Email</label>
          <input className="eco-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com" required />
          <label style={{ display:"block", fontWeight:700, marginTop:16, marginBottom:8 }}>Mot de passe</label>
          <input className="eco-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          {error && <div className="eco-badge" style={{ marginTop:12 }}>{error}</div>}
          <button className="eco-btn eco-btn-primary" style={{ marginTop:16, width:"100%" }} disabled={loading}>
            {loading? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p style={{ marginTop:16, color:"#607069" }}>
          Pas de compte ? <Link to="/register" style={{ color:"#2c6e2f", fontWeight:700 }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
