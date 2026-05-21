import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, gamesApi } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { fmtCurrency } from '@/lib/utils';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

function AdjustModal({ item, open, onClose, currency }: { item: any; open: boolean; onClose: () => void; currency: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ type: 'in', quantity: '', unitCost: '', reason: '' });

  const adjust = useMutation({
    mutationFn: (d: unknown) => inventoryApi.adjust(item.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); onClose(); },
  });

  return (
    <Modal open={open} onClose={onClose} title={`Adjust: ${item?.item}`}>
      <form onSubmit={e => { e.preventDefault(); adjust.mutate({ type: form.type, quantity: Number(form.quantity), unitCost: form.unitCost ? Number(form.unitCost) : undefined, reason: form.reason || undefined }); }} className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Direction</label>
          <div className="flex gap-2">
            <Button type="button" variant={form.type === 'in' ? 'primary' : 'secondary'} onClick={() => setForm(f => ({ ...f, type: 'in' }))}>
              <ArrowUp size={14} /> Stock In
            </Button>
            <Button type="button" variant={form.type === 'out' ? 'danger' : 'secondary'} onClick={() => setForm(f => ({ ...f, type: 'out' }))}>
              <ArrowDown size={14} /> Stock Out
            </Button>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Quantity * (current: {item?.quantity})</label>
          <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Unit cost (optional)</label>
          <input type="number" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} placeholder={currency} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Reason</label>
          <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Refueling contract delivery" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={adjust.isPending}>Confirm</Button>
        </div>
      </form>
    </Modal>
  );
}

export function Inventory() {
  const qc = useQueryClient();
  const [gameFilter, setGameFilter] = useState('');
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [newForm, setNewForm] = useState({ gameId: '', item: '', quantity: '', unitCost: '', location: '' });

  const { data: inventory = [] } = useQuery({ queryKey: ['inventory', gameFilter], queryFn: () => inventoryApi.list(gameFilter ? { gameId: gameFilter } : undefined) });
  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: gamesApi.list });

  const add = useMutation({
    mutationFn: (d: unknown) => inventoryApi.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => inventoryApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const totalValue = (inventory as any[]).reduce((s: number, i: any) => s + (i.quantity * (i.unit_cost || 0)), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {(inventory as any[]).length} items · Est. value: {fmtCurrency(totalValue)}
          </p>
        </div>
        <select className="w-40" value={gameFilter} onChange={e => setGameFilter(e.target.value)}>
          <option value="">All games</option>
          {(games as any[]).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Add new item */}
      <Card>
        <CardHeader><CardTitle>Add Item</CardTitle></CardHeader>
        <div className="grid grid-cols-5 gap-2">
          <select value={newForm.gameId} onChange={e => setNewForm(f => ({ ...f, gameId: e.target.value }))}>
            <option value="">Game</option>
            {(games as any[]).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input placeholder="Item name" value={newForm.item} onChange={e => setNewForm(f => ({ ...f, item: e.target.value }))} />
          <input type="number" placeholder="Qty" value={newForm.quantity} onChange={e => setNewForm(f => ({ ...f, quantity: e.target.value }))} />
          <input type="number" placeholder="Unit cost" value={newForm.unitCost} onChange={e => setNewForm(f => ({ ...f, unitCost: e.target.value }))} />
          <input placeholder="Location" value={newForm.location} onChange={e => setNewForm(f => ({ ...f, location: e.target.value }))} />
        </div>
        <Button className="mt-2" size="sm" onClick={() => {
          if (!newForm.gameId || !newForm.item) return;
          add.mutate({ gameId: Number(newForm.gameId), item: newForm.item, quantity: Number(newForm.quantity) || 0, unitCost: newForm.unitCost ? Number(newForm.unitCost) : undefined, location: newForm.location || undefined });
          setNewForm({ gameId: '', item: '', quantity: '', unitCost: '', location: '' });
        }}><Plus size={13} /> Add</Button>
      </Card>

      <Card className="p-0">
        <Table>
          <thead><tr><Th>Item</Th><Th>Game</Th><Th>Quantity</Th><Th>Unit Cost</Th><Th>Total Value</Th><Th>Location</Th><Th /></tr></thead>
          <tbody>
            {(inventory as any[]).length === 0 ? (
              <Tr><Td colSpan={7} className="text-center text-slate-500">No inventory items.</Td></Tr>
            ) : (
              (inventory as any[]).map((i: any) => (
                <Tr key={i.id}>
                  <Td className="font-medium text-slate-200">{i.item}</Td>
                  <Td className="text-slate-500">{i.game_name}</Td>
                  <Td className={i.quantity === 0 ? 'text-red-400' : 'text-slate-300'}>{i.quantity}</Td>
                  <Td className="text-slate-400">{i.unit_cost ? fmtCurrency(i.unit_cost) : '—'}</Td>
                  <Td className="text-slate-300">{i.unit_cost ? fmtCurrency(i.quantity * i.unit_cost) : '—'}</Td>
                  <Td className="text-slate-500">{i.location || '—'}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => setAdjustItem(i)}>Adjust</Button>
                      <Button variant="danger" size="sm" onClick={() => remove.mutate(i.id)}><Trash2 size={12} /></Button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {adjustItem && (
        <AdjustModal item={adjustItem} open={!!adjustItem} onClose={() => setAdjustItem(null)} currency={(games as any[]).find((g: any) => g.id === adjustItem?.game_id)?.currency || 'UEC'} />
      )}
    </div>
  );
}
