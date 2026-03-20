'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { useI18n } from '@/lib/i18n'

interface TxnItem {
  product_id: string
  quantity: number
  unit_price: number
  product?: { name: string; unit: string }
}

interface Transaction {
  id: string
  total_amount: number
  amount_received: number
  created_at: string
  customer_id: string | null
  items?: TxnItem[]
}

type FilterMode = 'all' | 'cash' | 'credit'

export default function SalesReportPage() {
  const { t } = useI18n()
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const supabase = createClient()

  const fetchSales = async (selectedDate: string) => {
    setLoading(true)
    const start = selectedDate + 'T00:00:00'
    const end = selectedDate + 'T23:59:59'
    const { data } = await supabase
      .from('transactions')
      .select('id,total_amount,amount_received,created_at,customer_id,items:transaction_items(product_id,quantity,unit_price,product:product_id(name,unit))')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
    setTxns((data as any) || [])
    setLoading(false)
  }

  useEffect(() => { fetchSales(date) }, [date])

  const totalSales = txns.reduce((s, x) => s + Number(x.total_amount), 0)
  const totalReceived = txns.reduce((s, x) => s + Number(x.amount_received), 0)
  const totalCredit = totalSales - totalReceived

  // cash txns = amount_received >= total_amount
  // credit txns = amount_received < total_amount
  const cashTxns = txns.filter(x => Number(x.amount_received) >= Number(x.total_amount))
  const creditTxns = txns.filter(x => Number(x.amount_received) < Number(x.total_amount))

  const totalCashSales = cashTxns.reduce((s, x) => s + Number(x.total_amount), 0)
  const totalCreditSales = creditTxns.reduce((s, x) => s + Number(x.total_amount), 0)
  const totalCreditBalance = creditTxns.reduce((s, x) => s + (Number(x.total_amount) - Number(x.amount_received)), 0)

  const filtered = filterMode === 'cash' ? cashTxns
    : filterMode === 'credit' ? creditTxns
    : txns

  const filteredTotal = filtered.reduce((s, x) => s + Number(x.total_amount), 0)
  const filteredReceived = filtered.reduce((s, x) => s + Number(x.amount_received), 0)
  const filteredBalance = filteredTotal - filteredReceived

  const handleCardClick = (mode: FilterMode) => {
    setFilterMode(prev => prev === mode ? 'all' : mode)
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">📈 {t.page_reports}</h1>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">{t.rep_date_label}</label>
          <input type="date" value={date}
            onChange={e => { setDate(e.target.value); setFilterMode('all') }}
            className="p-2 border rounded-lg text-sm" />
          {filterMode !== 'all' && (
            <button onClick={() => setFilterMode('all')}
              className="text-xs text-blue-600 hover:underline px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
              {t.rep_filter_all}
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* Total Sales */}
          <button onClick={() => handleCardClick('all')}
            className={`rounded-xl p-4 text-left transition-all border ${
              filterMode === 'all'
                ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-400'
                : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
            }`}>
            <div className="text-xs text-blue-600 mb-1">{t.rep_total_sales}</div>
            <div className="text-2xl font-bold text-blue-700">K {totalSales.toLocaleString()}</div>
            <div className="text-xs text-blue-500 mt-1">{txns.length} {t.rep_transactions}</div>
            {filterMode === 'all' && (
              <div className="mt-2 space-y-0.5">
                <div className="text-xs text-blue-600">{t.rep_cash_tag}: K {totalCashSales.toLocaleString()}</div>
                <div className="text-xs text-blue-600">{t.rep_credit_tag}: K {totalCreditSales.toLocaleString()}</div>
              </div>
            )}
          </button>

          {/* Cash Received */}
          <button onClick={() => handleCardClick('cash')}
            className={`rounded-xl p-4 text-left transition-all border ${
              filterMode === 'cash'
                ? 'bg-green-100 border-green-400 ring-2 ring-green-400'
                : 'bg-green-50 border-green-200 hover:bg-green-100'
            }`}>
            <div className="text-xs text-green-600 mb-1">{t.rep_received}</div>
            <div className="text-2xl font-bold text-green-700">K {totalReceived.toLocaleString()}</div>
            <div className="text-xs text-green-500 mt-1">{cashTxns.length} {t.rep_transactions}</div>
            {filterMode === 'cash' && (
              <div className="mt-2 text-xs text-green-600">{t.rep_filter_cash}</div>
            )}
          </button>

          {/* Credit Balance */}
          <button onClick={() => handleCardClick('credit')}
            className={`rounded-xl p-4 text-left transition-all border ${
              filterMode === 'credit'
                ? 'bg-red-100 border-red-400 ring-2 ring-red-400'
                : 'bg-red-50 border-red-200 hover:bg-red-100'
            }`}>
            <div className="text-xs text-red-600 mb-1">{t.rep_credit}</div>
            <div className="text-2xl font-bold text-red-700">K {totalCreditBalance.toLocaleString()}</div>
            <div className="text-xs text-red-500 mt-1">{creditTxns.length} {t.rep_transactions}</div>
            {filterMode === 'credit' && (
              <div className="mt-2 text-xs text-red-600">{t.rep_filter_credit}</div>
            )}
          </button>
        </div>

        {/* Active filter badge */}
        {filterMode !== 'all' && (
          <div className="mb-3">
            <span className={`text-sm font-medium px-3 py-1 rounded-full border ${
              filterMode === 'cash' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'
            }`}>
              🔍 {filterMode === 'cash' ? t.rep_cash_tag : t.rep_credit_tag}
            </span>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {loading ? <p className="text-center p-8 text-gray-400">{t.loading}</p>
          : filtered.length === 0 ? <p className="text-center p-8 text-gray-400">{t.rep_no_data}</p>
          : filtered.map(txn => {
            const isCash = Number(txn.amount_received) >= Number(txn.total_amount)
            const balance = Number(txn.total_amount) - Number(txn.amount_received)
            return (
              <div key={txn.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${isCash?'border-green-400':'border-orange-400'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isCash?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}`}>
                      {isCash ? t.rep_cash_tag : t.rep_credit_tag}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{new Date(txn.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</p>
                  </div>
                  <p className="font-bold text-gray-800">K {Number(txn.total_amount).toLocaleString()}</p>
                </div>
                <div className="space-y-0.5 mb-2">
                  {(txn.items||[]).map((item,i) => (
                    <div key={i} className="flex items-center gap-1 text-xs">
                      <span className="font-medium text-gray-800">{(item.product as any)?.name||'-'}</span>
                      <span className="text-gray-400">×</span>
                      <span className="text-blue-700 font-bold">{item.quantity} {(item.product as any)?.unit||'ခု'}</span>
                      <span className="text-gray-400">@ K {Number(item.unit_price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">{t.rep_col_received}: K {Number(txn.amount_received).toLocaleString()}</span>
                  {balance>0 && <span className="text-red-500">{t.rep_credit}: K {balance.toLocaleString()}</span>}
                </div>
              </div>
            )
          })}
          {filtered.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-sm font-bold">
                <span>{t.rep_total_label} ({filtered.length})</span>
                <span>K {filteredTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-green-600">
                <span>{t.rep_col_received}</span>
                <span>K {filteredReceived.toLocaleString()}</span>
              </div>
              {filteredBalance>0&&<div className="flex justify-between text-xs text-red-500">
                <span>{t.rep_credit}</span>
                <span>K {filteredBalance.toLocaleString()}</span>
              </div>}
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-600">{t.rep_col_time}</th>
                <th className="text-left p-3 font-semibold text-gray-600">{t.rep_col_items}</th>
                <th className="text-right p-3 font-semibold text-gray-600">{t.rep_col_sales}</th>
                <th className="text-right p-3 font-semibold text-gray-600">{t.rep_col_received}</th>
                <th className="text-right p-3 font-semibold text-gray-600">{t.rep_credit}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center p-8 text-gray-400">{t.loading}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-8 text-gray-400">{t.rep_no_data}</td></tr>
              ) : filtered.map(txn => {
                const isCash = Number(txn.amount_received) >= Number(txn.total_amount)
                const balance = Number(txn.total_amount) - Number(txn.amount_received)
                return (
                  <tr key={txn.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-gray-600 text-xs">
                      <div>{new Date(txn.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${isCash?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}`}>
                        {isCash ? t.rep_cash_tag : t.rep_credit_tag}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {(txn.items||[]).map((item,i) => (
                          <div key={i} className="flex items-center gap-1 text-xs">
                            <span className="font-medium text-gray-800">{(item.product as any)?.name||'-'}</span>
                            <span className="text-gray-400">×</span>
                            <span className="text-blue-700 font-bold">{item.quantity} {(item.product as any)?.unit||'ခု'}</span>
                            <span className="text-gray-400">@</span>
                            <span className="text-gray-600">K {Number(item.unit_price).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold">K {Number(txn.total_amount).toLocaleString()}</td>
                    <td className="p-3 text-right text-green-600">K {Number(txn.amount_received).toLocaleString()}</td>
                    <td className="p-3 text-right text-red-500">{balance>0?`K ${balance.toLocaleString()}`:'-'}</td>
                  </tr>
                )
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-gray-50 border-t font-bold">
                <tr>
                  <td className="p-3" colSpan={2}>{t.rep_total_label} ({filtered.length} {t.rep_transactions})</td>
                  <td className="p-3 text-right">K {filteredTotal.toLocaleString()}</td>
                  <td className="p-3 text-right text-green-600">K {filteredReceived.toLocaleString()}</td>
                  <td className="p-3 text-right text-red-500">{filteredBalance>0?`K ${filteredBalance.toLocaleString()}`:'-'}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
