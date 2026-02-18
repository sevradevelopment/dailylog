import { useState } from "react";
import { auth } from "../supabase";

const SALT = import.meta.env.VITE_PIN_SALT;

const ICON_PATHS = {
  tree: <path d="M12 2l2.09 4.26L19 7.27l-4 3.9 1.18 6.88L12 15.77l-4.18 2.28L9 11.17 5 7.27l4.91-.01L12 2z"/>,
};

const Ico = ({ name, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {ICON_PATHS[name]}
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validation
    if (!email.trim() || !email.includes("@")) {
      setMessage("Palun sisesta kehtiv e-posti aadress");
      return;
    }

    if (!pin.trim() || pin.length < 4) {
      setMessage("PIN peab olema vähemalt 4 numbrit");
      return;
    }

    setLoading(true);

    try {
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: authData, error: authError } = await auth.signIn(
        email.trim().toLowerCase(),
        `${pin.trim()}${SALT}`
      );

      if (authError) {
        throw authError;
      }

      // Check if user is disabled
      if (authData?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("disabled, name")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          await auth.signOut();
          throw new Error("Viga kasutaja andmete laadimisel");
        }

        if (profile?.disabled) {
          await auth.signOut();
          throw new Error("Sinu konto on keelatud. Võta ühendust administraatoriga.");
        }
      }

      // Success - App.jsx will handle navigation
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.message.includes("Invalid login credentials")) {
        setMessage("Vale e-post või PIN. Palun proovi uuesti.");
      } else {
        setMessage(error.message || "Sisselogimine ebaõnnestus");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo & Branding */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "18px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              margin: "0 auto 1.25rem",
              boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
            }}
          >
            <Ico name="tree" size={48} />
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "800",
              color: "var(--text)",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Tööpäevik
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "1rem",
              fontWeight: "500",
            }}
          >
            Logi sisse oma kontole
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="field">
            <label className="label">E-posti aadress</label>
            <input
              type="email"
              className="input"
              placeholder="nimi@ettevõte.ee"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setMessage("");
              }}
              disabled={loading}
              autoComplete="email"
              autoFocus
              style={{ fontSize: "1rem" }}
            />
          </div>

          <div className="field" style={{ marginBottom: "2rem" }}>
            <label className="label">PIN-kood</label>
            <input
              type="password"
              className="input"
              placeholder="••••"
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setMessage("");
              }}
              disabled={loading}
              maxLength={6}
              autoComplete="current-password"
              style={{
                fontSize: "1.5rem",
                letterSpacing: "0.25em",
                textAlign: "center",
              }}
            />
          </div>

          {/* Error Message */}
          {message && (
            <div
              className="alert alert-error"
              style={{ marginBottom: "1.5rem" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ fontSize: "1.0625rem", fontWeight: "700" }}
          >
            {loading ? (
              <>
                                <svg
                  className="spin"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Sisenen...
              </>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sisene
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
            Probleemide korral võta ühendust administraatoriga
          </p>
        </div>
      </div>
    </div>
  );
}

