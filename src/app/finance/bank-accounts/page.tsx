'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { useI18n } from '@/lib/i18n'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toEnglishNumber } from '@/lib/utils'

interface BankAccountType { id: string; name: string; icon: string }
interface BankAccount {
  id: string; account_name: string; account_number: string
  opening_balance: number; current_balance: number; is_active: boolean
  account_type_id: string; account_type?: BankAccountType
}

const EMPTY = { id: '', account_name: '', account_number: '', opening_balance: '', account_type_id: '', is_active: true }
const EMPTY_TYPE = { id: '', name: '', icon: '🏦' }

const ICON_OPTIONS = ['🏦','💵','💳','📱','🌊','🏧','💰','🏪']

export default function BankAccountsPage() {
  const { t } = useI18n()
  const supabase = createClient()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [types, setTypes] = useState<BankAccountType[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; mode: 'add'|'edit'; data: any }>({ open: false, mode: 'add', data: EMPTY })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmState, setConfirmState] = useState<{open:boolean;msg:string;cb:()=>void}>({open:false,msg:'',cb:()=>{}})
  const showConfirm = (m: string, cb: ()=>void) => setConfirmState({open:true,msg:m,cb})
  const hideConfirm = () => setConfirmState(s=>({...s,open:false}))

  // Account Type modal
  const [typeModal, setTypeModal] = useState<{open:boolean;data:any}>({open:false,data:EMPTY_TYPE})
  const [typeSaving, setTypeSaving] = useState(false)
  const [typeMsg, setTypeMsg] = useState('')
  const [showTypes, setShowTypes] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: accs }, { data: tps }] = await Promise.all([
      supabase.from('bank_accounts').select('*, account_type:account_type_id(id,name,icon)').eq('is_deleted', false).order('account_name'),
      supabase.from('bank_account_types').select('*').eq('is_active', true).order('name'),
    ])
    setAccounts((accs as any) || [])
    setTypes(tps || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const totalBalance = accounts.reduce((s, a) => s + Number(a.current_balance || 0), 0)

  const openAdd = () => setModal({ open: true, mode: 'add', data: { ...EMPTY, account_type_id: types[0]?.id || '' } })
  const openEdit = (a: BankAccount) => setModal({ open: true, mode: 'edit', data: { ...a, opening_balance: String(a.opening_balance) } })
  const closeModal = () => { setModal({ open: false, mode: 'add', data: EMPTY }); setMsg('') }

  const handleSave = async () => {
    const d = modal.data
    if (!d.account_name.trim()) { setMsg((t as any).bank_err_name); return }
    if (!d.account_type_id) { setMsg((t as any).bank_err_type); return }
    setSaving(true); setMsg('')
    const { data: prof } = await supabase.from('profiles').select('company_id').maybeSingle()
    if (modal.mode === 'add') {
      const ob = parseFloat(toEnglishNumber(d.opening_balance)) || 0
      await supabase.from('bank_accounts').insert({
        company_id: prof?.company_id, account_name: d.account_name,
        account_number: d.account_number || null, opening_balance: ob,
        current_balance: ob, account_type_id: d.account_type_id, is_active: d.is_active,
      })
    } else {
      await supabase.from('bank_accounts').update({
        account_name: d.account_name, account_number: d.account_number || null,
        account_type_id: d.account_type_id, is_active: d.is_active,
      }).eq('id', d.id)
    }
    await fetchAll(); closeModal(); setSaving(false)
  }

  const handleDelete = (id: string) => {
    showConfirm(t.confirm_delete, async () => {
      await supabase.from('bank_accounts').update({ is_deleted: true }).eq('id', id)
      await fetchAll()
    })
  }

  // Account Type CRUD
  const saveType = async () => {
    const d = typeModal.data
    if (!d.name.trim()) { setTypeMsg('❌ Name ဖြည့်ပါ'); return }
    setTypeSaving(true); setTypeMsg('')
    const { data: prof } = await supabase.from('profiles').select('company_id').maybeSingle()
    if (d.id) {
      await supabase.from('bank_account_types').update({ name: d.name, icon: d.icon }).eq('id', d.id)
    } else {
      await supabase.from('bank_account_types').insert({ company_id: prof?.company_id, name: d.name, icon: d.icon, is_active: true })
    }
    await fetchAll()
    setTypeModal({ open: false, data: EMPTY_TYPE })
    setTypeSaving(false)
    setTypeMsg('')
  }

  const deleteType = (id: string) => {
    showConfirm('ဒီ Account Type ကို ဖျက်မှာ သေချာပါသလား?', async () => {
      await supabase.from('bank_account_types').update({ is_active: false }).eq('id', id)
      await fetchAll()
    })
  }

  const d = modal.data

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{(t as any).bank_title}</h1>
            <p className="text-sm text-gray-500 mt-1">{(t as any).bank_subtitle}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTypes(!showTypes)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">
              ⚙️ Account Types
            </button>
            <button onClick={openAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              + {(t as any).bank_add}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-5 mb-6 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">{(t as any).bank_total}</p>
          <p className="text-3xl font-bold mt-1 text-gray-800">{totalBalance.toLocaleString()} <span className="text-lg font-normal">Ks</span></p>
          <p className="text-sm text-gray-400 mt-1">{accounts.filter(a => a.is_active).length} {(t as any).bank_active}</p>
        </div>

        {/* Account Types Panel */}
        {showTypes && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-700">⚙️ Account Types</h2>
              <button onClick={() => setTypeModal({ open: true, data: { ...EMPTY_TYPE } })}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs">+ Add Type</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {types.map(tp => (
                <div key={tp.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tp.icon}</span>
                    <span className="text-sm font-medium">{tp.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setTypeModal({ open: true, data: { ...tp } })}
                      className="px-2 py-1 bg-yellow-500 text-white rounded text-xs">✏️</button>
                    <button onClick={() => deleteType(tp.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accounts List */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {accounts.length === 0 && (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl">{(t as any).bank_empty}</div>
            )}
            {accounts.map(a => (
              <div key={a.id} className={`bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between ${!a.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                    {(a.account_type as any)?.icon || '🏦'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{a.account_name}</p>
                    <p className="text-xs text-gray-500">{(a.account_type as any)?.name}</p>
                    {a.account_number && <p className="text-xs text-gray-400">{a.account_number}</p>}
                    {!a.is_active && <span className="text-xs text-red-500">{(t as any).bank_inactive}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-800">{Number(a.current_balance).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Ks</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(a)} className="px-3 py-1.5 bg-yellow-500 text-white rounded-xl text-xs">{(t as any).bank_edit}</button>
                    <button onClick={() => handleDelete(a.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs">{(t as any).bank_delete}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank Account Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{modal.mode === 'add' ? t.bank_modal_add : t.bank_modal_edit}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{(t as any).bank_type}</label>
                <select value={d.account_type_id} onChange={e => setModal(m => ({ ...m, data: { ...m.data, account_type_id: e.target.value } }))}
                  className="w-full p-2 border rounded-xl text-sm">
                  <option value="">{t.ar_select}</option>
                  {types.map(tp => <option key={tp.id} value={tp.id}>{tp.icon} {tp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{(t as any).bank_name} *</label>
                <input type="text" value={d.account_name} onChange={e => setModal(m => ({ ...m, data: { ...m.data, account_name: e.target.value } }))}
                  className="w-full p-2 border rounded-xl text-sm" placeholder="e.g. KBZ Main Account"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{(t as any).bank_number}</label>
                <input type="text" value={d.account_number} onChange={e => setModal(m => ({ ...m, data: { ...m.data, account_number: e.target.value } }))}
                  className="w-full p-2 border rounded-xl text-sm" placeholder="e.g. 0912345678"/>
              </div>
              {modal.mode === 'add' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{(t as any).bank_opening}</label>
                  <input type="text" value={d.opening_balance} onChange={e => setModal(m => ({ ...m, data: { ...m.data, opening_balance: toEnglishNumber(e.target.value) } }))}
                    className="w-full p-2 border rounded-xl text-sm" placeholder="0"/>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">{(t as any).bank_active}</span>
                <button onClick={() => setModal(m => ({ ...m, data: { ...m.data, is_active: !m.data.is_active } }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${d.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${d.is_active ? 'translate-x-6' : 'translate-x-1'}`}/>
                </button>
              </div>
            </div>
            {msg && <p className="mt-3 text-sm text-red-500">{msg}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={closeModal} className="flex-1 py-2 border rounded-xl text-sm">{t.cancel}</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {saving ? t.settings_saving : '💾 '+t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Type Modal */}
      {typeModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">{typeModal.data.id ? '✏️ Edit' : '➕ Add'} Account Type</h3>
              <button onClick={() => setTypeModal({ open: false, data: EMPTY_TYPE })} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Name *</label>
                <input value={typeModal.data.name} onChange={e => setTypeModal(m => ({ ...m, data: { ...m.data, name: e.target.value } }))}
                  className="w-full p-2 border rounded-xl text-sm" placeholder="e.g. Mobile Banking"/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {ICON_OPTIONS.map(icon => (
                    <button key={icon} onClick={() => setTypeModal(m => ({ ...m, data: { ...m.data, icon } }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all
                        ${typeModal.data.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {typeMsg && <p className="mt-3 text-sm text-red-500">{typeMsg}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setTypeModal({ open: false, data: EMPTY_TYPE })} className="flex-1 py-2 border rounded-xl text-sm">Cancel</button>
              <button onClick={saveType} disabled={typeSaving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {typeSaving ? 'Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={confirmState.open} message={confirmState.msg}
        onConfirm={() => { hideConfirm(); confirmState.cb() }} onCancel={hideConfirm}/>
    </AppLayout>
  )
}
