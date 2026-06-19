import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

interface DayStat {
  name: string;
  cost: number;
  isToday: boolean;
}

interface Stats {
  available: boolean;
  hasData: boolean;
  monthTotal: number;
  today: number;
  weekTotal: number;
  days: DayStat[];
}

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function App() {
  const [stats, setStats] = useState<Stats | null>(null);

  const load = async () => {
    try {
      setStats(await invoke<Stats>("get_stats"));
    } catch (e) {
      console.error("get_stats failed", e);
    }
  };

  useEffect(() => {
    load();
    const unlisten = listen("stats-updated", () => load());
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div className="card">
      {!stats ? (
        <div className="muted">Loading…</div>
      ) : !stats.hasData ? (
        <div className="muted">Loading…</div>
      ) : !stats.available ? (
        <div className="error">
          <div>ccusage not found</div>
          <div className="hint">npm install -g ccusage</div>
        </div>
      ) : (
        <>
          <div className="totals">
            <Row label="This Month" value={stats.monthTotal} strong />
            <Row label="This Week" value={stats.weekTotal} strong />
            <Row label="Today" value={stats.today} strong />
          </div>

          <div className="divider" />

          <div className="days">
            {stats.days.map((d) => (
              <Row
                key={d.name}
                label={d.name}
                value={d.cost}
                today={d.isToday}
                dim={d.cost === 0}
              />
            ))}
          </div>
        </>
      )}

      <div className="divider" />

      <div className="actions">
        <button onClick={() => invoke("refresh_now")}>Refresh</button>
        <button onClick={() => invoke("quit_app")}>Quit</button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  today,
  dim,
}: {
  label: string;
  value: number;
  strong?: boolean;
  today?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className={`row${strong ? " strong" : ""}${today ? " today" : ""}${dim ? " dim" : ""}`}
    >
      <span className="label">{label}</span>
      <span className="value">{money(value)}</span>
    </div>
  );
}

export default App;
