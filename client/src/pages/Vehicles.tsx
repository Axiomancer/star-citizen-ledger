import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi, gamesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { Plus, Trash2 } from 'lucide-react';
import { VEHICLE_TYPES } from '@/lib/utils';

function NewVehicleModal({ open, onClose, games }: { open: boolean; onClose: () => void; games: any[] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', type: 'mining', gameId: '', notes: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const add = useMutation({
    mutationFn: (d: unknown) => vehiclesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); onClose(); },
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Vehicle / Ship">
      <form onSubmit={e => { e.preventDefault(); add.mutate({ name: form.name, type: form.type, gameId: form.gameId ? Number(form.gameId) : undefined, notes: form.notes || undefined }); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. MISC Prospector" required />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Type *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Game</label>
          <select value={form.gameId} onChange={e => set('gameId', e.target.value)}>
            <option value="">Any</option>
            {games.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Notes</label>
          <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={add.isPending}><Plus size={14} /> Add</Button>
        </div>
      </form>
    </Modal>
  );
}

export function Vehicles() {
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => vehiclesApi.list() });
  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: gamesApi.list });

  const remove = useMutation({
    mutationFn: (id: number) => vehiclesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Vehicles & Ships</h1>
          <p className="text-sm text-slate-500 mt-0.5">{(vehicles as any[]).length} registered</p>
        </div>
        <Button onClick={() => setNewOpen(true)}><Plus size={15} /> Add Vehicle</Button>
      </div>

      <Card className="p-0">
        <Table>
          <thead><tr><Th>Name</Th><Th>Type</Th><Th>Game</Th><Th>Notes</Th><Th /></tr></thead>
          <tbody>
            {(vehicles as any[]).length === 0 ? (
              <Tr><Td colSpan={5} className="text-center text-slate-500">No vehicles yet.</Td></Tr>
            ) : (
              (vehicles as any[]).map((v: any) => (
                <Tr key={v.id}>
                  <Td className="font-medium text-slate-200">{v.name}</Td>
                  <Td><Badge label={v.type} /></Td>
                  <Td className="text-slate-400">{v.game_name || '—'}</Td>
                  <Td className="text-slate-500 text-xs">{v.notes || '—'}</Td>
                  <Td><Button variant="danger" size="sm" onClick={() => remove.mutate(v.id)}><Trash2 size={12} /></Button></Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <NewVehicleModal open={newOpen} onClose={() => setNewOpen(false)} games={games as any[]} />
    </div>
  );
}
