import { useState } from "react";
import { supabase } from "../supabase";

const SALT = import.meta.env.VITE_PIN_SALT;

export default function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");

    if (!email.trim() || !email.includes("@")) { setMsg("Palun sisesta kehtiv e-posti aadress"); return; }
    if (!pin.trim() || pin.length < 4) { setMsg("PIN peab olema vähemalt 4 numbrit"); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: `${pin.trim()}${SALT}`,
    });

    if (authError) {
      setLoading(false);
      setMsg(authError.message.includes("Invalid login credentials")
        ? "Vale e-post või PIN. Palun proovi uuesti."
        : authError.message);
      return;
    }

    if (authData?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles").select("disabled, name").eq("id", authData.user.id).single();

      if (profileError) {
        await supabase.auth.signOut(); setLoading(false);
        setMsg("Viga kasutaja andmete laadimisel."); return;
      }
      if (profile?.disabled) {
        await supabase.auth.signOut(); setLoading(false);
        setMsg("Sinu konto on keelatud. Võta ühendust administraatoriga."); return;
      }
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo area */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "16px",
            background: "linear-gradient(135deg, #16a34a, #15803d)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", margin: "0 auto 1rem",
            boxShadow: "0 8px 24px rgba(22,163,74,0.3)"
          }}>🌲</div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text)", marginBottom: "0.25rem" }}>
            Tööpäevik
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Logi sisse oma kontole
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="field">
            <label className="label">E-posti aadress</label>
            <input
              type="email"
              className="input"
              style={{ fontSize: "1rem" }}
              placeholder="nimi@ettevõte.ee"
              value={email}
              onChange={e => { setEmail(e.target.value); setMsg(""); }}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="field" style={{ marginBottom: "1.5rem" }}>
            <label className="label">PIN-kood</label>
            <input
              type="password"
              className="input"
              style={{ fontSize: "1.25rem", letterSpacing: "0.2em" }}
              placeholder="••••"
              inputMode="numeric"
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setMsg(""); }}
              disabled={loading}
              maxLength={6}
              autoComplete="current-password"
            />
          </div>

          {msg && (
            <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {msg}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" style={{ fontSize: "1rem", fontWeight: "700" }} disabled={loading}>
            {loading ? (
              <>
                <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Sisenen...
              </>
            ) : "Sisene"}
          </button>
        </form>
      </div>
    </div>
  );
}