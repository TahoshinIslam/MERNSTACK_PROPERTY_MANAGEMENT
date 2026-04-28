import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PAGE_SIZE = 20;

export default function PaymentList({ onViewDetail, onViewReceipt }) {
  const { tenants, payments, fmt, isOnTime, fmtDateTime } = useApp();
  const [sortDir, setSortDir] = useState('desc'); // 'desc' = latest first
  const [page, setPage]       = useState(1);

  const sorted = useMemo(() => {
    const key = (p) => p.createdAt || p.date || '';
    return [...payments].sort((a, b) =>
      sortDir === 'desc' ? key(b).localeCompare(key(a)) : key(a).localeCompare(key(b))
    );
  }, [payments, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const start = (page - 1) * PAGE_SIZE;
  const slice = sorted.slice(start, start + PAGE_SIZE);

  if (!sorted.length) {
    return (
      <div className="content">
        <div className="empty">
          <h3>No payments yet</h3>
          <p>Payments will appear here once recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="card">
        {/* ── Toolbar ── */}
        <div className="ptable-toolbar">
          <div className="ptable-meta">
            Showing {start + 1}–{Math.min(start + PAGE_SIZE, sorted.length)} of {sorted.length}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <label style={{ fontSize:12, color:'var(--text2)' }}>Sort</label>
            <select
              value={sortDir}
              onChange={e => { setSortDir(e.target.value); setPage(1); }}
              style={{ padding:'6px 10px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'var(--surface)' }}
            >
              <option value="desc">Latest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="ptable ptable-payments">
            <thead>
              <tr>
                <th>Tenant</th>
                <th className="hide-md">Floor</th>
                <th className="hide-sm">Month</th>
                <th>Date</th>
                <th>Status</th>
                <th className="hide-md">Rent</th>
                <th className="hide-md">Gas</th>
                <th className="hide-md">Elec</th>
                <th className="hide-md">Service</th>
                <th className="hide-md">Other</th>
                <th>Total</th>
                <th className="hide-sm">Next Due</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {slice.map(p => {
                const t = tenants.find(x => x._id === (p.tenantId?._id || p.tenantId)) || {};
                return (
                  <tr key={p._id}>
                    <td
                      style={{ cursor:'pointer', color:'var(--accent)' }}
                      onClick={() => onViewDetail(t._id)}
                    >
                      {t.name || 'Unknown'}
                    </td>
                    <td className="hide-md" style={{ fontSize:12, color:'var(--text2)' }}>{t.floor || '—'}</td>
                    <td className="hide-sm">{p.month || '—'}</td>
                    <td>{fmtDateTime(p.createdAt || p.date)}</td>
                    <td>
                      <span className={`badge ${isOnTime(p) ? 'badge-green' : 'badge-warn'}`}>
                        {isOnTime(p) ? 'On time' : 'Delayed'}
                      </span>
                    </td>
                    <td className="hide-md">৳{fmt(p.rent)}</td>
                    <td className="hide-md">৳{fmt(p.gas)}</td>
                    <td className="hide-md">৳{fmt(p.elec)}</td>
                    <td className="hide-md">৳{fmt(p.service)}</td>
                    <td className="hide-md">৳{fmt(p.other)}</td>
                    <td style={{ fontWeight:500 }}>৳{fmt(p.total)}</td>
                    <td className="hide-sm" style={{ fontSize:12, color:'var(--accent)', fontWeight:500 }}>
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

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="ptable-pager">
            <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontSize:13, color:'var(--text2)' }}>Page {page} / {totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
