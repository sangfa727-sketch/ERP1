'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todaySales: 0, todayCount: 0,
    monthSales: 0, monthProfit: 0,
    totalProducts: 0, lowStock: 0,
    ar: 0, ap: 0, monthExpenses: 0,
  })
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const supabase = createClient()
  const { t } = useI18n()

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const [
        { data: todayTxns }, { data: monthTxns }, { data: monthItems },
        { data: prods }, { data: lowProds }, { data: contacts }, { data: expenses },
      ] = await Promise.all([
        supabase.from('transactions').select('total_amount').gte('created_at', today),
        supabase.from('transactions').select('total_amount').gte('created_at', monthStart),
        supabase.from('transaction_items').select('product_id,quantity,unit_price,cost_at_sale,products(name)').gte('created_at', monthStart),
        supabase.from('products').select('stock_qty,reorder_level').eq('is_deleted', false),
        supabase.from('products').select('id,name,stock_qty,reorder_level').eq('is_deleted', false).lt('stock_qty', 10).order('stock_qty').limit(5),
        supabase.from('contacts').select('contact_type,current_balance').eq('is_deleted', false),
        supabase.from('expenses').select('amount').gte('created_at', monthStart),
      ])
      const todaySales = (todayTxns||[]).reduce((s,t)=>s+Number(t.total_amount),0)
      const todayCount = (todayTxns||[]).length
      const monthSales = (monthTxns||[]).reduce((s,t)=>s+Number(t.total_amount),0)
      const monthExpenses = (expenses||[]).reduce((s,e)=>s+Number(e.amount),0)
      const cogs = (monthItems||[]).reduce((s,i)=>s+(Number(i.cost_at_sale)*Number(i.quantity)),0)
      const monthProfit = monthSales - cogs
      const totalProducts = (prods||[]).length
      const lowStock = (prods||[]).filter(p=>Number(p.stock_qty)<=Number(p.reorder_level||5)).length
      const ar = (contacts||[]).filter(c=>['Customer','Both'].includes(c.contact_type)).reduce((s,c)=>s+Number(c.current_balance||0),0)
      const ap = (contacts||[]).filter(c=>['Supplier','Both'].includes(c.contact_type)).reduce((s,c)=>s+Number(c.current_balance||0),0)
      const prodMap: any = {}
      ;(monthItems||[]).forEach((i:any)=>{
        const pid = i.product_id
        if(!prodMap[pid]) prodMap[pid]={name:i.products?.name||pid,qty:0,revenue:0}
        prodMap[pid].qty+=Number(i.quantity)
        prodMap[pid].revenue+=Number(i.unit_price)*Number(i.quantity)
      })
      const top5 = Object.values(prodMap).sort((a:any,b:any)=>b.revenue-a.revenue).slice(0,5)
      setStats({todaySales,todayCount,monthSales,monthProfit,totalProducts,lowStock,ar,ap,monthExpenses})
      setTopProducts(top5)
      setLowStockItems(lowProds||[])
      setLoading(false)
    }
    load()
  }, [])

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})

  const kpiCards = [
    { label: t.today_revenue, sub: `${stats.todayCount} ${t.transactions}`, value: `K ${stats.todaySales.toLocaleString()}`, color: '#10b981', bg: '#ecfdf5', href: '/reports/sales' },
    { label: t.monthly_sales, sub: t.this_month, value: `K ${stats.monthSales.toLocaleString()}`, color: '#3b82f6', bg: '#eff6ff', href: '/reports/sales' },
    { label: t.gross_profit, sub: 'After COGS', value: `K ${stats.monthProfit.toLocaleString()}`, color: stats.monthProfit >= 0 ? '#10b981' : '#ef4444', bg: stats.monthProfit >= 0 ? '#ecfdf5' : '#fef2f2', href: '/reports/sales' },
    { label: t.expenses_label, sub: t.this_month, value: `K ${stats.monthExpenses.toLocaleString()}`, color: '#f59e0b', bg: '#fffbeb', href: '/expenses' },
    { label: t.receivables, sub: 'Customers owe', value: `K ${stats.ar.toLocaleString()}`, color: '#06b6d4', bg: '#ecfeff', href: '/customers' },
    { label: t.payables, sub: 'Owe suppliers', value: `K ${stats.ap.toLocaleString()}`, color: '#f97316', bg: '#fff7ed', href: '/suppliers' },
    { label: t.total_products, sub: 'Active SKUs', value: stats.totalProducts.toString(), color: '#8b5cf6', bg: '#f5f3ff', href: '/admin/products' },
    { label: t.low_stock, sub: 'Needs reorder', value: stats.lowStock > 0 ? `${stats.lowStock} items` : 'All clear', color: stats.lowStock > 0 ? '#ef4444' : '#10b981', bg: stats.lowStock > 0 ? '#fef2f2' : '#ecfdf5', href: '/inventory' },
  ]

  return (
    <AppLayout>
      <div className="min-h-screen p-4 md:p-6" style={{backgroundColor:'var(--color-bg)', fontFamily:'Inter, system-ui, sans-serif'}}>

        {/* Header */}
        <div style={{backgroundColor:'var(--color-card)', borderBottom:'1px solid var(--color-border)'}} className="px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              <span className="text-xs text-gray-400 font-medium">{t.live}</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_,i)=>(
                <div key={i} className="h-28 rounded-xl animate-pulse" style={{backgroundColor:'#e2e8f0'}}/>
              ))}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {kpiCards.map((card, i) => (
                  <Link key={i} href={card.href}>
                    <div className="rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      style={{backgroundColor:'var(--color-card)',border:'1px solid var(--color-border)'}}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {card.label}
                        </span>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: card.color}}></span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
                        {card.value}
                      </div>
                      <div className="text-xs text-gray-400">{card.sub}</div>
                      <div className="mt-3 h-1 rounded-full" style={{backgroundColor: card.bg}}>
                        <div className="h-1 rounded-full w-full" style={{backgroundColor: card.color, opacity:0.3}}/>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Top Products */}
                <div className="rounded-xl p-6" style={{backgroundColor:'var(--color-card)',border:'1px solid var(--color-border)'}}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-gray-900" style={{color:"var(--color-text)"}}>{t.top_products}</h2>
                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full" style={{border:'1px solid var(--color-border)'}}>
                      This month
                    </span>
                  </div>
                  {topProducts.length === 0 ? (
                    <div className="text-center py-10 text-gray-300 text-sm">No sales data yet</div>
                  ) : (
                    <div className="space-y-4">
                      {(topProducts as any[]).map((p:any, i:number) => {
                        const pct = Math.round((p.revenue / (topProducts[0] as any).revenue) * 100)
                        const colors = ['#f59e0b','#94a3b8','#cd7c32','#6b7280','#6b7280']
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{backgroundColor: colors[i], fontSize:'10px'}}>
                                  {i+1}
                                </span>
                                <span className="text-sm font-medium text-gray-700 truncate max-w-[160px]">{p.name}</span>
                              </div>
                              <div className="text-right ml-2 flex-shrink-0">
                                <div className="text-sm font-bold text-gray-900" style={{color:"var(--color-text)"}}>K {Number(p.revenue).toLocaleString()}</div>
                                <div className="text-xs text-gray-400">{p.qty} units</div>
                              </div>
                            </div>
                            <div className="w-full rounded-full h-1.5" style={{backgroundColor:'var(--color-border)'}}>
                              <div className="h-1.5 rounded-full transition-all duration-500"
                                style={{width:`${pct}%`, backgroundColor: colors[i]}}/>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Stock Alerts */}
                <div className="rounded-xl p-6" style={{backgroundColor:'var(--color-card)',border:'1px solid var(--color-border)'}}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-gray-900" style={{color:"var(--color-text)"}}>{t.stock_alerts}</h2>
                    <Link href="/inventory"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full transition-colors"
                      style={{border:'1px solid #bfdbfe'}}>
                      View all
                    </Link>
                  </div>
                  {lowStockItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-emerald-600"
                        style={{backgroundColor:'#ecfdf5', border:'2px solid #6ee7b7'}}>
                        OK
                      </div>
                      <p className="text-emerald-600 font-semibold text-sm">All stock levels healthy</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lowStockItems.map((p:any) => (
                        <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-lg"
                          style={{
                            backgroundColor: Number(p.stock_qty) <= 0 ? '#fef2f2' : '#fffbeb',
                            border: `1px solid ${Number(p.stock_qty) <= 0 ? '#fecaca' : '#fde68a'}`,
                          }}>
                          <span className="text-sm font-medium text-gray-800 truncate flex-1">{p.name}</span>
                          <span className="ml-3 text-xs font-bold px-2.5 py-1 rounded-full text-white flex-shrink-0"
                            style={{backgroundColor: Number(p.stock_qty) <= 0 ? '#ef4444' : '#f59e0b'}}>
                            {Number(p.stock_qty) <= 0 ? 'OUT' : `${p.stock_qty} left`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
