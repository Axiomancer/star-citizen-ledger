import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crewApi, gamesApi } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { Plus, Trash2, Users } from 'lucide-react';

function NewCrewModal({ open, onClose, games }: { open: boolean; onClose: () => void; games: any[] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', gameHandle: '', gameId: '', notes: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const add = useMutation({
    mutationFn: (d: unknown) => crewApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crew'] }); onClose(); },
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Crew Member">
      <form onSubmit={e => { e.preventDefault(); add.mutate({ name: form.name, gameHandle: form.gameHandle || undefined, gameId: form.gameId ? Number(form.gameId) : undefined, notes: form.notes || undefined }); }} className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. NXRT_Alpha" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">In-game handle</label>
            <input value={form.gameHandle} onChange={e => set('gameHandle', e.target.value)} placeholder="@handle" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Primary game</label>
            <select value={form.gameId} onChange={e => set('gameId', e.target.value)}>
              <option value="">Any</option>
              {games.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Optional notes" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={add.isPending}><Plus size={14} /> Add</Button>
        </div>
      </form>
    </Modal>
  );
}

export function Crew() {
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const { data: crew = [] } = useQuery({ queryKey: ['crew'], queryFn: () => crewApi.list() });
  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: gamesApi.list });

  const remove = useMutation({
    mutationFn: (id: number) => crewApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crew'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Crew</h1>
          <p className="text-sm text-slate-500 mt-0.5">{(crew as any[]).length} member(s) registered</p>
        </div>
        <Button onClick={() => setNewOpen(true)}><Plus size={15} /> <Users size={15} /> Add Member</Button>
      </div>

      <Card className="p-0">
        <Table>
          <thead><tr><Th>Name</Th><Th>Handle</Th><Th>Game</Th><Th>Notes</Th><Th /></tr></thead>
          <tbody>
            {(crew as any[]).length === 0 ? (
              <Tr><Td colSpan={5} className="text-center text-slate-500">No crew members yet.</Td></Tr>
            ) : (
              (crew as any[]).map((m: any) => (
                <Tr key={m.id}>
                  <Td className="font-medium text-slate-200">{m.name}</Td>
                  <Td className="text-slate-500">{m.game_handle || '—'}</Td>
                  <Td className="text-slate-400">{m.game_name || '—'}</Td>
                  <Td className="text-slate-500 text-xs">{m.notes || '—'}</Td>
                  <Td><Button variant="danger" size="sm" onClick={() => remove.mutate(m.id)}><Trash2 size={12} /></Button></Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <NewCrewModal open={newOpen} onClose={() => setNewOpen(false)} games={games as any[]} />
    </div>
  );
}
