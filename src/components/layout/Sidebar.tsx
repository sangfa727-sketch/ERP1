'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

const MENU_GROUPS = [
  {
    groupKey: null,
    items: [
      { href: '/dashboard',             icon: '📊', key: 'dashboard' },
      { href: '/pos',                   icon: '🛒', key: 'pos' },
    ],
  },
  {
    groupKey: 'stock',
    items: [
      { href: '/admin/products',        icon: '📦', key: 'products' },
      { href: '/inventory',             icon: '🏭', key: 'inventory' },
      { href: '/grn',                   icon: '📥', key: 'grn' },
    ],
  },
  {
    groupKey: 'contacts',
    items: [
      { href: '/customers',             icon: '👤', key: 'customers' },
      { href: '/suppliers',             icon: '🏪', key: 'suppliers' },
      { href: '/employees',            icon: '👥', key: 'employees' },
    ],
  },
  {
    groupKey: 'ops',
    items: [
      { href: '/purchases',             icon: '🛍️', key: 'purchases' },
      { href: '/shipments',             icon: '🚚', key: 'shipments' },
      { href: '/damaged-stock',          icon: '🗑️', key: 'damaged_stock' },
    ],
  },
  {
    groupKey: 'finance',
    items: [
      { href: '/finance/bank-accounts', icon: '🏦', key: 'bank_accounts' },
      { href: '/finance/ar',            icon: '📨', key: 'ar' },
      { href: '/finance/ap',            icon: '📤', key: 'ap' },
      { href: '/expenses',              icon: '💸', key: 'expenses' },
    ],
  },
  {
    groupKey: null,
    items: [
      { href: '/sales-return',           icon: '↩️', key: 'sales_return' },
      { href: '/reports/sales',         icon: '📈', key: 'reports' },
      { href: '/settings',              icon: '⚙️', key: 'settings' },
    ],
  },
]

export default function Sidebar({ onClose }: { onClose?: () => void } = {}) {
  const pathname = usePathname()
  const supabase = createClient()
  const { t }    = useI18n()
  const tAny     = t as any

  const [collapsed,      setCollapsed]      = useState(false)
  const [permissions,    setPermissions]    = useState<string[] | null>(null)
  const [staffName,      setStaffName]      = useState('')
  const [companyName,    setCompanyName]    = useState('1Admin')
  const [companyLogo,    setCompanyLogo]    = useState('')
  const [hiddenMenuKeys, setHiddenMenuKeys] = useState<string[]>([])

  useEffect(() => {
    const check = () => {
      const s = localStorage.getItem('staff_session')
      if (!s) return
      try {
        const sess = JSON.parse(s)
        if (sess.expiresAt && Date.now() > sess.expiresAt) {
          localStorage.removeItem('staff_session')
          window.location.href = '/staff-login'
        }
      } catch { localStorage.removeItem('staff_session') }
    }
    check()
    const timer = setInterval(check, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadPerms = async () => {
      const staffSession = localStorage.getItem('staff_session')
      if (staffSession) {
        const sess = JSON.parse(staffSession)
        setStaffName(sess.name || '')
        if (sess.permissions?.includes('all')) { setPermissions(null); return }
        const { data: fp } = await supabase.from('profiles').select('permissions,role').eq('id', sess.id).maybeSingle()
        if (fp?.role === 'Admin') { setPermissions(null); return }
        setPermissions((fp?.permissions as string[]) || sess.permissions || [])
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('role,role_id,permissions').eq('auth_user_id', user.id).maybeSingle()
      if (!profile) return
      if (profile.role === 'Admin') { setPermissions(null); return }
      if (profile.permissions) { setPermissions(profile.permissions as string[]); return }
      if (profile.role_id) {
        const { data: rd } = await supabase.from('roles').select('permissions').eq('id', profile.role_id).maybeSingle()
        if (rd?.permissions) { setPermissions(rd.permissions as string[]); return }
      }
      setPermissions(null)
    }
    loadPerms()

    const loadHidden = () => {
      try { const h = localStorage.getItem('hidden_menus'); if (h) setHiddenMenuKeys(JSON.parse(h)) } catch {}
    }
    loadHidden()
    window.addEventListener('menu-updated', loadHidden)

    const fetchCompany = async () => {
      try {
        let companyId: string | null = null
        const staffSession = localStorage.getItem('staff_session')
        if (staffSession) {
          const sess = JSON.parse(staffSession)
          const { data: p } = await supabase.from('profiles').select('company_id').eq('id', sess.id).maybeSingle()
          companyId = p?.company_id
        } else {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: p } = await supabase.from('profiles').select('company_id').eq('auth_user_id', user.id).maybeSingle()
            companyId = p?.company_id
          }
        }
        const { data } = await (companyId
          ? supabase.from('companies').select('name,logo_url').eq('id', companyId).maybeSingle()
          : supabase.from('companies').select('name,logo_url').maybeSingle())
        if (data?.name)     setCompanyName(data.name)
        if (data?.logo_url) setCompanyLogo(data.logo_url)
      } catch {}
    }
    fetchCompany()

    return () => window.removeEventListener('menu-updated', loadHidden)
  }, [])

  const can = (key: string) =>
    (permissions === null || permissions.includes(key)) && !hiddenMenuKeys.includes(key)

  const GROUP_LABELS: Record<string, string> = {
    stock:    tAny['inventory'] || 'Stock',
    contacts: tAny['customers'] || 'Contacts',
    ops:      tAny['purchases'] || 'Operations',
    finance:  tAny['finance']   || 'Finance',
  }

  const logout = async () => {
    const staffSession = localStorage.getItem('staff_session')
    if (staffSession) {
      localStorage.removeItem('staff_session')
      document.cookie = 'staff_session=; path=/; max-age=0'
      window.location.href = '/staff-login'
    } else {
      const { createClient: cc } = await import('@/lib/supabase')
      await cc().auth.signOut()
      window.location.href = '/login'
    }
  }

  return (
    <div
      className={`${collapsed ? 'w-16' : 'w-56'} h-screen flex flex-col transition-all duration-300 sticky top-0`}
      style={{ backgroundColor: 'var(--color-sidebar, #111827)' }}>

      <div className="flex items-center justify-between px-3 pt-4 pb-3"
        style={{ borderBottom: '1px solid var(--sidebar-border, #1f2937)' }}>
        {!collapsed ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {companyLogo ? (
              <img src={companyLogo} alt="logo" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shadow flex-shrink-0"/>
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: 'var(--sidebar-hover-bg, #374151)' }}>🏢</div>
            )}
            <span className="font-bold text-sm truncate" style={{ color: 'var(--sidebar-title, #FFFFFF)' }}>{companyName}</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'var(--sidebar-hover-bg, #374151)' }}>
            {companyLogo ? <img src={companyLogo} alt="logo" className="w-6 h-6 object-contain rounded"/> : <span className="text-sm">🏢</span>}
          </div>
        )}
        {onClose && (
          <button onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ml-1 md:hidden"
            style={{ color: 'var(--sidebar-icon, #6B7280)' }}>
            <span className="text-lg leading-none">✕</span>
          </button>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded-md items-center justify-center flex-shrink-0 ml-1 hidden md:flex"
          style={{ color: 'var(--sidebar-icon, #6B7280)' }}>
          <span className="text-xs">{collapsed ? '▶' : '◀'}</span>
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto px-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--sidebar-border) transparent', overscrollBehavior: 'contain', minHeight: 0 }}>
        {MENU_GROUPS.map((group, gi) => {
          const visible = group.items.filter(item => can(item.key))
          if (visible.length === 0) return null
          return (
            <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
              {group.groupKey && !collapsed && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest select-none"
                  style={{ color: 'var(--sidebar-group-text, #4B5563)' }}>
                  {GROUP_LABELS[group.groupKey] || group.groupKey}
                </p>
              )}
              {group.groupKey && collapsed && (
                <div className="my-2 mx-3 h-px" style={{ backgroundColor: 'var(--sidebar-border, #1f2937)' }}/>
              )}
              {visible.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const label  = tAny[item.key] || item.key
                return (
                  <Link key={item.href} href={item.href} title={collapsed ? label : undefined}
                    className="flex items-center rounded-xl mb-0.5 transition-all duration-150"
                    style={{
                      padding:         collapsed ? '9px' : '8px 10px',
                      justifyContent:  collapsed ? 'center' : 'flex-start',
                      gap:             collapsed ? '0' : '9px',
                      backgroundColor: active ? 'var(--sidebar-active-bg, #0D9488)' : 'transparent',
                      color:           active ? 'var(--sidebar-active-text, #FFFFFF)' : 'var(--sidebar-text, #9CA3AF)',
                      fontWeight:      active ? '600' : '400',
                      fontSize:        '13.5px',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        const el = e.currentTarget as HTMLElement
                        el.style.backgroundColor = 'var(--sidebar-hover-bg, #1f2937)'
                        el.style.color = 'var(--sidebar-hover-text, #FFFFFF)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        const el = e.currentTarget as HTMLElement
                        el.style.backgroundColor = 'transparent'
                        el.style.color = 'var(--sidebar-text, #9CA3AF)'
                      }
                    }}>
                    <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="px-2 py-3" style={{ borderTop: '1px solid var(--sidebar-border, #1f2937)' }}>
        {!collapsed ? (
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: 'var(--sidebar-hover-bg, #374151)', color: 'var(--sidebar-title, #fff)' }}>
              {staffName ? staffName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-title, #FFFFFF)' }}>
                {staffName || 'Admin'}
              </p>
              <button onClick={logout} className="text-xs" style={{ color: '#f87171' }}>
                {t.logout || 'Logout'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button onClick={logout} title={t.logout || 'Logout'} className="text-base">🚪</button>
          </div>
        )}
      </div>
    </div>
  )
}
