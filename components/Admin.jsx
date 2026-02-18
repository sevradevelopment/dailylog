import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Admin() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", userId: "", siteId: "" });

  useEffect(() => { loadData(); }, [filters]);

  async function loadData() {
    setLoading(true); setErrorMessage("");
    try {
      const { data: usersData } = await supabase.from("profiles").select("id, name, email, role").order("name");
      setUsers(usersData || []);

      const { data: sitesData } = await supabase.from("sites").select("id, name").order("name");
      setSites(sitesData || []);

      let query = supabase.from("daily_logs").select("*").order("work_date", { ascending: false }).limit(200);
      if (filters.dateFrom) query = query.gte("work_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("work_date", filters.dateTo);
      if (filters.userId) query = query.eq("user_id", filters.userId);
      if (filters.siteId) query = query.eq("site_id", filters.siteId);

      const { data: logsData, error } = await query;
      if (error) { setErrorMessage(`Viga: ${error.message}`); setLogs([]); setLoading(false); return; }

      const userIds = [...new Set((logsData || []).map(l => l.user_id).filter(Boolean))];
      const siteIds = [...new Set((logsData || []).map(l => l.site_id).filter(Boolean))];

      const { data: profilesData } = userIds.length > 0
        ? await supabase.from("profiles").select("id, name, email").in("id", userIds)
        : { data: [] };

      const { data: sitesLookup } = siteIds.length > 0
        ? await supabase.from("sites").select("id, name").in("id", siteIds)
        : { data: [] };

      const pm = new Map((profilesData || []).map(p => [p.id, p]));
      const sm = new Map((sitesLookup || []).map(s => [s.id, s]));

      setLogs((logsData || []).map(l => ({
        ...l,
        profiles: pm.get(l.user_id) || null,
        sites: l.site_id ? (sm.get(l.site_id) || null) : null,
      })));
    } catch (err) {
      setErrorMessage(`Ootamatu viga: ${err.message}`);
      setLogs([]);
    }
    setLoading(false);
  }

  const totalHours = logs.reduce((s, l) => s + (Number(l.hours) || 0), 0);

  return (
    <div className="page" style={{ maxWidth: "1400px" }}>
      <div className="page-header">
        <h1>Päevikute ajalugu</h1>
        <p>Kõikide tööpäevikute ülevaade</p>
      </div>

      {errorMessage && (
        <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>{errorMessage}</div>
      )}

      {/* Summary */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-card-label">Kirjeid</div>
          <div className="stat-card-value">{logs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Kokku tunnid</div>
          <div className="stat-card-value" style={{ color: "var(--primary)" }}>{totalHours.toFixed(1)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Töötajaid</div>
          <div className="stat-card-value">{new Set(logs.map(l => l.user_id)).size}</div>
        </div>
      </div>

      {/* Filtrid */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Filtrid</span>
          {(filters.dateFrom || filters.dateTo || filters.userId || filters.siteId) && (
            <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }}
              onClick={() => setFilters({ dateFrom: "", dateTo: "", userId: "", siteId: "" })}>
              Tühjenda
            </button>
          )}
        </div>
        <div className="grid-2">
          <div className="field">
            <label className="label">Alates</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className="input" />
          </div>
          <div className="field">
            <label className="label">Kuni</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className="input" />
          </div>
          <div className="field">
            <label className="label">Töötaja</label>
            <select value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} className="input">
              <option value="">Kõik töötajad</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Objekt</label>
            <select value={filters.siteId} onChange={e => setFilters({ ...filters, siteId: e.target.value })} className="input">
              <option value="">Kõik objektid</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <svg className="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "1rem", fontWeight: "600" }}>Päevikuid ei leitud</p>
            <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>Proovi muuta filtreid</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Kuupäev</th>
                  <th>Töötaja</th>
                  <th>Objekt / Tüüp</th>
                  <th>Tunnid</th>
                  <th>Puhkeaeg</th>
                  <th>Transport</th>
                  <th>Kogus</th>
                  <th>Auto</th>
                  <th>Puu</th>
                  <th>Kogus</th>
                  <th>Probleemid</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                      {new Date(log.work_date).toLocaleDateString("et-EE")}
                    </td>
                    <td style={{ fontWeight: "500", whiteSpace: "nowrap" }}>
                      {log.profiles?.name || log.profiles?.email || "—"}
                    </td>
                    <td>
                      {log.admin_work_type || log.sites?.name || "—"}
                    </td>
                    <td>
                      {log.hours ? (
                        <span style={{ fontWeight: "700", color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                          {log.hours}h
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {log.break_start && log.break_end ? `${log.break_start}–${log.break_end}` : "—"}
                    </td>
                    <td style={{ fontSize: "0.8rem" }}>
                      {log.start_location && log.end_location
                        ? `${log.start_location} → ${log.end_location}`
                        : log.cargo_type || "—"}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                      {log.cargo_amount ? `${log.cargo_amount}m³` : "—"}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                      {log.vehicle_plate || "—"}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{log.wood_type || "—"}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                      {log.wood_amount ? `${log.wood_amount}m³` : "—"}
                    </td>
                    <td style={{ maxWidth: "200px", fontSize: "0.8rem", color: log.problems ? "var(--danger)" : "var(--text-light)" }}>
                      {log.problems || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && logs.length > 0 && (
          <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-light)", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
            Kokku: {logs.length} kirjet · {totalHours.toFixed(1)} tundi
          </div>
        )}
      </div>
    </div>
  );
}