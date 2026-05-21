import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { gameId } = req.query;
    const rows = gameId
      ? await db.all('SELECT * FROM crew_members WHERE game_id = ? ORDER BY name', [gameId])
      : await db.all('SELECT cm.*, g.name as game_name FROM crew_members cm LEFT JOIN games g ON cm.game_id = g.id ORDER BY cm.name');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM crew_members WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { name, gameHandle, gameId, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const result = await db.run(
      'INSERT INTO crew_members (name, game_handle, game_id, notes) VALUES (?, ?, ?, ?)',
      [name, gameHandle ?? null, gameId ?? null, notes ?? null]
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { name, gameHandle, gameId, notes } = req.body;
  try {
    await db.run(
      'UPDATE crew_members SET name = COALESCE(?, name), game_handle = COALESCE(?, game_handle), game_id = COALESCE(?, game_id), notes = COALESCE(?, notes) WHERE id = ?',
      [name ?? null, gameHandle ?? null, gameId ?? null, notes ?? null, req.params.id]
    );
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM crew_members WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
