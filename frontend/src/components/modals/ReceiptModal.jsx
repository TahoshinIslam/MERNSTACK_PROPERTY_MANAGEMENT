import { X, Printer, Scissors } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ReceiptModal({ paymentId, onClose }) {
  const { tenants, payments, fmt, tenantPayments, isOnTime } = useApp();

  const p = payments.find(x => x._id === paymentId);
  if (!p) return null;
  const t = tenants.find(x => x._id === (p.tenantId?._id || p.tenantId)) || {};

  const nextDue   = p.nextPayDate || t.nextpay || '';
  const genDate   = new Date().toLocaleDateString('en-BD', { year:'numeric', month:'long', day:'numeric' });
  const allPays   = tenantPayments(t._id);
  const totalPaid = allPays.reduce((s, x) => s + Number(x.total || 0), 0);
  const idx       = allPays.findIndex(x => x._id === p._id);
  const prev      = idx >= 0 ? allPays[idx + 1] : null;
  const prevLabel = prev ? `${prev.date} (${prev.month})` : 'None';
  const onTime    = isOnTime(p);
  const period    = (p.month || (p.date || '').slice(0, 7)) || '—';

  const charges = [
    ['Rent',            p.rent],
    ['Gas Bill',        p.gas],
    ['Electricity',     p.elec],
    ['Service Charge',  p.service],
    ['Other Charges',   p.other],
  ].filter(([, v]) => Number(v || 0) > 0);

  function ReceiptCopy({ label }) {
    return (
      <div className="receipt">
        <div className="receipt-copy-label">{label}</div>

        {/* ── Branded header (two-up like the loan calc) ── */}
        <div className="r-head">
          <div className="r-head-left">
            <div className="r-brand">TenantHub</div>
            <div className="r-brand-sub">Payment Receipt</div>
          </div>
          <div className="r-head-right">
            <div><span>Receipt #</span><strong>{(p._id || '').slice(-8).toUpperCase()}</strong></div>
            <div><span>Generated</span><strong>{genDate}</strong></div>
          </div>
        </div>

        {/* ── Two-column info: Tenant | Payment Summary ── */}
        <div className="r-grid">
          <div className="r-box">
            <div className="r-box-title">Tenant Information</div>
            <Row k="Name"        v={t.name || '—'} />
            <Row k="Phone"       v={t.phone || '—'} />
            <Row k="Floor / Unit" v={t.floor || '—'} />
            <Row k="National ID" v={t.nid || '—'} />
            <Row k="Move-in"     v={t.movein || '—'} />
          </div>
          <div className="r-box">
            <div className="r-box-title">Payment Summary</div>
            <Row k="Payment Date" v={p.date || '—'} />
            <Row k="Period"       v={period} />
            <Row
              k="Status"
              v={
                <span className={`r-pill ${onTime ? 'r-pill-ok' : 'r-pill-warn'}`}>
                  {onTime ? 'On time' : 'Delayed'}
                </span>
              }
            />
            <Row k="Previous Pmt" v={prevLabel} />
            <Row k="Next Due"     v={nextDue || '—'} highlight />
          </div>
        </div>

        {/* ── Charge breakdown ── */}
        {charges.length > 0 && (
          <div className="r-box r-box-full">
            <div className="r-box-title">Charge Breakdown</div>
            <table className="r-charges">
              <tbody>
                {charges.map(([k, v]) => (
                  <tr key={k}><td>{k}</td><td>৳{fmt(v)}</td></tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td>Total Paid</td><td>৳{fmt(p.total)}</td></tr>
              </tfoot>
            </table>
          </div>
        )}

        {p.notes && <p className="r-note">Note: {p.notes}</p>}

        {/* ── Installment history ── */}
        {allPays.length > 0 && (
          <div className="r-history">
            <div className="r-box-title">
              Payment History — {allPays.length} installment{allPays.length === 1 ? '' : 's'}
            </div>
            <table className="r-history-table">
              <thead>
                <tr><th>#</th><th>Period</th><th>Date</th><th>Status</th><th style={{ textAlign:'right' }}>Amount</th></tr>
              </thead>
              <tbody>
                {allPays.map((x, i) => (
                  <tr key={x._id} className={x._id === p._id ? 'is-current' : ''}>
                    <td>{allPays.length - i}</td>
                    <td>{x.month}</td>
                    <td>{x.date}</td>
                    <td>{isOnTime(x) ? 'On time' : 'Delayed'}</td>
                    <td style={{ textAlign:'right' }}>৳{fmt(x.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan="4" style={{ textAlign:'right' }}>Total Paid (all time)</td><td style={{ textAlign:'right' }}>৳{fmt(totalPaid)}</td></tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="r-signatures">
          <div className="sig-box"><div className="sig-line" /><div className="sig-label">Owner's Signature</div></div>
          <div className="sig-box"><div className="sig-line" /><div className="sig-label">Tenant's Signature</div></div>
        </div>

        <div className="r-footer">
          Thank you for your payment · TenantHub Property Manager
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-print-area').innerHTML;
    let iframe = document.getElementById('_print_frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = '_print_frame';
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>Receipt</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'DM Sans',sans-serif;background:#fff;padding:18px;color:#000}
      .receipt{background:#fff;padding:20px;max-width:720px;margin:0 auto;border:1px solid #ddd}
      .receipt-copy-label{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#999;text-align:right;margin-bottom:10px;padding-bottom:6px;border-bottom:1px dashed #ddd}

      .r-head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:14px}
      .r-brand{font-family:'DM Serif Display',serif;font-size:22px}
      .r-brand-sub{font-size:11px;color:#666;letter-spacing:1px;text-transform:uppercase}
      .r-head-right{text-align:right;font-size:11px;color:#444}
      .r-head-right div{display:flex;justify-content:flex-end;gap:8px;padding:1px 0}
      .r-head-right span{color:#888}

      .r-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
      .r-box{border:1px solid #cfd6e0;background:#f7f9fc;padding:10px 12px}
      .r-box-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#1f3a5f;background:#dde6f1;margin:-10px -12px 8px;padding:6px 12px;border-bottom:1px solid #cfd6e0}
      .r-row{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px dotted #d8dee8}
      .r-row:last-child{border-bottom:none}
      .r-row .k{color:#555}
      .r-row .v{font-weight:500;text-align:right}
      .r-row.hl .v{color:#1A3D1B}
      .r-pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:10px;font-weight:600}
      .r-pill-ok{background:#e8f5e9;color:#2C5F2E}
      .r-pill-warn{background:#FEF3C7;color:#92400E}

      .r-box-full{margin-bottom:12px}
      .r-charges{width:100%;border-collapse:collapse;font-size:12px}
      .r-charges td{padding:4px 6px;border-bottom:1px dotted #d8dee8}
      .r-charges td:last-child{text-align:right;font-weight:500}
      .r-charges tfoot td{border-top:2px solid #000;border-bottom:none;padding-top:6px;font-weight:700;font-size:13px}

      .r-note{margin:8px 0;font-size:11px;color:#666;font-style:italic}

      .r-history{margin-top:10px}
      .r-history-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:4px}
      .r-history-table th{background:#1A1916;color:#fff;text-align:left;padding:5px 6px;font-weight:600}
      .r-history-table td{padding:4px 6px;border-bottom:1px solid #eee}
      .r-history-table tr:nth-child(even) td{background:#fafafa}
      .r-history-table tr.is-current td{background:#fff8e1;font-weight:700}
      .r-history-table tfoot td{border-top:2px solid #000;border-bottom:none;padding-top:6px;font-weight:700}

      .r-signatures{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:18px;padding-top:14px;border-top:1px solid #ddd}
      .sig-box{text-align:center}
      .sig-line{border-bottom:1.5px solid #333;margin-bottom:5px;height:36px}
      .sig-label{font-size:10px;color:#555;font-weight:500}
      .r-footer{text-align:center;margin-top:12px;font-size:10px;color:#999;border-top:1px dashed #ddd;padding-top:8px}
      .receipt-cut{text-align:center;font-size:10px;color:#bbb;padding:10px 0;letter-spacing:2px;border-top:1px dashed #ccc;border-bottom:1px dashed #ccc;margin:14px 0}

      @media print{body{padding:8px}.receipt{border:none}}
    </style>
    </head><body>${printContent}</body></html>`);
    doc.close();
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); }, 600);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 780 }}>
        <div className="modal-header">
          <h3>Payment Receipt</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div id="receipt-print-area">
            <ReceiptCopy label="Owner's Copy" />
            <div className="receipt-cut">
              <Scissors size={12} style={{ verticalAlign:'middle' }} /> &nbsp; Cut Here &nbsp; <Scissors size={12} style={{ verticalAlign:'middle' }} />
            </div>
            <ReceiptCopy label="Tenant's Copy" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handlePrint}><Printer size={14} /> Print Receipt</button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, highlight }) {
  return (
    <div className={`r-row${highlight ? ' hl' : ''}`}>
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}
