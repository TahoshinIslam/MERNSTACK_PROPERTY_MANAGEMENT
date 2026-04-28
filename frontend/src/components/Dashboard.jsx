import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Dashboard({ onPayNow, onViewReceipt }) {
  const { tenants, payments, thisMonth, fmt, initials, avatarColor, totalMonthly, fmtDateTime, monthsBehind, isOnTime, lastPayment } = useApp();

  const [pickedMonth, setPickedMonth] = useState(thisMonth);

  const monthPays    = payments.filter(p => p.month === pickedMonth);
  const totalRevenue = monthPays.reduce((s, p) => s + Number(p.total || 0), 0);
  const paidIds      = new Set(monthPays.map(p => p.tenantId?._id || p.tenantId));
  const pending      = tenants.filter(t => !paidIds.has(t._id));
  const recent       = [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Group pending by next-due date relative to today
  const todayStr = new Date().toISOString().slice(0, 10);
  const in7Str   = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const buckets  = { overdue: [], dueWeek: [], later: [] };
  pending.forEach(t => {
    const due = t.nextpay || '';
    if (due && due < todayStr)         buckets.overdue.push(t);
    else if (due && due <= in7Str)     buckets.dueWeek.push(t);
    else                                buckets.later.push(t);
  });

  const isCurrent = pickedMonth === thisMonth;

  return (
    <div className="content">
      {/* ── Month picker ── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <label style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>View month</label>
        <input
          type="month"
          value={pickedMonth}
          onChange={e => setPickedMonth(e.target.value)}
          style={{ padding:'6px 10px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'var(--surface)' }}
        />
        {!isCurrent && (
          <button className="btn btn-outline btn-sm" onClick={() => setPickedMonth(thisMonth)}>Reset to this month</button>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <StatCard val={tenants.length}   lbl="Total Tenants" />
        <StatCard val={paidIds.size}     lbl={`Paid in ${pickedMonth}`} chg={`৳${fmt(totalRevenue)} collected`} />
        <StatCard val={pending.length}   lbl={`Unpaid in ${pickedMonth}`} />
        <StatCard val={payments.length}  lbl="Total Transactions" />
      </div>

      {/* ── Pending payments, grouped by due-date bucket ── */}
      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ display:'flex', alignItems:'center', gap:6 }}>
            <AlertTriangle size={14} /> Unpaid Tenants — {pickedMonth}
          </div>
          <PendingBucket title="Overdue (next-due date passed)" tone="danger" list={buckets.overdue} {...{ avatarColor, initials, fmt, totalMonthly, monthsBehind, onPayNow }} />
          <PendingBucket title="Due within 7 days"               tone="warn"   list={buckets.dueWeek}  {...{ avatarColor, initials, fmt, totalMonthly, monthsBehind, onPayNow }} />
          <PendingBucket title="Later this month / not scheduled" tone="muted"  list={buckets.later}    {...{ avatarColor, initials, fmt, totalMonthly, monthsBehind, onPayNow }} />
        </div>
      )}

      {/* ── Recent payments ── */}
      <div className="card">
        <div className="section-title">Recent Payments</div>
        {recent.length ? (
          <div className="table-wrap">
          <table className="ptable">
            <thead>
              <tr>
                <th>Tenant</th><th>Paid On</th><th>Status</th>
                <th>Amount</th><th>Next Due</th><th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(p => {
                const t = tenants.find(x => x._id === (p.tenantId?._id || p.tenantId)) || {};
                const onTime = isOnTime(p);
                return (
                  <tr key={p._id}>
                    <td>
                      <strong>{t.name || 'Unknown'}</strong>
                      <br /><span style={{ fontSize:11, color:'var(--text2)' }}>{t.floor}</span>
                    </td>
                    <td>{fmtDateTime(p.createdAt || p.date)}</td>
                    <td>
                      <span className={`badge ${onTime ? 'badge-green' : 'badge-warn'}`}>
                        {onTime ? 'On time' : 'Delayed'}
                      </span>
                    </td>
                    <td style={{ fontWeight:500 }}>৳{fmt(p.total)}</td>
                    <td style={{ fontSize:12, color:'var(--accent)', fontWeight:500 }}>
                      {p.nextPayDate || t.nextpay || '—'}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => onViewReceipt(p._id)}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="empty"><p>No payments recorded yet.</p></div>
        )}
      </div>
    </div>
  );
}

function StatCard({ val, lbl, chg }) {
  return (
    <div className="stat-card">
      <div className="val">{val}</div>
      <div className="lbl">{lbl}</div>
      {chg && <div className="chg">{chg}</div>}
    </div>
  );
}

function PendingBucket({ title, tone, list, avatarColor, initials, fmt, totalMonthly, monthsBehind, onPayNow }) {
  if (!list.length) return null;
  const dotColor = tone === 'danger' ? 'var(--danger)' : tone === 'warn' ? 'var(--warn)' : 'var(--text3)';
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:600, color:'var(--text2)', margin:'10px 0 6px' }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:dotColor }} />
        {title} <span style={{ color:'var(--text3)', fontWeight:400 }}>({list.length})</span>
      </div>
      {list.map(t => (
        <div key={t._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="avatar" style={{ width:34, height:34, fontSize:12, background:avatarColor(t.name) }}>
              {initials(t.name)}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{t.name}</div>
              <div style={{ fontSize:11, color:'var(--text2)' }}>{t.floor || 'N/A'}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:500 }}>৳{fmt(totalMonthly(t))}</div>
              {t.nextpay && <div style={{ fontSize:11, color:dotColor }}>Due: {t.nextpay}</div>}
              {monthsBehind(t) >= 2 && (
                <div style={{ fontSize:11, color:'var(--danger)', fontWeight:600, marginTop:2 }}>
                  {monthsBehind(t)} months behind
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => onPayNow(t._id)}>Pay Now</button>
          </div>
        </div>
      ))}
    </div>
  );
}
