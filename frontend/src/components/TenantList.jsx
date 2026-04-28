import { useState } from 'react';
import { Search, Download, FileDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TenantList({ onViewDetail, onExportCsv, onExportPdf }) {
  const { tenants, paidSet, filterFloor, fmt, initials, avatarColor, totalMonthly, showView, lastPayment, monthsBehind, fmtDate } = useApp();
  const [q, setQ] = useState('');

  let data = filterFloor
    ? tenants.filter(t => (t.floor || '').startsWith(filterFloor))
    : tenants;
  if (q) data = data.filter(t => JSON.stringify(t).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="content">
      {/* ── Inline toolbar ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div className="search-bar">
          <Search />
          <input
            placeholder="Search tenants…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-outline btn-sm" onClick={onExportCsv}><Download size={14} /> Export Excel</button>
          <button className="btn btn-outline btn-sm" onClick={onExportPdf}><FileDown size={14} /> Export PDF</button>
        </div>
      </div>

      {!data.length ? (
        <div className="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          <h3>No tenants found</h3>
          <p>Add a new tenant to get started.</p>
        </div>
      ) : (
        <div className="card-grid">
          {data.map(t => {
            const paid    = paidSet.has(t._id);
            const last    = lastPayment(t._id);
            const behind  = monthsBehind(t);
            const overdue = behind >= 2;
            return (
              <div className="tenant-card" key={t._id} onClick={() => onViewDetail(t._id)}>
                <div className="tc-header">
                  <div className="avatar" style={{ background: avatarColor(t.name) }}>
                    {initials(t.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="tc-name">{t.name}</div>
                    <div className="tc-sub">{t.floor || 'No floor assigned'}</div>
                  </div>
                  <span className={`badge ${overdue ? 'badge-red' : paid ? 'badge-green' : 'badge-warn'}`}>
                    {overdue ? `${behind} mo behind` : paid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div className="tc-meta">
                  <span><strong>৳{fmt(totalMonthly(t))}</strong>/mo</span>
                  <span>{t.phone || '—'}</span>
                  <span>Since {t.movein || '—'}</span>
                  <span style={{ color: t.nextpay ? 'var(--accent)' : 'var(--text2)' }}>
                    Next: {t.nextpay || '—'}
                  </span>
                  <span style={{ gridColumn: '1 / -1', color:'var(--text2)' }}>
                    Last paid: {last ? `${fmtDate(last.date)} (${last.month})` : 'Never'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
