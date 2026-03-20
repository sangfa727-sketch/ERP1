'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useI18n } from '@/lib/i18n'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { createClient } from '@/lib/supabase'

interface Product {
  id: string; name: string; sku: string; stock_qty: number
  reorder_level: number; selling_price: number; base_cost: number
  category_id: string | null; unit: string
}
interface Category { id: string; name: string }

const toEngNum = (s: string) => s.replace(/[၀-၉]/g, d => String('၀၁၂၃၄၅၆၇၈၉'.indexOf(d)))
const EMPTY = { id: '', name: '', sku: '', stock_qty: 0, reorder_level: 5, selling_price: 0, base_cost: 0, category_id: null, unit: 'ခု' }

export default function AdminProductsPage() {
  const { t } = useI18n()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [uoms, setUoms] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data: any }>({ open: false, mode: 'add', data: EMPTY })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [showCatModal, setShowCatModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const supabase = createClient()
  const [confirmState, setConfirmState] = useState<{open:boolean;msg:string;cb:()=>void}>({open:false,msg:'',cb:()=>{}})
  const showConfirm = (msg: string, cb: ()=>void) => setConfirmState({open:true,msg,cb})
  const hideConfirm = () => setConfirmState(s=>({...s,open:false}))

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }, { data: uomData }] = await Promise.all([
      supabase.from('products').select('*').eq('is_deleted', false).order('name'),
      supabase.from('product_categories').select('id,name').order('name'),
      supabase.from('uom').select('name').order('name')
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setUoms(uomData ? uomData.map((u: any) => u.name) : ['ခု'])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openAdd = () => setModal({ open: true, mode: 'add', data: { ...EMPTY } })
  const openEdit = (p: Product) => setModal({ open: true, mode: 'edit', data: { ...p } })
  const closeModal = () => { setModal({ open: false, mode: 'add', data: EMPTY }); setMsg('') }

  const handleSave = async () => {
    const d = modal.data
    if (!d.name) { setMsg(t.prod_err_name); return }
    if (!d.selling_price || Number(d.selling_price) <= 0) { setMsg(t.prod_err_price); return }
    setSaving(true); setMsg('')
    const { data: profileData } = await supabase.from('profiles').select('company_id')
    const companyId = profileData?.[0]?.company_id
    if (!companyId) { setMsg(t.prod_err_company); setSaving(false); return }
    if (modal.mode === 'add') {
      const { error } = await supabase.from('products').insert({
        name: d.name, selling_price: Number(d.selling_price), base_cost: Number(d.base_cost || 0),
        reorder_level: Number(d.reorder_level || 5), stock_qty: Number(d.stock_qty || 0),
        category_id: d.category_id || null, unit: d.unit || 'ခု', company_id: companyId
      })
      if (error) setMsg('Error: ' + error.message)
      else { setMsg('✅'); await fetchAll(); setTimeout(closeModal, 800) }
    } else {
      const { error } = await supabase.from('products').update({
        name: d.name, selling_price: Number(d.selling_price), base_cost: Number(d.base_cost || 0),
        reorder_level: Number(d.reorder_level || 5), category_id: d.category_id || null, unit: d.unit || 'ခု',
      }).eq('id', d.id)
      if (error) setMsg('Error: ' + error.message)
      else { setMsg('✅'); await fetchAll(); setTimeout(closeModal, 800) }
    }
    setSaving(false)
  }

  const handleDelete = (id: string) => {
    showConfirm(t.prod_delete_confirm, async () => {
      await supabase.from('products').update({ is_deleted: true }).eq('id', id)
      await fetchAll()
    })
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    const { data: profileData } = await supabase.from('profiles').select('company_id')
    const companyId = profileData?.[0]?.company_id
    await supabase.from('product_categories').insert({ name: newCatName.trim(), company_id: companyId })
    setNewCatName(''); await fetchAll()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  )
  const getCatName = (id: string | null) => categories.find(c => c.id === id)?.name || '-'

  return (
    <AppLayout>
      <div className="p-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold" style={{color:'var(--color-text)'}}>🛒 {t.prod_title}</h1>
          <div className="flex gap-2 items-center">
            <button onClick={() => setShowCatModal(true)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{backgroundColor:'var(--color-bg)', border:'1px solid var(--color-border)', color:'var(--color-text)'}}>
              {t.prod_cat_btn}
            </button>
            <button onClick={openAdd}
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
              style={{backgroundColor:'var(--color-primary)'}}>
              {t.prod_add_btn}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input type="text" placeholder={t.btn_search} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full p-2.5 rounded-xl text-sm outline-none"
            style={{backgroundColor:'var(--color-card)', border:'1px solid var(--color-border)', color:'var(--color-text)'}} />
        </div>

        {loading ? (
          <div className="text-center py-12" style={{color:'var(--color-text-sub)'}}>{t.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12" style={{color:'var(--color-text-sub)'}}>{t.prod_no_products}</div>
        ) : (
          <>
            {/* Mobile: Card view */}
            <div className="md:hidden space-y-3">
              {filtered.map(p => (
                <div key={p.id} className="rounded-xl p-4"
                  style={{backgroundColor:'var(--color-card)', border:'1px solid var(--color-border)', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-sm" style={{color:'var(--color-text)'}}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{color:'var(--color-text-sub)'}}>{getCatName(p.category_id)} · {p.unit}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(p)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-white"
                        style={{backgroundColor:'#f59e0b'}}>{t.btn_edit}</button>
                      <button onClick={() => handleDelete(p.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-white"
                        style={{backgroundColor:'#ef4444'}}>{t.btn_delete}</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="rounded-lg p-2 text-center" style={{backgroundColor:'var(--color-bg)'}}>
                      <p className="text-xs" style={{color:'var(--color-text-sub)'}}>ရောင်းစျေး</p>
                      <p className="text-sm font-bold" style={{color:'var(--color-primary)'}}>K {Number(p.selling_price).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{backgroundColor:'var(--color-bg)'}}>
                      <p className="text-xs" style={{color:'var(--color-text-sub)'}}>ဝယ်စျေး</p>
                      <p className="text-sm font-bold" style={{color:'var(--color-text)'}}>K {Number(p.base_cost).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{backgroundColor:'var(--color-bg)'}}>
                      <p className="text-xs" style={{color:'var(--color-text-sub)'}}>Stock</p>
                      <p className="text-sm font-bold" style={{color: Number(p.stock_qty) <= Number(p.reorder_level) ? '#ef4444' : 'var(--color-text)'}}>{Number(p.stock_qty).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table view */}
            <div className="hidden md:block rounded-xl shadow-sm overflow-hidden"
              style={{backgroundColor:'var(--color-card)', border:'1px solid var(--color-border)'}}>
              <table className="w-full text-sm">
                <thead style={{backgroundColor:'var(--color-bg)', borderBottom:'1px solid var(--color-border)'}}>
                  <tr>
                    <th className="text-left p-3 font-semibold" style={{color:'var(--color-text-sub)'}}>{t.col_name}</th>
                    <th className="text-left p-3 font-semibold" style={{color:'var(--color-text-sub)'}}>{t.prod_col_category}</th>
                    <th className="text-right p-3 font-semibold" style={{color:'var(--color-text-sub)'}}>{t.prod_col_sell_price}</th>
                    <th className="text-right p-3 font-semibold" style={{color:'var(--color-text-sub)'}}>{t.prod_col_cost}</th>
                    <th className="text-right p-3 font-semibold" style={{color:'var(--color-text-sub)'}}>{t.prod_col_stock}</th>
                    <th className="text-center p-3 font-semibold" style={{color:'var(--color-text-sub)'}}>{t.col_action}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} style={{borderBottom:'1px solid var(--color-border)'}}>
                      <td className="p-3 font-medium" style={{color:'var(--color-text)'}}>{p.name}<br/><span className="text-xs" style={{color:'var(--color-text-sub)'}}>{p.sku} · {p.unit}</span></td>
                      <td className="p-3 text-xs" style={{color:'var(--color-text-sub)'}}>{getCatName(p.category_id)}</td>
                      <td className="p-3 text-right font-bold" style={{color:'var(--color-primary)'}}>K {Number(p.selling_price).toLocaleString()}</td>
                      <td className="p-3 text-right" style={{color:'var(--color-text-sub)'}}>K {Number(p.base_cost).toLocaleString()}</td>
                      <td className="p-3 text-right font-bold" style={{color:'var(--color-text)'}}>{Number(p.stock_qty).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => openEdit(p)} className="px-3 py-1 rounded text-xs text-white" style={{backgroundColor:'#f59e0b'}}>{t.btn_edit}</button>
                          <button onClick={() => handleDelete(p.id)} className="px-3 py-1 rounded text-xs text-white" style={{backgroundColor:'#ef4444'}}>{t.btn_delete}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-5 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            style={{backgroundColor:'var(--color-card)', color:'var(--color-text)'}}>
            <h2 className="text-lg font-bold mb-4">{modal.mode === 'add' ? t.prod_modal_add : t.prod_modal_edit}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{color:'var(--color-text-sub)'}}>{t.prod_field_name}</label>
                <input type="text" value={modal.data.name || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, name: e.target.value } }))}
                  className="w-full p-2.5 rounded-lg text-sm outline-none"
                  style={{backgroundColor:'var(--color-bg)', border:'1px solid var(--color-border)', color:'var(--color-text)'}}
                  placeholder={t.prod_name_placeholder} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{color:'var(--color-text-sub)'}}>{t.prod_field_category}</label>
                <select value={modal.data.category_id || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, category_id: e.target.value || null } }))}
                  className="w-full p-2.5 rounded-lg text-sm outline-none"
                  style={{backgroundColor:'var(--color-bg)', border:'1px solid var(--color-border)', color:'var(--color-text)'}}>
                  <option value="">{t.prod_no_category}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color:'var(--color-text-sub)'}}>{t.prod_field_sell_price}</label>
                  <input type="text" inputMode="numeric" value={modal.data.selling_price || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, selling_price: Number(toEngNum(e.target.value)) } }))}
                    className="w-full p-2.5 rounded-lg text-sm outline-none"
                    style={{backgroundColor:'var(--color-bg)', border:'1px solid var(--color-border)', color:'var(--color-text)'}} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color:'var(--color-text-sub)'}}>{t.prod_field_cost}</label>
                  <input type="text" inputMode="numeric" value={modal.data.base_cost || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, base_cost: Number(toEngNum(e.target.value)) } }))}
                    className="w-full p-2.5 rounded-lg text-sm outline-none"
                    style={{backgroundColor:'var(--color-bg)', border:'1px solid var(--color-border)', color:'var(--color-text)'}} placeholder="0" />
                </div>
              </div>
              {modal.mode === 'add' && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color:'var(--color-text-sub)'}}>{t.prod_field_initial_stock}</label>
                  <input type="text" inputMode="numeric" value={modal.data.stock_qty || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, stock_qty: Number(toEngNum(e.target.value)) } }))}
                    className="w-full p-2.5 rounded-lg text-sm outline-none"
                    style={{backgroundColor:'var(--color-bg)', border:'1px solid var(--color-border)', color:'var(--color-text)'}} placeholder="0" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color:'var(--color-text-sub)'}}>{t.prod_field_reorder}</label>
                  <input type="text" inputMode="numeric" value={modal.data.reorder_level || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, reorder_level: Number(toEngNum(e.target.value)) } }))}
                    className="w-full p-2.5 rounded-lg text-sm outline-none"
                    style={{backgroundColor:'var(--color-bg)', border:'1px solid var(--color-border)', color:'var(--color-text)'}} placeholder="5" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color:'var(--color-text-sub)'}}>{t.prod_field_unit}</label>
                  <select value={modal.data.unit || 'ခု'} onChange={e => setModal(m => ({ ...m, data: { ...m.data, unit: e.target.value } }))}
                    className="w-full p-2.5 rounded-lg text-sm outline-none"
                    style={{backgroundColor:'var(--color-bg)', border:'1px solid var(--color-border)', color:'var(--color-text)'}}>
                    {uoms.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {msg && <p className={'text-sm mt-3 ' + (msg.includes('✅') ? 'text-green-600' : 'text-red-500')}>{msg}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg text-sm"
                style={{border:'1px solid var(--color-border)', color:'var(--color-text)'}}>{t.btn_cancel}</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{backgroundColor:'var(--color-primary)'}}>
                {saving ? t.loading : t.btn_save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-5 w-full max-w-sm shadow-xl"
            style={{backgroundColor:'var(--color-card)', color:'var(--color-text)'}}>
            <h2 className="text-lg font-bold mb-4">{t.prod_cat_modal_title}</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                placeholder={t.prod_cat_placeholder}
                className="flex-1 p-2.5 rounded-lg text-sm outline-none"
                style={{backgroundColor:'var(--color-bg)', border:'1px solid var(--color-border)', color:'var(--color-text)'}} />
              <button onClick={handleAddCategory}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{backgroundColor:'#9333ea'}}>{t.prod_cat_add_btn}</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-center py-4" style={{color:'var(--color-text-sub)'}}>{t.prod_cat_empty}</p>
              ) : categories.map(c => (
                <div key={c.id} className="flex items-center p-2.5 rounded-lg"
                  style={{backgroundColor:'var(--color-bg)'}}>
                  <span className="text-sm" style={{color:'var(--color-text)'}}>{c.name}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCatModal(false)}
              className="mt-4 w-full py-2.5 rounded-lg text-sm"
              style={{border:'1px solid var(--color-border)', color:'var(--color-text)'}}>{t.prod_cat_close}</button>
          </div>
        </div>
      )}

      <ConfirmModal open={confirmState.open} message={confirmState.msg}
        onConfirm={()=>{hideConfirm();confirmState.cb()}} onCancel={hideConfirm} />
    </AppLayout>
  )
}
