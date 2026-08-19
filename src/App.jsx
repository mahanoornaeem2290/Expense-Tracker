import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, ArrowDownCircle, BarChart2, Target,
  Settings, Plus, Trash2, TrendingDown, Wallet, Calendar,
  Tag, Search, Download, RefreshCw, X, CheckCircle2,
  AlertCircle, Info, ChevronDown, ArrowUpDown
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import './index.css'

// ─── Constants ────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'PKR', symbol: '₨', label: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
]

const CATS = [
  { name: 'Food',          emoji: '🍔', color: '#00e5a8', dim: 'rgba(0,229,168,.12)'   },
  { name: 'Transport',     emoji: '🚗', color: '#9b6ef3', dim: 'rgba(155,110,243,.12)' },
  { name: 'Utilities',     emoji: '⚡', color: '#38c8fb', dim: 'rgba(56,200,251,.12)'  },
  { name: 'Entertainment', emoji: '🎮', color: '#f9a825', dim: 'rgba(249,168,37,.12)'  },
  { name: 'Shopping',      emoji: '🛍️', color: '#fb4d6d', dim: 'rgba(251,77,109,.12)'  },
  { name: 'Health',        emoji: '💊', color: '#34d399', dim: 'rgba(52,211,153,.12)'  },
  { name: 'Education',     emoji: '📚', color: '#60a5fa', dim: 'rgba(96,165,250,.12)'  },
  { name: 'Other',         emoji: '📦', color: '#94a3b8', dim: 'rgba(148,163,184,.12)' },
]

const cat = (name) => CATS.find(c => c.name === name) || CATS[7]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const SEED = [
  { id: 1,  amount: 42.5,  category: 'Food',          description: 'Dinner out',          date: '2026-08-19' },
  { id: 2,  amount: 120,   category: 'Shopping',       description: 'New headphones',       date: '2026-08-18' },
  { id: 3,  amount: 35,    category: 'Transport',      description: 'Uber rides',           date: '2026-08-17' },
  { id: 4,  amount: 60,    category: 'Entertainment',  description: 'Netflix + Spotify',    date: '2026-08-16' },
  { id: 5,  amount: 85,    category: 'Utilities',      description: 'Electricity bill',     date: '2026-08-15' },
  { id: 6,  amount: 28,    category: 'Food',           description: 'Groceries',            date: '2026-08-14' },
  { id: 7,  amount: 200,   category: 'Shopping',       description: 'New shoes',            date: '2026-08-13' },
  { id: 8,  amount: 15,    category: 'Transport',      description: 'Metro pass',           date: '2026-08-12' },
  { id: 9,  amount: 55,    category: 'Health',         description: 'Pharmacy',             date: '2026-08-11' },
  { id: 10, amount: 180,   category: 'Education',      description: 'Online course',        date: '2026-08-10' },
  { id: 11, amount: 22.5,  category: 'Food',           description: 'Coffee & snacks',      date: '2026-08-09' },
  { id: 12, amount: 90,    category: 'Entertainment',  description: 'Concert tickets',      date: '2026-07-28' },
  { id: 13, amount: 75,    category: 'Shopping',       description: 'Clothes',              date: '2026-07-20' },
  { id: 14, amount: 45,    category: 'Food',           description: 'Restaurant',           date: '2026-07-15' },
  { id: 15, amount: 110,   category: 'Utilities',      description: 'Internet bill',        date: '2026-07-10' },
]

const DEFAULT_BUDGETS = {
  Food: 300, Transport: 150, Utilities: 200,
  Entertainment: 100, Shopping: 250, Health: 150,
  Education: 200, Other: 100,
}

// ─── Custom Tooltip ───────────────────────────────────────────────
const Tip = ({ active, payload, label, sym }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <div className="ct-label">{label}</div>
      <div className="ct-val">{sym}{payload[0].value?.toFixed(2)}</div>
    </div>
  )
}

// ─── Toast System ─────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && <CheckCircle2 size={15} />}
          {t.type === 'error'   && <AlertCircle  size={15} />}
          {t.type === 'info'    && <Info         size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────
export default function App() {
  // State
  const [expenses, setExpenses] = useState(() => {
    try { const s = localStorage.getItem('spendly_v3'); return s ? JSON.parse(s) : SEED }
    catch { return SEED }
  })
  const [budgets, setBudgets] = useState(() => {
    try { const s = localStorage.getItem('spendly_budgets'); return s ? JSON.parse(s) : DEFAULT_BUDGETS }
    catch { return DEFAULT_BUDGETS }
  })
  const [currency, setCurrency] = useState(() => localStorage.getItem('spendly_currency') || 'USD')
  const [page, setPage] = useState('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [toasts, setToasts] = useState([])

  // Form state
  const [form, setForm] = useState({
    amount: '', category: 'Food', description: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Budget edit state
  const [editBudget, setEditBudget] = useState(null) // { name, value }

  const sym = CURRENCIES.find(c => c.code === currency)?.symbol || '$'

  // Persist
  useEffect(() => { localStorage.setItem('spendly_v3', JSON.stringify(expenses)) }, [expenses])
  useEffect(() => { localStorage.setItem('spendly_budgets', JSON.stringify(budgets)) }, [budgets])
  useEffect(() => { localStorage.setItem('spendly_currency', currency) }, [currency])

  // Toast
  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800)
  }, [])

  // Expense ops
  const addExpense = (e) => {
    e.preventDefault()
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) return
    const updated = [{ id: Date.now(), amount: +form.amount, ...form }, ...expenses]
    setExpenses(updated)
    setForm({ amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0] })
    setShowModal(false)
    toast(`Added ${sym}${(+form.amount).toFixed(2)} for ${form.category}`)
  }

  const deleteExpense = (id, name) => {
    setExpenses(ex => ex.filter(e => e.id !== id))
    toast(`Deleted: ${name}`, 'error')
  }

  const clearAll = () => {
    if (!window.confirm('Delete ALL expense data? This cannot be undone.')) return
    setExpenses([])
    toast('All data cleared', 'info')
  }

  const exportCSV = () => {
    const rows = [
      ['Date', 'Category', 'Description', 'Amount', 'Currency'],
      ...expenses.map(e => [e.date, e.category, e.description || '', e.amount, currency])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'spendly_export.csv'; a.click()
    toast('CSV exported!', 'info')
  }

  // ─── Derived data ────────────────────────────────────────────────
  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])
  const avgTx  = expenses.length ? total / expenses.length : 0

  const thisMonthExp = useMemo(() => {
    const now = new Date()
    return expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }, [expenses])

  const thisMonth = useMemo(() => thisMonthExp.reduce((s, e) => s + e.amount, 0), [thisMonthExp])

  const topCat = useMemo(() => {
    const m = {}
    expenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount })
    return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] || '–'
  }, [expenses])

  const catData = useMemo(() => {
    const m = {}
    expenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount })
    return CATS.map(c => ({ ...c, value: m[c.name] || 0 })).filter(c => c.value > 0).sort((a, b) => b.value - a.value)
  }, [expenses])

  const monthlyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1)
      const total = expenses.filter(e => {
        const ed = new Date(e.date)
        return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
      }).reduce((s, e) => s + e.amount, 0)
      return { name: MONTHS[d.getMonth()], amount: +total.toFixed(2) }
    })
  }, [expenses])

  const dailyData = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      const ds = d.toISOString().split('T')[0]
      return { name: DAYS[d.getDay()], amount: +expenses.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0).toFixed(2) }
    })
  , [expenses])

  const radarData = useMemo(() =>
    CATS.slice(0, 7).map(c => {
      const sp = expenses.filter(e => e.category === c.name).reduce((s, e) => s + e.amount, 0)
      return { subject: c.name, amount: +sp.toFixed(0), fullMark: Math.max(total * 0.5, 1) }
    })
  , [expenses, total])

  const dayOfWeekData = useMemo(() => {
    const data = DAYS.map(d => ({ name: d, amount: 0 }))
    expenses.forEach(e => {
      const d = new Date(e.date).getDay()
      data[d].amount += e.amount
    })
    return data.map(d => ({ ...d, amount: +d.amount.toFixed(2) }))
  }, [expenses])

  const top5 = useMemo(() => [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5), [expenses])

  // Page titles
  const PAGE_META = {
    dashboard:    { title: '📊 Dashboard',    sub: 'Your financial overview' },
    transactions: { title: '💳 Transactions', sub: `${expenses.length} total records` },
    analytics:    { title: '📈 Analytics',    sub: 'Spending insights' },
    budget:       { title: '🎯 Budget',       sub: 'Monthly limits per category' },
    settings:     { title: '⚙️ Settings',     sub: 'Preferences & data management' },
  }

  const NAV = [
    { id: 'dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', Icon: ArrowDownCircle, badge: expenses.length },
    { id: 'analytics',   label: 'Analytics',    Icon: BarChart2 },
    { id: 'budget',      label: 'Budget',       Icon: Target },
  ]

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-icon">💸</div>
          <span className="sb-logo-name">Spendly</span>
        </div>

        <span className="sb-section">Main</span>
        {NAV.map(({ id, label, Icon, badge }) => (
          <button key={id} className={`nav-btn ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
            <Icon size={17} />
            {label}
            {badge !== undefined && <span className="nav-badge">{badge}</span>}
          </button>
        ))}

        <div className="sb-bottom">
          <span className="sb-section">Account</span>
          <button className={`nav-btn ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>
            <Settings size={17} /> Settings
          </button>

          <div className="sb-mini-card">
            <div className="sb-mini-label">This Month</div>
            <div className="sb-mini-val">{sym}{thisMonth.toFixed(2)}</div>
            <div className="sb-mini-sub">{thisMonthExp.length} transactions</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main">
        <div className="topbar">
          <div className="tb-left">
            <h2>{PAGE_META[page].title}</h2>
            <p>{PAGE_META[page].sub}</p>
          </div>
          <div className="tb-right">
            <button className="add-btn" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Expense
            </button>
          </div>
        </div>

        <div className="page" key={page}>
          {page === 'dashboard'    && <DashboardPage expenses={expenses} thisMonth={thisMonth} total={total} avgTx={avgTx} topCat={topCat} catData={catData} monthlyData={monthlyData} dailyData={dailyData} sym={sym} onNav={setPage} onDelete={deleteExpense} />}
          {page === 'transactions' && <TransactionsPage expenses={expenses} sym={sym} onDelete={deleteExpense} catData={catData} />}
          {page === 'analytics'    && <AnalyticsPage monthlyData={monthlyData} dailyData={dailyData} catData={catData} radarData={radarData} dayOfWeekData={dayOfWeekData} top5={top5} sym={sym} total={total} />}
          {page === 'budget'       && <BudgetPage expenses={expenses} budgets={budgets} setBudgets={setBudgets} sym={sym} editBudget={editBudget} setEditBudget={setEditBudget} toast={toast} />}
          {page === 'settings'     && <SettingsPage currency={currency} setCurrency={setCurrency} onClear={clearAll} onExport={exportCSV} expenses={expenses} />}
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-top">
              <div className="modal-title">New Expense</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={15} /></button>
            </div>

            <form onSubmit={addExpense} className="form-stack">
              <div className="amount-preview">
                {form.amount ? `${sym}${(+form.amount).toFixed(2)}` : `${sym}0.00`}
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label>Amount</label>
                  <input id="f-amount" type="number" step="0.01" min="0.01" placeholder="0.00"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required autoFocus />
                </div>
                <div className="field">
                  <label>Date</label>
                  <input id="f-date" type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>

              <div className="field">
                <label>Category</label>
                <div className="cat-picker">
                  {CATS.map(c => (
                    <button type="button" key={c.name}
                      className={`cat-chip ${form.category === c.name ? 'selected' : ''}`}
                      style={form.category === c.name ? { background: c.dim, borderColor: `${c.color}40`, color: c.color } : {}}
                      onClick={() => setForm(f => ({ ...f, category: c.name }))}
                    >
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Description <span style={{ color: 'var(--t3)', fontWeight: 400 }}>(optional)</span></label>
                <input id="f-desc" type="text" placeholder="What did you buy?"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// PAGE: DASHBOARD
// ─────────────────────────────────────────────────────────────────────
function DashboardPage({ expenses, thisMonth, total, avgTx, topCat, catData, monthlyData, dailyData, sym, onNav, onDelete }) {
  const tc = cat(topCat)
  return (
    <>
      {/* Stat Cards */}
      <div className="stats-grid mb-md">
        <div className="stat-card c-em">
          <div className="sc-label">Total Spent</div>
          <div className="sc-val">{sym}{total.toFixed(0)}</div>
          <div className="sc-sub">{expenses.length} transactions</div>
          <Wallet size={40} className="sc-icon" />
        </div>
        <div className="stat-card c-vi">
          <div className="sc-label">This Month</div>
          <div className="sc-val">{sym}{thisMonth.toFixed(0)}</div>
          <div className="sc-sub">{new Date().toLocaleDateString('en',{month:'long',year:'numeric'})}</div>
          <Calendar size={40} className="sc-icon" />
        </div>
        <div className="stat-card c-ro">
          <div className="sc-label">Avg / Transaction</div>
          <div className="sc-val">{sym}{avgTx.toFixed(0)}</div>
          <div className="sc-sub">Per purchase</div>
          <TrendingDown size={40} className="sc-icon" />
        </div>
        <div className="stat-card c-am">
          <div className="sc-label">Top Category</div>
          <div className="sc-val" style={{ fontSize:'1.3rem' }}>{tc.emoji} {topCat}</div>
          <div className="sc-sub">Most spending</div>
          <Tag size={40} className="sc-icon" />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2 mb-md">
        {/* Area chart */}
        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">Spending Trend</div><div className="panel-sub">Last 7 months</div></div>
            <BarChart2 size={17} style={{ color:'var(--t3)' }} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00e5a8" stopOpacity={.3} />
                  <stop offset="95%" stopColor="#00e5a8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill:'#3d4f70', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#3d4f70', fontSize:12 }} axisLine={false} tickLine={false} tickFormatter={v=>`${sym}${v}`} width={55} />
              <Tooltip content={<Tip sym={sym} />} />
              <Area type="monotone" dataKey="amount" stroke="#00e5a8" strokeWidth={2.5} fill="url(#ag)" dot={false} activeDot={{ r:5, fill:'#00e5a8', strokeWidth:0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">By Category</div><div className="panel-sub">All-time breakdown</div></div>
          </div>
          {catData.length === 0 ? (
            <div className="empty"><div className="empty-ico">📊</div><div className="empty-title">No data yet</div></div>
          ) : (
            <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={catData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={72} strokeWidth={0} paddingAngle={3}>
                    {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="legend" style={{ flex:1 }}>
                {catData.slice(0, 6).map((c, i) => (
                  <div className="leg-item" key={i}>
                    <div className="leg-l"><div className="leg-dot" style={{ background:c.color }} /><span className="leg-name">{c.name}</span></div>
                    <span className="leg-val" style={{ color:c.color }}>{sym}{c.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2 mb-md">
        {/* Daily bar */}
        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">Daily Spending</div><div className="panel-sub">This week</div></div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} barSize={28}>
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#9b6ef3" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill:'#3d4f70', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#3d4f70', fontSize:12 }} axisLine={false} tickLine={false} tickFormatter={v=>`${sym}${v}`} width={55} />
              <Tooltip content={<Tip sym={sym} />} />
              <Bar dataKey="amount" fill="url(#bg)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category progress */}
        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">Category Share</div><div className="panel-sub">% of total spending</div></div>
          </div>
          <div className="cat-bars">
            {catData.slice(0, 6).map((c, i) => (
              <div key={i}>
                <div className="cb-top">
                  <span className="cb-name">{c.emoji} {c.name}</span>
                  <div style={{ display:'flex', gap:'.75rem', alignItems:'center' }}>
                    <span className="cb-pct">{total ? ((c.value/total)*100).toFixed(1) : 0}%</span>
                    <span className="cb-amount" style={{ color:c.color }}>{sym}{c.value.toFixed(0)}</span>
                  </div>
                </div>
                <div className="cb-track"><div className="cb-fill" style={{ width:`${total ? (c.value/total)*100 : 0}%`, background:c.color }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="panel">
        <div className="panel-head">
          <div><div className="panel-title">Recent Transactions</div><div className="panel-sub">Latest 5 entries</div></div>
          <button className="panel-action" onClick={() => onNav('transactions')}>View all →</button>
        </div>
        <TxList expenses={expenses.slice(0, 5)} sym={sym} onDelete={onDelete} />
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// PAGE: TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────
function TransactionsPage({ expenses, sym, onDelete }) {
  const [search, setSearch]   = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [sort, setSort]       = useState('date-desc')

  const filtered = useMemo(() => {
    let list = [...expenses]
    if (filterCat !== 'All') list = list.filter(e => e.category === filterCat)
    if (search) list = list.filter(e =>
      (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
    )
    const [key, dir] = sort.split('-')
    list.sort((a, b) => {
      if (key === 'date')   return dir === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
      if (key === 'amount') return dir === 'desc' ? b.amount - a.amount : a.amount - b.amount
      return 0
    })
    return list
  }, [expenses, search, filterCat, sort])

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0)

  return (
    <>
      {/* Summary row */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1.25rem' }}>
        <div className="panel" style={{ flex:1, padding:'1rem 1.25rem' }}>
          <div className="sc-label">Showing</div>
          <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--em)' }}>{filtered.length}</div>
          <div className="sc-sub">transactions</div>
        </div>
        <div className="panel" style={{ flex:1, padding:'1rem 1.25rem' }}>
          <div className="sc-label">Total</div>
          <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--ro)' }}>{sym}{filteredTotal.toFixed(2)}</div>
          <div className="sc-sub">filtered sum</div>
        </div>
        <div className="panel" style={{ flex:1, padding:'1rem 1.25rem' }}>
          <div className="sc-label">Average</div>
          <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--vi)' }}>
            {sym}{filtered.length ? (filteredTotal / filtered.length).toFixed(2) : '0.00'}
          </div>
          <div className="sc-sub">per transaction</div>
        </div>
      </div>

      <div className="panel">
        {/* Filters */}
        <div className="filter-bar">
          <div className="search-wrap">
            <Search size={15} />
            <input className="search-input" placeholder="Search by name or category…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="All">All Categories</option>
            {CATS.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
          </select>
          <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </select>
        </div>

        <TxList expenses={filtered} sym={sym} onDelete={onDelete} />
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// PAGE: ANALYTICS
// ─────────────────────────────────────────────────────────────────────
function AnalyticsPage({ monthlyData, dailyData, catData, radarData, dayOfWeekData, top5, sym, total }) {
  return (
    <>
      {/* Monthly + Radar */}
      <div className="grid-2 mb-md">
        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">Monthly Overview</div><div className="panel-sub">7-month area chart</div></div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00e5a8" stopOpacity={.3} />
                  <stop offset="95%" stopColor="#00e5a8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill:'#3d4f70', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#3d4f70', fontSize:12 }} axisLine={false} tickLine={false} tickFormatter={v=>`${sym}${v}`} width={55} />
              <Tooltip content={<Tip sym={sym} />} />
              <Area type="monotone" dataKey="amount" stroke="#00e5a8" strokeWidth={2.5} fill="url(#ag2)" dot={{ r:4, fill:'#00e5a8', strokeWidth:0 }} activeDot={{ r:6, fill:'#00e5a8', strokeWidth:0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">Spending Radar</div><div className="panel-sub">Category balance</div></div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,.07)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'#3d4f70', fontSize:11 }} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar dataKey="amount" stroke="#9b6ef3" fill="#9b6ef3" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Day of week + Donut */}
      <div className="grid-2 mb-md">
        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">Day of Week</div><div className="panel-sub">When do you spend most?</div></div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayOfWeekData} barSize={32}>
              <defs>
                <linearGradient id="dow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#f9a825" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill:'#3d4f70', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#3d4f70', fontSize:12 }} axisLine={false} tickLine={false} tickFormatter={v=>`${sym}${v}`} width={55} />
              <Tooltip content={<Tip sym={sym} />} />
              <Bar dataKey="amount" fill="url(#dow)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">Category Split</div><div className="panel-sub">Donut breakdown</div></div>
          </div>
          {catData.length === 0 ? (
            <div className="empty"><div className="empty-ico">🍩</div><div className="empty-title">No data yet</div></div>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={catData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={0} paddingAngle={3}>
                      {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip content={<Tip sym={sym} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend" style={{ marginTop:'1rem' }}>
                {catData.map((c, i) => (
                  <div className="leg-item" key={i}>
                    <div className="leg-l"><div className="leg-dot" style={{ background:c.color }} /><span className="leg-name">{c.emoji} {c.name}</span></div>
                    <div style={{ display:'flex', gap:'.75rem' }}>
                      <span style={{ color:'var(--t3)', fontSize:'.75rem' }}>{total ? ((c.value/total)*100).toFixed(1) : 0}%</span>
                      <span className="leg-val" style={{ color:c.color }}>{sym}{c.value.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top 5 expenses */}
      <div className="panel">
        <div className="panel-head">
          <div><div className="panel-title">Top 5 Expenses</div><div className="panel-sub">Your biggest purchases</div></div>
        </div>
        {top5.length === 0 ? (
          <div className="empty"><div className="empty-ico">🏆</div><div className="empty-title">No expenses yet</div></div>
        ) : (
          <div className="top-expenses">
            {top5.map((e, i) => {
              const c = cat(e.category)
              return (
                <div className="top-exp-row" key={e.id}>
                  <div className={`top-exp-rank ${i === 0 ? 'gold' : ''}`}>{i + 1}</div>
                  <div className="tx-ico" style={{ background:c.dim, width:38, height:38, fontSize:'1rem' }}>{c.emoji}</div>
                  <div className="top-exp-body">
                    <div className="top-exp-name">{e.description || e.category}</div>
                    <div className="top-exp-meta">{e.category} · {new Date(e.date).toLocaleDateString('en',{ month:'short', day:'numeric', year:'numeric' })}</div>
                  </div>
                  <div className="top-exp-amount">{sym}{e.amount.toFixed(2)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// PAGE: BUDGET
// ─────────────────────────────────────────────────────────────────────
function BudgetPage({ expenses, budgets, setBudgets, sym, editBudget, setEditBudget, toast }) {
  const [inputVal, setInputVal] = useState('')

  const now = new Date()
  const monthSpend = useMemo(() => {
    const m = {}
    expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount })
    return m
  }, [expenses])

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0)
  const totalSpent  = Object.values(monthSpend).reduce((s, v) => s + v, 0)

  const openEdit = (name) => {
    setEditBudget(name)
    setInputVal(budgets[name] || 0)
  }

  const saveBudget = () => {
    if (!inputVal || isNaN(inputVal) || +inputVal < 0) return
    setBudgets(b => ({ ...b, [editBudget]: +inputVal }))
    toast(`Budget updated: ${editBudget} → ${sym}${(+inputVal).toFixed(0)}`, 'info')
    setEditBudget(null)
  }

  const CIRC = 54
  const CIRCUM = 2 * Math.PI * CIRC

  return (
    <>
      {/* Overall budget */}
      <div className="grid-2 mb-md" style={{ gridTemplateColumns:'2fr 1fr' }}>
        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">Monthly Budget Progress</div><div className="panel-sub">{now.toLocaleDateString('en',{month:'long',year:'numeric'})}</div></div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'1rem' }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.4rem' }}>
                <span style={{ fontSize:'.8125rem', color:'var(--t2)' }}>Spent</span>
                <span style={{ fontSize:'.8125rem', fontWeight:700, color: totalSpent > totalBudget ? 'var(--ro)' : 'var(--em)' }}>
                  {sym}{totalSpent.toFixed(2)} / {sym}{totalBudget.toFixed(2)}
                </span>
              </div>
              <div className="cb-track" style={{ height:10 }}>
                <div className="cb-fill" style={{
                  width:`${Math.min((totalSpent/totalBudget)*100,100)}%`,
                  background: totalSpent > totalBudget
                    ? 'linear-gradient(90deg,#fb4d6d,#e11d48)'
                    : 'linear-gradient(90deg,#00e5a8,#00b888)'
                }} />
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:'1.5rem' }}>
            <div><div className="sc-label">Total Budget</div><div style={{ fontSize:'1.25rem', fontWeight:800, color:'var(--em)' }}>{sym}{totalBudget.toFixed(0)}</div></div>
            <div><div className="sc-label">Spent</div><div style={{ fontSize:'1.25rem', fontWeight:800, color:'var(--ro)' }}>{sym}{totalSpent.toFixed(2)}</div></div>
            <div><div className="sc-label">Remaining</div><div style={{ fontSize:'1.25rem', fontWeight:800, color: totalBudget - totalSpent < 0 ? 'var(--ro)' : 'var(--vi)' }}>{sym}{(totalBudget - totalSpent).toFixed(2)}</div></div>
          </div>
        </div>
        <div className="panel" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:'.7rem', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.5rem' }}>Used</div>
          <div style={{ fontSize:'2.5rem', fontWeight:900, color: totalSpent > totalBudget ? 'var(--ro)' : 'var(--em)', letterSpacing:'-.04em' }}>
            {totalBudget ? ((totalSpent/totalBudget)*100).toFixed(0) : 0}%
          </div>
          <div style={{ fontSize:'.8rem', color:'var(--t3)', marginTop:'.25rem' }}>of budget</div>
        </div>
      </div>

      {/* Category cards */}
      <div className="budget-grid">
        {CATS.map(c => {
          const spent  = monthSpend[c.name] || 0
          const budget = budgets[c.name]    || 0
          const pct    = budget ? Math.min((spent / budget) * 100, 100) : 0
          const over   = spent > budget && budget > 0
          const offset = CIRCUM - (pct / 100) * CIRCUM

          return (
            <div className={`budget-card ${over ? 'over-budget' : ''}`} key={c.name}
              style={over ? { borderColor:'rgba(251,77,109,.25)' } : {}}>
              <div className="bc-head">
                <span className="bc-emoji">{c.emoji}</span>
                <div>
                  <div className="bc-name">{c.name}</div>
                  {over && <span style={{ fontSize:'.7rem', color:'var(--ro)', fontWeight:700 }}>⚠ Over budget!</span>}
                </div>
              </div>

              <div className="gauge-wrap">
                <svg className="gauge-svg" width={130} height={130} viewBox="0 0 130 130">
                  <circle className="gauge-bg" cx={65} cy={65} r={CIRC} strokeWidth={10} />
                  <circle className="gauge-fill" cx={65} cy={65} r={CIRC} strokeWidth={10}
                    stroke={over ? '#fb4d6d' : c.color}
                    strokeDasharray={CIRCUM}
                    strokeDashoffset={offset}
                  />
                </svg>
                <div className="gauge-text-wrap">
                  <div className="gauge-pct" style={{ color: over ? 'var(--ro)' : c.color }}>{pct.toFixed(0)}%</div>
                  <div className="gauge-label">used</div>
                </div>
              </div>

              <div className="bc-stats">
                <div><div className="bc-stat-label">Spent</div><div className="bc-stat-val" style={{ color:over?'var(--ro)':c.color }}>{sym}{spent.toFixed(2)}</div></div>
                <div style={{ textAlign:'right' }}><div className="bc-stat-label">Budget</div><div className="bc-stat-val">{sym}{budget.toFixed(0)}</div></div>
              </div>

              <button className="bc-edit" onClick={() => openEdit(c.name)}>✏️ Edit Budget</button>
            </div>
          )
        })}
      </div>

      {/* Edit budget modal */}
      {editBudget && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setEditBudget(null)}>
          <div className="modal" style={{ maxWidth:360 }}>
            <div className="modal-top">
              <div className="modal-title">{cat(editBudget)?.emoji} {editBudget} Budget</div>
              <button className="modal-close" onClick={() => setEditBudget(null)}><X size={15} /></button>
            </div>
            <div className="form-stack">
              <div className="field">
                <label>Monthly Budget ({sym})</label>
                <input type="number" min="0" step="1" value={inputVal} autoFocus
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveBudget()}
                />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setEditBudget(null)}>Cancel</button>
                <button className="btn-submit" onClick={saveBudget}>Save Budget</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// PAGE: SETTINGS
// ─────────────────────────────────────────────────────────────────────
function SettingsPage({ currency, setCurrency, onClear, onExport, expenses }) {
  return (
    <div className="settings-sections">
      {/* Currency */}
      <div className="settings-panel">
        <div className="sp-head">
          <div className="sp-title">💱 Currency</div>
          <div className="sp-sub">Choose your preferred display currency</div>
        </div>
        <div className="sp-body">
          <div className="currency-grid">
            {CURRENCIES.map(c => (
              <button key={c.code} className={`currency-btn ${currency === c.code ? 'active' : ''}`}
                onClick={() => setCurrency(c.code)}>
                {c.symbol} {c.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="settings-panel">
        <div className="sp-head">
          <div className="sp-title">📊 Data Summary</div>
          <div className="sp-sub">Overview of your stored expense data</div>
        </div>
        <div className="sp-body">
          {[
            ['Total transactions', expenses.length],
            ['Total categories used', new Set(expenses.map(e => e.category)).size],
            ['Total spent', `${CURRENCIES.find(c=>c.code===currency)?.symbol}${expenses.reduce((s,e)=>s+e.amount,0).toFixed(2)}`],
            ['Date range', expenses.length ? `${[...expenses].sort((a,b)=>a.date.localeCompare(b.date))[0].date} → ${[...expenses].sort((a,b)=>b.date.localeCompare(a.date))[0].date}` : '–'],
          ].map(([label, val]) => (
            <div className="setting-row" key={label}>
              <div><div className="sr-label">{label}</div></div>
              <div style={{ fontWeight:700, color:'var(--t1)' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data management */}
      <div className="settings-panel">
        <div className="sp-head">
          <div className="sp-title">🗂️ Data Management</div>
          <div className="sp-sub">Export or reset your expense data</div>
        </div>
        <div className="sp-body">
          <div className="setting-row">
            <div>
              <div className="sr-label">Export to CSV</div>
              <div className="sr-sub">Download all transactions as a spreadsheet</div>
            </div>
            <button className="export-btn" onClick={onExport}><Download size={14} style={{ display:'inline', marginRight:5 }} />Export CSV</button>
          </div>
          <div className="setting-row">
            <div>
              <div className="sr-label">Clear All Data</div>
              <div className="sr-sub">Permanently delete all transactions (cannot be undone)</div>
            </div>
            <button className="danger-btn" onClick={onClear}><RefreshCw size={14} style={{ display:'inline', marginRight:5 }} />Clear Data</button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="settings-panel">
        <div className="sp-head">
          <div className="sp-title">ℹ️ About Spendly</div>
        </div>
        <div className="sp-body">
          <div className="setting-row">
            <div className="sr-label">Version</div>
            <div style={{ fontWeight:700, color:'var(--em)' }}>2.0.0</div>
          </div>
          <div className="setting-row">
            <div className="sr-label">Storage</div>
            <div style={{ fontWeight:700, color:'var(--t2)' }}>Browser localStorage</div>
          </div>
          <div style={{ padding:'1rem', background:'var(--em-d)', borderRadius:'var(--r12)', border:'1px solid rgba(0,229,168,.15)' }}>
            <p style={{ fontSize:'.8rem', color:'var(--t2)', lineHeight:1.6 }}>
              Spendly stores all your data locally in your browser. No data is sent to any server. To back up your data, use the CSV export option above.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// SHARED: Transaction List
// ─────────────────────────────────────────────────────────────────────
function TxList({ expenses, sym, onDelete }) {
  if (!expenses.length) {
    return (
      <div className="empty">
        <div className="empty-ico">💸</div>
        <div className="empty-title">No transactions found</div>
        <div className="empty-sub">Try adjusting your filters or add a new expense</div>
      </div>
    )
  }
  return (
    <div className="tx-list">
      {expenses.map(e => {
        const c = cat(e.category)
        return (
          <div className="tx-row" key={e.id}>
            <div className="tx-ico" style={{ background:c.dim }}>{c.emoji}</div>
            <div className="tx-body">
              <div className="tx-name">
                {e.description || e.category}
                <span className="tx-tag" style={{ background:c.dim, color:c.color }}>{e.category}</span>
              </div>
              <div className="tx-meta">
                {new Date(e.date).toLocaleDateString('en',{ weekday:'short', month:'short', day:'numeric', year:'numeric' })}
              </div>
            </div>
            <div className="tx-right">
              <div className="tx-amount">-{sym}{e.amount.toFixed(2)}</div>
              <button className="tx-del" onClick={() => onDelete(e.id, e.description || e.category)} title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
