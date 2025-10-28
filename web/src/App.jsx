import React, { useEffect, useMemo, useState } from "react";

function formatCurrency(v, currency = "USD") {
  if (typeof v !== "number") return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v);
}

function usePrices() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      setLoading(true);
      const bust = Date.now();
      const res = await fetch(`./data.json?bust=${bust}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  return { data, error, loading, refetch: fetchData };
}

export default function App() {
  const { data, error, loading, refetch } = usePrices();

  const minItem = useMemo(() => {
    if (!data?.prices) return null;
    const available = data.prices.filter(p => typeof p.lowest === "number");
    if (available.length === 0) return null;
    return available.reduce((min, p) => p.lowest < min.lowest ? p : min, available[0]);
  }, [data]);

  const updated = data?.updatedAt ? new Date(data.updatedAt) : null;

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="title">Circoloco Ticket Price Dashboard</div>
          <div className="subtitle">Shows the lowest all-in prices found on the three sites you shared.</div>
        </div>
        <button className="refresh-btn" onClick={refetch}>Refresh</button>
      </div>

      {loading && <div className="min-note">Loading latest prices…</div>}
      {error && <div className="min-note">Could not load prices: {String(error)}</div>}

      {data && (
        <>
          <div className="grid">
            {data.prices.map((p) => (
              <div className="card" key={p.site}>
                <div className="card-head">
                  <div className="site">{p.site}</div>
                  <a className="link" href={p.url} target="_blank" rel="noreferrer">Open</a>
                </div>
                <div className="price">{formatCurrency(p.lowest, data.currency)}</div>
                <div className="min-note">Lowest listed, parsed from the page.</div>
              </div>
            ))}
          </div>

          <div className="footer">
            <div>
              {updated ? (
                <span>Last updated <strong>{updated.toLocaleString()}</strong></span>
              ) : (
                <span>Last updated: —</span>
              )}
              {minItem && (
                <span> • Current best: <strong>{minItem.site}</strong> at <strong>{formatCurrency(minItem.lowest, data.currency)}</strong></span>
              )}
            </div>
            <div className="badge">
              This dashboard auto-updates via GitHub Actions + Pages
            </div>
          </div>
        </>
      )}
    </div>
  );
}
