import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, Legend,
  PieChart, Pie,
} from 'recharts';
import { useApp } from '../context/AppContext';

const COLORS = {
  accent:   '#2C5F2E',
  accent2:  '#4F8E51',
  warn:     '#D97706',
  danger:   '#C0392B',
  text:     '#1A1916',
  muted:    '#9E9C97',
  surface2: '#EFEDE8',
};

export default function Analytics() {
  const { tenants, payments, fmt, totalMonthly, isOnTime, monthsBehind } = useApp();
  const [growth, setGrowth] = useState(0); // annual rent-increase %

  // ── Last 12 months revenue ────────────────────────────────────────────────
  const last12 = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = payments
        .filter(p => p.month === key)
        .reduce((s, p) => s + Number(p.total || 0), 0);
      out.push({ month: key.slice(2), revenue: total });
    }
    return out;
  }, [payments]);

  // ── On-time vs delayed split ──────────────────────────────────────────────
  const statusSplit = useMemo(() => {
    let onTime = 0, delayed = 0;
    payments.forEach(p => (isOnTime(p) ? onTime++ : delayed++));
    return [
      { name: 'On time', value: onTime,  fill: COLORS.accent },
      { name: 'Delayed', value: delayed, fill: COLORS.warn   },
    ];
  }, [payments, isOnTime]);

  // ── Revenue by floor (current MRR potential) ──────────────────────────────
  const byFloor = useMemo(() => {
    const map = {};
    tenants.forEach(t => {
      const key = (t.floor || 'Unassigned').split(' - ')[0];
      map[key] = (map[key] || 0) + totalMonthly(t);
    });
    return Object.entries(map)
      .map(([floor, mrr]) => ({ floor, mrr }))
      .sort((a, b) => b.mrr - a.mrr);
  }, [tenants, totalMonthly]);

  // ── Delinquency buckets ───────────────────────────────────────────────────
  const delinquency = useMemo(() => {
    const buckets = { current: 0, oneMonth: 0, twoToThree: 0, fourPlus: 0 };
    tenants.forEach(t => {
      const b = monthsBehind(t);
      if (b === 0)      buckets.current++;
      else if (b === 1) buckets.oneMonth++;
      else if (b <= 3)  buckets.twoToThree++;
      else              buckets.fourPlus++;
    });
    return [
      { name: 'Paid this month', value: buckets.current,    fill: COLORS.accent },
      { name: '1 month behind',  value: buckets.oneMonth,   fill: COLORS.warn },
      { name: '2–3 months',      value: buckets.twoToThree, fill: COLORS.danger },
      { name: '4+ months',       value: buckets.fourPlus,   fill: '#7A1E14' },
    ];
  }, [tenants, monthsBehind]);

  // ── Projection: this year, next year, 5-year, 10-year ─────────────────────
  // Baseline MRR = sum of totalMonthly across active tenants
  const mrr = useMemo(() => tenants.reduce((s, t) => s + totalMonthly(t), 0), [tenants, totalMonthly]);

  const projection = useMemo(() => {
    const r = growth / 100;
    const out = [];
    let cumulative = 0;
    const baseYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      const yearRevenue = mrr * 12 * Math.pow(1 + r, i);
      cumulative += yearRevenue;
      out.push({
        year: baseYear + i,
        annual: Math.round(yearRevenue),
        cumulative: Math.round(cumulative),
      });
    }
    return out;
  }, [mrr, growth]);

  const yearOne   = projection[0]?.annual ?? 0;
  const yearFive  = projection.slice(0, 5).reduce((s, x) => s + x.annual, 0);
  const yearTen   = projection.reduce((s, x) => s + x.annual, 0);

  return (
    <div className="content">
      {/* ── Headline projection ── */}
      <div className="stats-grid" style={{ marginBottom: 14 }}>
        <ProjCard lbl="Current MRR"        val={`৳${fmt(mrr)}`} />
        <ProjCard lbl={`This year (${new Date().getFullYear()})`} val={`৳${fmt(yearOne)}`} />
        <ProjCard lbl="5-year cumulative"  val={`৳${fmt(yearFive)}`} />
        <ProjCard lbl="10-year cumulative" val={`৳${fmt(yearTen)}`} />
      </div>

      {/* ── Growth slider ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Annual rent increase</div>
          <div style={{ display:'flex', alignItems:'center', gap:14, flex:1, maxWidth:420 }}>
            <input
              type="range" min="0" max="20" step="0.5"
              value={growth} onChange={e => setGrowth(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <strong style={{ minWidth:54, textAlign:'right' }}>{growth.toFixed(1)}%</strong>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize:12, color:'var(--text2)' }}>
          Projection assumes current tenant roster, current monthly charges, and a flat compounding annual increase. With no historical depth, this is a first-order extrapolation, not a forecast — change the slider to model scenarios.
        </div>
      </div>

      {/* ── Projection chart ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">10-year revenue projection</div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={projection} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface2} />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `৳${fmt(v)}`} />
              <Legend />
              <Line type="monotone" dataKey="annual"     stroke={COLORS.accent}  strokeWidth={2} dot={{ r: 3 }} name="Annual revenue" />
              <Line type="monotone" dataKey="cumulative" stroke={COLORS.warn}    strokeWidth={2} dot={{ r: 3 }} name="Cumulative" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Two-up: revenue history + on-time mix ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16, marginBottom:20 }}>
        <div className="card">
          <div className="section-title">Revenue — last 12 months</div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={last12} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `৳${fmt(v)}`} />
                <Bar dataKey="revenue" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="section-title">Payment punctuality</div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusSplit} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                  {statusSplit.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Two-up: floor revenue + delinquency ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
        <div className="card">
          <div className="section-title">Monthly potential by floor</div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={byFloor} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface2} />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="floor" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v) => `৳${fmt(v)}`} />
                <Bar dataKey="mrr" fill={COLORS.accent2} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="section-title">Tenant delinquency</div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={delinquency} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {delinquency.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjCard({ lbl, val }) {
  return (
    <div className="stat-card">
      <div className="val" style={{ fontSize: 22 }}>{val}</div>
      <div className="lbl">{lbl}</div>
    </div>
  );
}
