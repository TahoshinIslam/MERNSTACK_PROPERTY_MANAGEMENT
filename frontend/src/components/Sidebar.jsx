import { useApp } from '../context/AppContext';

const FLOORS = ['Ground Floor','1st Floor','2nd Floor','3rd Floor','4th Floor','5th Floor','6th Floor'];

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { tenants, payments, currentView, filterFloor, paidSet, showView } = useApp();

  const go = (view, floor = null) => { showView(view, floor); onClose(); };

  return (
    <nav id="sidebar" className={open ? 'open' : ''}>
      <div className="sb-brand">
        <h1>TenantHub</h1>
        <p>Property Manager</p>
      </div>

      <div className="sb-section">Navigation</div>

      <NavItem icon={<GridIcon />}  label="Dashboard"   active={currentView === 'dashboard' && !filterFloor} onClick={() => go('dashboard')} />
      <NavItem icon={<UsersIcon />} label="All Tenants" active={currentView === 'tenants'   && !filterFloor} onClick={() => go('tenants')} />
      <NavItem icon={<CardIcon />}  label="Payments"    active={currentView === 'payments'  && !filterFloor} onClick={() => go('payments')} />
      <NavItem icon={<ChartIcon />} label="Analytics"   active={currentView === 'analytics' && !filterFloor} onClick={() => go('analytics')} />

      <div className="sb-section">By Floor</div>
      <div className="sb-floors">
        {FLOORS.map(f => {
          const count = tenants.filter(t => (t.floor || '').startsWith(f)).length;
          return (
            <button
              key={f}
              className={`floor-btn ${filterFloor === f ? 'active' : ''}`}
              onClick={() => go('tenants', f)}
            >
              {f} <span className="floor-badge">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="sb-bottom">
        <div className="sb-stats">
          <div className="sb-stat"><span>Total Tenants</span><strong>{tenants.length}</strong></div>
          <div className="sb-stat"><span>Paid This Month</span><strong>{paidSet.size}</strong></div>
          <div className="sb-stat"><span>Pending</span><strong>{tenants.length - paidSet.size}</strong></div>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div className={`sb-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}{label}
    </div>
  );
}

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const CardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);
