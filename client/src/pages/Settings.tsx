import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { Plus, Trash2 } from 'lucide-react';

export function Settings() {
  const qc = useQueryClient();
  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: gamesApi.list });
  const [form, setForm] = useState({ name: '', currency: '' });

  const add = useMutation({
    mutationFn: (d: unknown) => gamesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['games'] }); setForm({ name: '', currency: '' }); },
  });
  const remove = useMutation({
    mutationFn: (id: number) => gamesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  });

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Games</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage supported games and their currencies</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Add Game</CardTitle></CardHeader>
        <div className="flex gap-2">
          <input placeholder="Game name (e.g. Star Citizen)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input placeholder="Currency (e.g. UEC)" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-28" />
          <Button size="sm" onClick={() => { if (!form.name || !form.currency) return; add.mutate(form); }}>
            <Plus size={14} /> Add
          </Button>
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <thead><tr><Th>Game</Th><Th>Currency</Th><Th /></tr></thead>
          <tbody>
            {(games as any[]).map((g: any) => (
              <Tr key={g.id}>
                <Td className="font-medium text-slate-200">{g.name}</Td>
                <Td className="text-slate-400">{g.currency}</Td>
                <Td><Button variant="danger" size="sm" onClick={() => remove.mutate(g.id)}><Trash2 size={12} /></Button></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <CardHeader><CardTitle>Stub pages</CardTitle></CardHeader>
        <p className="text-sm text-slate-500">Mining / Trading / Crafting module pages are accessible directly from individual Run detail pages.</p>
      </Card>
    </div>
  );
}
