import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { tenantApi, paymentApi } from '../api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [tenants,     setTenants]     = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [filterFloor, setFilterFloor] = useState(null);
  const [selectedId,  setSelectedId]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState('');
  const toastTimer = useRef(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  // ── Fetch all ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([tenantApi.getAll(), paymentApi.getAll()]);
      setTenants(tRes.data);
      setPayments(pRes.data);
    } catch (e) {
      showToast('Error loading data');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ── Tenant CRUD ────────────────────────────────────────────────────────────
  const createTenant = useCallback(async (data) => {
    const res = await tenantApi.create(data);
    setTenants(prev => [res.data, ...prev]);
    showToast('Tenant added!');
    return res.data;
  }, [showToast]);

  const updateTenant = useCallback(async (id, data) => {
    const res = await tenantApi.update(id, data);
    setTenants(prev => prev.map(t => t._id === id ? res.data : t));
    showToast('Tenant updated!');
    return res.data;
  }, [showToast]);

  const deleteTenant = useCallback(async (id) => {
    await tenantApi.delete(id);
    setTenants(prev => prev.filter(t => t._id !== id));
    setPayments(prev => prev.filter(p => {
      const tid = p.tenantId?._id || p.tenantId;
      return tid !== id;
    }));
    showToast('Tenant deleted.');
  }, [showToast]);

  // ── Payment CRUD ───────────────────────────────────────────────────────────
  const createPayment = useCallback(async (data) => {
    const res = await paymentApi.create(data);
    setPayments(prev => [res.data, ...prev]);
    // Update nextpay on tenant: backend returns the authoritative value
    // (computed from MAX paid month so back-payments don't rewind it)
    const newNextPay = res.data.tenantNextPay || res.data.nextPayDate;
    if (newNextPay) {
      setTenants(prev => prev.map(t =>
        t._id === data.tenantId ? { ...t, nextpay: newNextPay } : t
      ));
    }
    showToast('Payment recorded!');
    return res.data;
  }, [showToast]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const thisMonth = new Date().toISOString().slice(0, 7);
  const paidSet   = new Set(
    payments
      .filter(p => p.month === thisMonth)
      .map(p => p.tenantId?._id || p.tenantId)
  );

  const fmt = (n) => Number(n || 0).toLocaleString('en-BD');
  const initials   = (name) => (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const avatarColor = (name) => {
    const c = ['#2C5F2E','#1D4E89','#6B2D8B','#B5451B','#0F5F5F','#6B4A1B'];
    return c[(name || '').charCodeAt(0) % c.length];
  };
  const totalMonthly = (t) =>
    Number(t.rent || 0) + Number(t.gas || 0) + Number(t.electricity || 0) + Number(t.service || 0);

  const fmtDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleString('en-BD', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };
  const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const tenantPayments = (tenantId) =>
    payments
      .filter(p => (p.tenantId?._id || p.tenantId) === tenantId)
      .sort((a, b) => (b.month || '').localeCompare(a.month || '') || (b.date || '').localeCompare(a.date || ''));

  const lastPayment = (tenantId) => tenantPayments(tenantId)[0] || null;

  // Each tenant's billing cycle is anchored to their move-in day, not the calendar 1st.
  // Cycle 0 = move-in month (assumed paid at signing).
  // Cycles 1..advanceMonths covered by tenant.advance.
  // Cycles after that are covered by recorded Payment rows.
  const tenantCycle = (tenant) => {
    const rent          = Number(tenant?.rent || 0);
    const advance       = Number(tenant?.advance || 0);
    const advanceMonths = rent > 0 ? Math.floor(advance / rent) : 0;
    const anchorDay     = tenant?.movein ? Number(tenant.movein.slice(8, 10)) : 0;
    return { advanceMonths, anchorDay };
  };

  // Count cycles whose due-date + 7-day grace has passed, then subtract advance + payments.
  const monthsBehind = (tenant) => {
    if (!tenant?.movein) return 0;
    const move = new Date(tenant.movein + 'T00:00:00');
    if (isNaN(move)) return 0;
    const now = new Date();

    let owed = 0;
    for (let k = 1; k < 240; k++) {
      const due = new Date(move);
      due.setMonth(due.getMonth() + k);
      const graceEnd = new Date(due);
      graceEnd.setDate(graceEnd.getDate() + 7);
      if (now > graceEnd) owed = k;
      else break;
    }

    const { advanceMonths } = tenantCycle(tenant);
    const tPays = payments.filter(p => (p.tenantId?._id || p.tenantId) === tenant._id).length;
    return Math.max(0, owed - advanceMonths - tPays);
  };

  // On-time = paid within [anchorDay, anchorDay+7] of the cycle anniversary.
  // Per tenant: a tenant who moved in on the 11th is on-time for days 11–18 of any month.
  const isOnTime = (payment) => {
    if (!payment?.date) return false;
    const tid    = payment.tenantId?._id || payment.tenantId;
    const tenant = tenants.find(t => t._id === tid);
    if (!tenant?.movein) return false;
    const anchorDay = Number(tenant.movein.slice(8, 10));
    const dayPaid   = Number(payment.date.slice(8, 10));
    return dayPaid >= anchorDay && dayPaid <= anchorDay + 7;
  };

  const showView = (view, floor = null) => {
    setFilterFloor(floor);
    setCurrentView(view);
  };

  return (
    <AppContext.Provider value={{
      tenants, payments, currentView, filterFloor, selectedId, loading, toast,
      paidSet, thisMonth, fmt, initials, avatarColor, totalMonthly,
      fmtDate, fmtDateTime, tenantPayments, lastPayment, monthsBehind, isOnTime,
      setSelectedId, showView, showToast,
      fetchAll, createTenant, updateTenant, deleteTenant, createPayment,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
