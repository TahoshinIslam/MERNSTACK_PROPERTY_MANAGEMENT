import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useApp } from './context/AppContext';

import Sidebar      from './components/Sidebar';
import Dashboard    from './components/Dashboard';
import TenantList   from './components/TenantList';
import TenantDetail from './components/TenantDetail';
import PaymentList  from './components/PaymentList';
import Analytics    from './components/Analytics';
import Toast        from './components/Toast';

import TenantModal  from './components/modals/TenantModal';
import PaymentModal from './components/modals/PaymentModal';
import ReceiptModal from './components/modals/ReceiptModal';

export default function App() {
  const {
    tenants, payments, currentView, filterFloor,
    fetchAll, deleteTenant, showView, showToast,
    fmt, initials,
    loading,
  } = useApp();

  // Which modals are open
  const [tenantModal,  setTenantModal]  = useState(false);   // false | 'add' | tenantId (edit)
  const [paymentModal, setPaymentModal] = useState(null);    // tenantId | null
  const [receiptModal, setReceiptModal] = useState(null);    // paymentId | null
  const [detailId,     setDetailId]     = useState(null);    // tenantId | null
  const [sidebarOpen,  setSidebarOpen]  = useState(false);   // mobile drawer

  // Page title
  const titles = { dashboard:'Dashboard', tenants:'All Tenants', payments:'Payment History', detail:'Tenant Profile', analytics:'Analytics' };
  const pageTitle = filterFloor ? `Floor: ${filterFloor}` : (titles[currentView] || '');

  useEffect(() => { fetchAll(); }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openDetail = (id)   => { setDetailId(id); showView('detail'); };
  const openPayNow = (id)   => setPaymentModal(id);
  const openReceipt = (id)  => setReceiptModal(id);
  const openAddTenant = ()  => setTenantModal('add');
  const openEditTenant = (id) => setTenantModal(id);

  const handleDelete = async (id) => {
    if (!confirm('Delete this tenant and all their payment records?')) return;
    await deleteTenant(id);
    showView('tenants');
  };

  // ── Export helpers ────────────────────────────────────────────────────────
  const exportCsv = () => {
    let data = filterFloor ? tenants.filter(t => (t.floor || '').startsWith(filterFloor)) : tenants;
    const headers = ['ID','Name','Father','Mother','Phone','Occupation','NID','Wife','Wife Father','Wife Mother','Wife Phone','Wife Occ','Children','Floor','Rent','Move-in','Next Payment','Advance','Surety','Gas','Electricity','Service','Notes'];
    const rows    = data.map(t => [t._id,t.name,t.father,t.mother,t.phone,t.occupation,t.nid,t.wife,t.wifeFather,t.wifeMother,t.wifePhone,t.wifeOcc,t.children,t.floor,t.rent,t.movein,t.nextpay,t.advance,t.surety,t.gas,t.electricity,t.service,t.notes]);
    const csv     = [headers, ...rows].map(r => r.map(c => `"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'tenants.csv';
    a.click();
    showToast('Exported as CSV!');
  };

  const exportPdf = () => {
    let data = filterFloor ? tenants.filter(t => (t.floor || '').startsWith(filterFloor)) : tenants;
    const thisMonth = new Date().toISOString().slice(0,7);
    const paidIds   = new Set(payments.filter(p => p.month === thisMonth).map(p => p.tenantId?._id || p.tenantId));
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Tenant Report</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}h1{font-size:20px;margin-bottom:4px}p{color:#666;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#1A1916;color:#fff;padding:8px;text-align:left;font-size:11px}td{padding:7px 8px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f9f9f9}.paid{background:#e8f5e9;color:#2C5F2E;padding:2px 8px;border-radius:10px;font-size:10px}.pending{background:#fff8e1;color:#D97706;padding:2px 8px;border-radius:10px;font-size:10px}</style>
    </head><body>
    <h1>TenantHub — Tenant Report</h1>
    <p>Generated: ${new Date().toLocaleDateString('en-BD',{year:'numeric',month:'long',day:'numeric'})} · Total: ${data.length} tenants</p>
    <table><thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Floor/Unit</th><th>Monthly</th><th>Move-in</th><th>Next Due</th><th>Status</th></tr></thead>
    <tbody>${data.map((t,i) => {
      const total = Number(t.rent||0)+Number(t.gas||0)+Number(t.electricity||0)+Number(t.service||0);
      const paid  = paidIds.has(t._id);
      return `<tr><td>${i+1}</td><td><strong>${t.name||'—'}</strong>${t.wife?`<br><small>${t.wife}</small>`:''}</td><td>${t.phone||'—'}</td><td>${t.floor||'—'}</td><td>৳${fmt(total)}</td><td>${t.movein||'—'}</td><td>${t.nextpay||'—'}</td><td><span class="${paid?'paid':'pending'}">${paid?'Paid':'Pending'}</span></td></tr>`;
    }).join('')}</tbody></table></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div id="main">
        {/* Topbar */}
        <div className="topbar">
          <button
            className="burger"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h2>{pageTitle}</h2>
          <div className="topbar-actions">
            <button className="btn btn-primary btn-sm" onClick={openAddTenant}>+ Add Tenant</button>
          </div>
        </div>

        {/* Views */}
        {loading ? (
          <div className="spinner">Loading…</div>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <Dashboard onPayNow={openPayNow} onViewReceipt={openReceipt} />
            )}
            {currentView === 'tenants' && (
              <TenantList
                onViewDetail={openDetail}
                onExportCsv={exportCsv}
                onExportPdf={exportPdf}
              />
            )}
            {currentView === 'payments' && (
              <PaymentList
                onViewDetail={openDetail}
                onViewReceipt={openReceipt}
              />
            )}
            {currentView === 'analytics' && <Analytics />}
            {currentView === 'detail' && detailId && (
              <TenantDetail
                tenantId={detailId}
                onEdit={() => openEditTenant(detailId)}
                onPayment={() => openPayNow(detailId)}
                onReceipt={openReceipt}
                onBack={() => showView('tenants')}
                onDelete={() => handleDelete(detailId)}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {tenantModal && (
        <TenantModal
          editId={tenantModal === 'add' ? null : tenantModal}
          onClose={() => setTenantModal(false)}
        />
      )}
      {paymentModal && (
        <PaymentModal
          tenantId={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSuccess={(pid) => { setReceiptModal(pid); setPaymentModal(null); }}
        />
      )}
      {receiptModal && (
        <ReceiptModal
          paymentId={receiptModal}
          onClose={() => setReceiptModal(null)}
        />
      )}

      <Toast />
    </>
  );
}
