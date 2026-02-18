import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Stats() {
  const [stats, setStats] = useState({ totalHours: 0, totalLogs: 0, activeUsers: 0, thisWeekHours: 0, totalFuelLiters: 0, totalFuelCost: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const { data: allLogs } = await supabase.from("daily_logs").select("hours, work_date, user_id");

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];

      const { data: weekLogs } = await supabase.from("daily_logs").select("hours, user_id").gte("work_date", weekAgoStr).lte("work_date", todayStr);
      const { data: activeUsersData } = await supabase.from("daily_logs").select("user_id").gte("work_date", weekAgoStr).lte("work_date", todayStr);
      const { data: recentLogsData } = await supabase.from("daily_logs").select("id, user_id, site_id, work_date, hours, created_at").order("created_at", { ascending: false }).limit(15);
      const { data: fuelData } = await supabase.from("fuel_logs").select("liters, total_cost").gte("fuel_date", weekAgoStr);

      const userIds = [...new Set(recentLogsData?.map(l => l.user_id) || [])];
      const siteIds = [...new Set(recentLogsData?.map(l => l.site_id).filter(Boolean) || [])];
      const { data: profilesData } = await supabase.from("profiles").select("id, name, email").in("id", userIds);
      const { data: sitesData } = siteIds.length > 0 ? await supabase.from("sites").select("id, name").in("id", siteIds) : { data: [] };

      const pm = new Map(profilesData?.map(p => [p.id, p]) || []);
      const sm = new Map(sitesData?.map(s => [s.id, s]) || []);

      const totalHours = (allLogs || []).reduce((s, l) => s + (Number(l.hours) || 0), 0);
      const thisWeekHours = (weekLogs || []).reduce((s, l) => s + (Number(l.hours) || 0), 0);
      const activeUsers = new Set((activeUsersData || []).map(l => l.user_id)).size;
      const totalFuelLiters = (fuelData || []).reduce((s, f) => s + (f.liters || 0), 0);
      const totalFuelCost = (fuelData || []).reduce((s, f) => s + (f.total_cost || 0), 0);

      setStats({
        totalHours: totalHours.toFixed(1),
        totalLogs: (allLogs || []).length,
        activeUsers,
        thisWeekHours: thisWeekHours.toFixed(1),
        totalFuelLiters: totalFuelLiters.toFixed(0),
        totalFuelCost: totalFuelCost.toFixed(2),
      });

      setRecentLogs((recentLogsData || []).map(l => ({
        ...l, profiles: pm.get(l.user_id) || null, sites: l.site_id ? (sm.get(l.site_id) || null) : null,
      })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
      <svg className="spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Statistika</h1>
        <p>Ülevaade tööpäevikutest</p>
      </div>

      <div className="stat-grid">
        {[
          { label: "Kokku tunde", value: stats.totalHours, sub: "Kõik aegade jooksul", color: "var(--primary)" },
          { label: "Sel nädalal", value: `${stats.thisWeekHours}h`, sub: "Viimased 7 päeva", color: "var(--success)" },
          { label: "Aktiivsed töötajad", value: stats.activeUsers, sub: "Viimase nädala jooksul", color: "var(--primary)" },
          { label: "Kokku logisid", value: stats.totalLogs, sub: "Kõik kirjed", color: "var(--text)" },
          { label: "Kütus nädalal", value: `${stats.totalFuelLiters}L`, sub: "Viimased 7 päeva", color: "var(--accent)" },
          { label: "Kütusekulu", value: `€${stats.totalFuelCost}`, sub: "Viimased 7 päeva", color: "var(--warning)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-card-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Viimased logid</h3>
          <button onClick={loadStats} className="btn btn-secondary btn-sm">Värskenda</button>
        </div>

        {recentLogs.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>Logisid pole</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {recentLogs.map(log => (
              <div key={log.id} style={{
                padding: "0.875rem 1rem",
                background: "var(--bg-hover)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}>
                <div>
                  <p style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                    {log.profiles?.name || log.profiles?.email || "Tundmatu"}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.125rem" }}>
                    {new Date(log.work_date).toLocaleDateString("et-EE", { weekday: "short", day: "numeric", month: "short" })}
                    {log.sites?.name ? ` · ${log.sites.name}` : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontWeight: "700", color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                    {log.hours || 0}h
                  </span>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString("et-EE", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}