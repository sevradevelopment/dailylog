import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function Today({ session, onLogout }) {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [hours, setHours] = useState(8);
  const [notes, setNotes] = useState("");
  const [blockers, setBlockers] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingSites, setLoadingSites] = useState(true);

  // Laadi sites dropdown
  useEffect(() => {
    async function loadSites() {
      const { data, error } = await supabase
        .from("sites")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error loading sites:", error);
        setMessage(`Viga: ${error.message}`);
      } else {
        setSites(data || []);
        if (data && data.length > 0) {
          setSelectedSiteId(data[0].id);
        }
      }
      setLoadingSites(false);
    }
    loadSites();
  }, []);

  // Saada täna päeviku
  async function handleSave(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!selectedSiteId) {
      setMessage("Palun vali objekt");
      setLoading(false);
      return;
    }

    // Vorminda tänane kuupäev YYYY-MM-DD formaadis
    const today = new Date();
    const workDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const { error } = await supabase
      .from("daily_logs")
      .upsert(
        {
          user_id: session.user.id,
          site_id: selectedSiteId,
          work_date: workDate,
          hours: hours,
          notes: notes.trim() || null,
          blockers: blockers.trim() || null,
        },
        {
          onConflict: "user_id,work_date",
        }
      );

    setLoading(false);

    if (error) {
      setMessage(`Viga: ${error.message}`);
    } else {
      setMessage("Salvestatud ✅");
      // Tühjenda väljad pärast edukat salvestamist (valikuline)
      // setNotes("");
      // setBlockers("");
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <h2>Tänane päevik</h2>
        <button onClick={onLogout} style={{ padding: "8px 16px" }}>
          Logi välja
        </button>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
            Objekt:
          </label>
          {loadingSites ? (
            <p>Laen objekte...</p>
          ) : (
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              style={{ width: "100%", padding: 10, fontSize: 16 }}
              required
            >
              {sites.length === 0 ? (
                <option value="">Objekte ei leitud</option>
              ) : (
                sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
            Tunnid:
          </label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            min="0"
            step="0.5"
            style={{ width: "100%", padding: 10, fontSize: 16 }}
            required
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
            Mida tegin:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 10, fontSize: 16, fontFamily: "inherit" }}
            placeholder="Kirjelda, mida täna tegid..."
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
            Takistused:
          </label>
          <textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: 10, fontSize: 16, fontFamily: "inherit" }}
            placeholder="Kirjelda takistusi või probleeme..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || loadingSites || !selectedSiteId}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            fontWeight: "bold",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Salvestan..." : "Salvesta"}
        </button>

        {message && (
          <p
            style={{
              marginTop: 15,
              padding: 10,
              backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
              color: message.includes("✅") ? "#155724" : "#721c24",
              borderRadius: 4,
            }}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
