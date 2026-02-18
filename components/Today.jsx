import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const WOOD_TYPES = ["Mänd", "Kuusk", "Kask", "Haab", "Pappel", "Muu"];
const WORK_TYPES = ["Raie", "Transport", "Sorteerimine", "Hakkamine", "Laadimine", "Muu"];
const MACHINES = ["Harvester", "Forwarder", "Hakkur", "Traktor", "Veoauto", "Muu"];
const ADMIN_WORK_TYPES = ["Hakkepuiduvedamine", "Hakkepuidutootmine"];
const VEHICLE_PLATES = ["508HVY", "806VDM", "176MRM", "102GBS", "324MTC", "838VZW", "251GTR", "304RVW", "133LHL"];

const Ico = ({ path, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {path}
  </svg>
);

function SectionHeader({ icon, title }) {
  return (
    <div className="card-section-title">
      {icon}
      {title}
    </div>
  );
}

export default function Today({ session, userRole, onLogout }) {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [hours, setHours] = useState("");
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [endTime, setEndTime] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [cargoAmount, setCargoAmount] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [userName, setUserName] = useState("");
  const [locations, setLocations] = useState([]);
  const [adminWorkType, setAdminWorkType] = useState("");
  const [woodType, setWoodType] = useState("");
  const [woodAmount, setWoodAmount] = useState("");
  const [workType, setWorkType] = useState("");
  const [machines, setMachines] = useState([]);
  const [problems, setProblems] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loadingSites, setLoadingSites] = useState(true);
  const [savedToday, setSavedToday] = useState(false);

  const isDriver = userRole === "vedaja";
  const isHakker = userRole === "hakkur";
  const isAdmin = userRole === "admin";

  function getGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Tere hommikust";
    if (h >= 12 && h < 18) return "Tere päevast";
    return "Tere õhtust";
  }

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  useEffect(() => {
    async function loadUserName() {
      const { data } = await supabase.from("profiles").select("name").eq("id", session.user.id).single();
      setUserName(data?.name || session.user.email?.split("@")[0] || "Kasutaja");
    }
    loadUserName();
  }, [session]);

  useEffect(() => {
    async function loadLocations() {
      if (isDriver || isAdmin) {
        const { data } = await supabase.from("locations").select("name").order("name");
        setLocations(data?.map(l => l.name) || []);
      }
    }
    loadLocations();
  }, [isDriver, isAdmin]);

  useEffect(() => {
    async function loadSites() {
      if (isDriver || isAdmin) { setLoadingSites(false); return; }
      const { data, error } = await supabase.from("sites").select("id, name").order("name");
      if (!error) {
        setSites(data || []);
        if (data?.length > 0) setSelectedSiteId(data[0].id);
      }
      setLoadingSites(false);
    }
    loadSites();
  }, [isDriver, isAdmin]);

  useEffect(() => {
    async function loadExistingLog() {
      if ((isDriver || isAdmin) && locations.length === 0) return;
      const { data } = await supabase.from("daily_logs").select("*").eq("user_id", session.user.id).eq("work_date", todayStr).single();
      if (data) {
        setSavedToday(true);
        if (!isDriver && !isAdmin) setSelectedSiteId(data.site_id || "");
        setHours(data.hours || "");
        setBreakStart(data.break_start && data.break_start.trim() ? data.break_start : "");
        setBreakEnd(data.break_end && data.break_end.trim() ? data.break_end : "");
        if (isDriver) {
          setStartLocation(data.start_location || "");
          setStartTime(data.start_time || "");
          setEndLocation(data.end_location || "");
          setEndTime(data.end_time || "");
          setCargoType(data.cargo_type || "");
          setCargoAmount(data.cargo_amount || "");
          setVehiclePlate(data.vehicle_plate || "");
        }
        if (isHakker) {
          setWoodType(data.wood_type || "");
          setWoodAmount(data.wood_amount || "");
          setWorkType(data.work_type || "");
          setMachines(data.machines ? data.machines.split(",") : []);
          setProblems(data.problems || "");
        }
        if (isAdmin) {
          setAdminWorkType(data.admin_work_type || "");
          if (data.admin_work_type === "Hakkepuiduvedamine") {
            setStartLocation(data.start_location || "");
            setStartTime(data.start_time || "");
            setEndLocation(data.end_location || "");
            setEndTime(data.end_time || "");
            setCargoType(data.cargo_type || "");
            setCargoAmount(data.cargo_amount || "");
            setVehiclePlate(data.vehicle_plate || "");
          }
          if (data.admin_work_type === "Hakkepuidutootmine") {
            setWoodType(data.wood_type || "");
            setWoodAmount(data.wood_amount || "");
            setProblems(data.problems || "");
          }
        }
      }
    }
    if (session) loadExistingLog();
  }, [session, isDriver, isHakker, isAdmin, locations]);

  function toggleMachine(m) {
    setMachines(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!isDriver && !isAdmin && !selectedSiteId) {
      setMessage("Palun vali objekt"); setMessageType("error"); setLoading(false); return;
    }
    if (isAdmin && !adminWorkType) {
      setMessage("Palun vali töö tüüp"); setMessageType("error"); setLoading(false); return;
    }

    const payload = {
      user_id: session.user.id,
      site_id: (isDriver || isAdmin) ? null : selectedSiteId,
      work_date: todayStr,
      hours: hours ? Number(hours) : null,
      break_start: (breakStart.trim() && breakEnd.trim()) ? breakStart.trim() : null,
      break_end: (breakStart.trim() && breakEnd.trim()) ? breakEnd.trim() : null,
    };

    if (isDriver) {
      Object.assign(payload, {
        start_location: startLocation.trim() || null,
        start_time: startTime.trim() || null,
        end_location: endLocation.trim() || null,
        end_time: endTime.trim() || null,
        cargo_type: cargoType.trim() || null,
        cargo_amount: cargoAmount ? Number(cargoAmount) : null,
        vehicle_plate: vehiclePlate || null,
      });
    }
    if (isHakker) {
      Object.assign(payload, {
        wood_type: woodType || null,
        wood_amount: woodAmount ? Number(woodAmount) : null,
        work_type: workType || null,
        machines: machines.length > 0 ? machines.join(",") : null,
        problems: problems.trim() || null,
      });
    }
    if (isAdmin) {
      payload.admin_work_type = adminWorkType || null;
      if (adminWorkType === "Hakkepuiduvedamine") {
        Object.assign(payload, {
          start_location: startLocation.trim() || null, start_time: startTime.trim() || null,
          end_location: endLocation.trim() || null, end_time: endTime.trim() || null,
          cargo_type: cargoType.trim() || null, cargo_amount: cargoAmount ? Number(cargoAmount) : null,
          vehicle_plate: vehiclePlate || null,
        });
      }
      if (adminWorkType === "Hakkepuidutootmine") {
        Object.assign(payload, {
          wood_type: woodType || null, wood_amount: woodAmount ? Number(woodAmount) : null,
          problems: problems.trim() || null,
        });
      }
    }

    const { error } = await supabase.from("daily_logs").upsert(payload, { onConflict: "user_id,work_date" });
    setLoading(false);

    if (error) {
      setMessage(`Viga: ${error.message}`); setMessageType("error");
    } else {
      setMessage("Päevik salvestatud!"); setMessageType("success");
      setSavedToday(true);
      setTimeout(() => setMessage(""), 4000);
    }
  }

  const dateLabel = new Date().toLocaleDateString("et-EE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.25rem", textTransform: "capitalize" }}>{dateLabel}</p>
            <h1>{getGreeting()}, {userName}!</h1>
          </div>
          {savedToday && (
            <span className="badge badge-green" style={{ marginTop: "0.5rem" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Täna salvestatud
            </span>
          )}
        </div>
      </div>

      {message && (
        <div className={`alert ${messageType === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1.25rem" }}>
          {messageType === "success" ? "✓" : "!"} {message}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="card">
          {/* Admin: töö tüübi valik */}
          {isAdmin && (
            <div className="card-section">
              <SectionHeader title="Töö tüüp" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>} />
              <div className="chips">
                {ADMIN_WORK_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${adminWorkType === t ? "selected" : ""}`}
                    onClick={() => {
                      setAdminWorkType(t);
                      setWoodType(""); setWoodAmount(""); setWorkType(""); setMachines([]); setProblems("");
                      setStartLocation(""); setStartTime(""); setEndLocation(""); setEndTime(""); setCargoType(""); setCargoAmount(""); setVehiclePlate("");
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Objekt (töötajale) */}
          {!isDriver && !isAdmin && (
            <div className="card-section">
              <SectionHeader title="Objekt" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>} />
              {loadingSites ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Laen objekte...</p>
              ) : (
                <div className="field">
                  <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} className="input" required>
                    {sites.length === 0 ? <option value="">Objekte pole</option> : sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Aeg */}
          <div className="card-section">
            <SectionHeader title="Tööaeg" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
            <div className="field">
              <label className="label">Töötunnid</label>
              <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0" max="24" step="0.5" className="input" placeholder="0" required />
            </div>
            <div className="grid-2">
              <div className="field">
                <label className="label">Puhkepaus algus</label>
                <input type="time" value={breakStart} onChange={e => setBreakStart(e.target.value)} className="input" />
              </div>
              <div className="field">
                <label className="label">Puhkepaus lõpp</label>
                <input type="time" value={breakEnd} onChange={e => setBreakEnd(e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {/* Vedaja väljad */}
          {(isDriver || (isAdmin && adminWorkType === "Hakkepuiduvedamine")) && (
            <div className="card-section">
              <SectionHeader title="Transport" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>} />

              <div className="field">
                <label className="label">Auto numbrimärk</label>
                <div className="chips" style={{ marginBottom: "0.75rem" }}>
                  {VEHICLE_PLATES.map(p => (
                    <button key={p} type="button" className={`chip ${vehiclePlate === p ? "selected" : ""}`}
                      onClick={() => setVehiclePlate(vehiclePlate === p ? "" : p)}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label className="label">Alguspunkt</label>
                  <select value={startLocation} onChange={e => setStartLocation(e.target.value)} className="input">
                    <option value="">— vali —</option>
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Lahkumisaeg</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input" />
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label className="label">Sihtkoht</label>
                  <select value={endLocation} onChange={e => setEndLocation(e.target.value)} className="input">
                    <option value="">— vali —</option>
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Saabumisaeg</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input" />
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label className="label">Mida vedas</label>
                  <input type="text" value={cargoType} onChange={e => setCargoType(e.target.value)} className="input" placeholder="Hakkepuit, jne." />
                </div>
                <div className="field">
                  <label className="label">Kogus (m³)</label>
                  <input type="number" value={cargoAmount} onChange={e => setCargoAmount(e.target.value)} className="input" step="0.1" placeholder="0.0" />
                </div>
              </div>
            </div>
          )}

          {/* Hakkuri väljad */}
          {(isHakker || (isAdmin && adminWorkType === "Hakkepuidutootmine")) && (
            <div className="card-section">
              <SectionHeader title="Hakkepuidu tootmine" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 8C8 10 5.9 16.17 3.82 19.85A2 2 0 0 0 5.54 22a2 2 0 0 0 1.85-1.25C9 17 12 14 17 14" /><path d="M17 8l2 2 4-5" /><path d="M4 15.54a10 10 0 0 0 7.47 3.4" /></svg>} />

              <div className="field">
                <label className="label">Puutüüp</label>
                <div className="chips">
                  {WOOD_TYPES.map(t => (
                    <button key={t} type="button" className={`chip ${woodType === t ? "selected" : ""}`} onClick={() => setWoodType(woodType === t ? "" : t)}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="label">Kogus (m³)</label>
                <input type="number" value={woodAmount} onChange={e => setWoodAmount(e.target.value)} className="input" step="0.1" placeholder="0.0" />
              </div>

              {isHakker && (
                <>
                  <div className="field">
                    <label className="label">Töö tüüp</label>
                    <div className="chips">
                      {WORK_TYPES.map(t => (
                        <button key={t} type="button" className={`chip ${workType === t ? "selected" : ""}`} onClick={() => setWorkType(workType === t ? "" : t)}>{t}</button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Masinad</label>
                    <div className="chips">
                      {MACHINES.map(m => (
                        <button key={m} type="button" className={`chip ${machines.includes(m) ? "selected" : ""}`} onClick={() => toggleMachine(m)}>{m}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="field">
                <label className="label">Probleemid / Takistused</label>
                <textarea value={problems} onChange={e => setProblems(e.target.value)} className="input" placeholder="Kirjelda probleeme..." />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || loadingSites || (!isDriver && !isAdmin && !selectedSiteId) || (isAdmin && !adminWorkType)}
            className="btn btn-primary btn-full"
            style={{ marginTop: "0.5rem", fontSize: "1rem" }}
          >
            {loading ? (
              <>
                <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Salvestan...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                {savedToday ? "Uuenda päevikut" : "Salvesta päevik"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}