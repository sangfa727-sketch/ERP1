'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toEnglishNumber } from '@/lib/utils'
import AppLayout from '@/components/layout/AppLayout'
import { useI18n } from '@/lib/i18n'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Contact {
  id: string; contact_name: string; contact_type: string
  phone: string; address: string; current_balance: number
  credit_limit: number; credit_days: number
  internal_remarks: string; is_blacklisted: boolean
}

const EMPTY = {
  id: '', contact_name: '', contact_type: 'Customer', phone: '',
  address: '', current_balance: 0, credit_limit: 0, credit_days: 0,
  internal_remarks: '', is_blacklisted: false
}

export default function CustomersPage() {
  const { t } = useI18n()
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showBlacklist, setShowBlacklist] = useState(false)
  const [modal, setModal] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmState, setConfirmState] = useState<{open:boolean;msg:string;cb:()=>void}>({open:false,msg:'',cb:()=>{}})
  const showConfirm = (msg: string, cb: ()=>void) => setConfirmState({open:true,msg,cb})
  const hideConfirm = () => setConfirmState(s=>({...s,open:false}))

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase.from('contacts')
      .select('*').eq('contact_type','Customer').eq('is_deleted',false).order('contact_name')
    setContacts(data || [])
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const handleSave = async () => {
    if (!modal.contact_name) { setMsg('နာမည် ထည့်ပါ'); return }
    setSaving(true); setMsg('')
    const { data: profileData } = await supabase.from('profiles').select('company_id')
    const companyId = profileData?.[0]?.company_id
    if (!companyId) { setMsg('Company မရှိပါ'); setSaving(false); return }
    const payload = {
      contact_name: modal.contact_name, contact_type: 'Customer',
      phone: modal.phone || null, address: modal.address || null,
      credit_limit: Number(modal.credit_limit || 0),
      credit_days: Number(modal.credit_days || 0),
      internal_remarks: modal.internal_remarks || null,
      is_blacklisted: modal.is_blacklisted || false,
    }
    if (modal.id) {
      const { error } = await supabase.from('contacts').update(payload).eq('id', modal.id)
      if (error) { setMsg('❌ ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('contacts').insert({ ...payload, company_id: companyId })
      if (error) { setMsg('❌ ' + error.message); setSaving(false); return }
    }
    setMsg('✅ ' + (t as any).saved || '✅ သိမ်းပြီး')
    await fetchAll()
    setTimeout(() => { setModal(null); setMsg('') }, 600)
    setSaving(false)
  }

  const toggleBlacklist = (c: Contact) => {
    const action = c.is_blacklisted ? 'Blacklist ဖြုတ်' : 'Blacklist ထည့်'
    showConfirm(c.contact_name + ' ကို ' + action + ' မှာ သေချာလား?', async () => {
      await supabase.from('contacts').update({ is_blacklisted: !c.is_blacklisted }).eq('id', c.id)
      await fetchAll()
    })
  }

  const handleDelete = (id: string) => {
    showConfirm((t as any).cust_delete_confirm || 'Customer ဖျက်မှာ သေချာလား?', async () => {
      await supabase.from('contacts').update({ is_deleted: true }).eq('id', id)
      await fetchAll()
    })
  }

  const filtered = contacts
    .filter(c => showBlacklist ? c.is_blacklisted : true)
    .filter(c => c.contact_name.toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search))

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">{`👤 ${t.page_customers}`}</h1>
          <button onClick={() => setModal({...EMPTY})}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">{t.btn_add}</button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <input type="text" placeholder={(t as any).search_placeholder || t.search_placeholder} value={search}
            onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[150px] p-2 border rounded-lg text-sm" />
          <button onClick={() => setShowBlacklist(!showBlacklist)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border ${showBlacklist ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-600'}`}>
            🚫 Blacklist {showBlacklist ? '(ပြနေသည်)' : ''}
          </button>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {loading ? <p className="text-center text-gray-400 py-8">{t.loading}</p>
          : filtered.length === 0 ? <p className="text-center text-gray-400 py-8">{t.no_data}</p>
          : filtered.map(c => (
            <div key={c.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${c.is_blacklisted ? 'border-red-500' : Number(c.current_balance) > 0 ? 'border-yellow-400' : 'border-green-400'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-gray-800">{c.contact_name}</p>
                  <p className="text-xs text-gray-500">{c.phone || '-'}</p>
                </div>
                {c.is_blacklisted && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🚫 Blacklist</span>}
              </div>
              <div className="flex justify-between items-center text-sm mb-3">
                <div>
                  <span className="text-xs text-gray-500">{t.col_balance} </span>
                  <span className={`font-bold ${Number(c.current_balance) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    K {Number(c.current_balance).toLocaleString()}
                  </span>
                </div>
                {c.credit_limit > 0 && (
                  <div className="text-xs text-gray-500">
                    Limit: K {Number(c.credit_limit).toLocaleString()}
                    {c.credit_days > 0 && <span className="ml-1">/ {c.credit_days} ရက်</span>}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal({...c})} className="flex-1 py-1.5 bg-yellow-500 text-white rounded-lg text-xs">{t.btn_edit}</button>
                <button onClick={() => toggleBlacklist(c)}
                  className={`flex-1 py-1.5 rounded-lg text-xs ${c.is_blacklisted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {c.is_blacklisted ? '✅ ဖြုတ်' : '🚫 Blacklist'}
                </button>
                <button onClick={() => handleDelete(c.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs">{t.btn_delete}</button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-600">{t.col_name}</th>
                <th className="text-left p-3 font-semibold text-gray-600">{t.col_phone}</th>
                <th className="text-left p-3 font-semibold text-gray-600">{t.col_address}</th>
                <th className="text-right p-3 font-semibold text-gray-600">{t.col_balance}</th>
                <th className="text-right p-3 font-semibold text-gray-600">Credit Limit</th>
                <th className="text-center p-3 font-semibold text-gray-600">{t.col_action}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr><td colSpan={6} className="text-center p-8 text-gray-400">{t.loading}</td></tr>)
              : filtered.length === 0 ? (<tr><td colSpan={6} className="text-center p-8 text-gray-400">{t.no_data}</td></tr>)
              : filtered.map(c => (
                <tr key={c.id} className={`border-b hover:bg-gray-50 ${c.is_blacklisted ? 'bg-red-50' : ''}`}>
                  <td className="p-3 font-medium">
                    {c.contact_name}
                    {c.is_blacklisted && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🚫</span>}
                  </td>
                  <td className="p-3 text-gray-600">{c.phone || '-'}</td>
                  <td className="p-3 text-gray-500 text-xs">{c.address || '-'}</td>
                  <td className={`p-3 text-right font-bold ${Number(c.current_balance) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    K {Number(c.current_balance).toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-gray-600">
                    {c.credit_limit > 0 ? 'K ' + Number(c.credit_limit).toLocaleString() : '-'}
                    {c.credit_days > 0 && <span className="text-xs text-gray-400 ml-1">/{c.credit_days}ရက်</span>}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setModal({...c})} className="px-2 py-1 bg-yellow-500 text-white rounded text-xs">{t.btn_edit}</button>
                      <button onClick={() => toggleBlacklist(c)}
                        className={`px-2 py-1 rounded text-xs ${c.is_blacklisted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                        {c.is_blacklisted ? 'ဖြုတ်' : '🚫'}
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">{t.btn_delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-xl p-5 w-full md:max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{modal.id ? '✏️ ' + t.btn_edit : '+ ' + t.page_customers}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.col_name} *</label>
                <input type="text" value={modal.contact_name||''} onChange={e => setModal({...modal, contact_name: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.col_phone}</label>
                <input type="text" value={modal.phone||''} onChange={e => setModal({...modal, phone: toEnglishNumber(e.target.value)})}
                  className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.col_address}</label>
                <textarea value={modal.address||''} onChange={e => setModal({...modal, address: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Credit Limit (K)</label>
                  <input type="number" value={modal.credit_limit||''} onChange={e => setModal({...modal, credit_limit: Number(e.target.value)})}
                    className="w-full p-2.5 border rounded-lg text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Credit Days</label>
                  <input type="number" value={modal.credit_days||''} onChange={e => setModal({...modal, credit_days: Number(e.target.value)})}
                    className="w-full p-2.5 border rounded-lg text-sm" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">t.col_remarks</label>
                <input type="text" value={modal.internal_remarks||''} onChange={e => setModal({...modal, internal_remarks: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-red-50">
                <input type="checkbox" checked={modal.is_blacklisted||false} onChange={e => setModal({...modal, is_blacklisted: e.target.checked})}
                  className="w-4 h-4 accent-red-500" />
                <span className="text-sm">🚫 Blacklist</span>
              </label>
            </div>
            {msg && <p className={'text-sm mt-3 ' + (msg.includes('✅') ? 'text-green-600' : 'text-red-500')}>{msg}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setModal(null); setMsg('') }} className="flex-1 py-2.5 border rounded-lg text-sm">{t.btn_cancel}</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                {saving ? t.btn_save ? 'သိမ်းနေသည်...' : 'သိမ်းနေသည်...' : '✅ ' + t.btn_save}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal open={confirmState.open} message={confirmState.msg}
        onConfirm={()=>{hideConfirm();confirmState.cb()}} onCancel={hideConfirm} />
    </AppLayout>
  )
}
