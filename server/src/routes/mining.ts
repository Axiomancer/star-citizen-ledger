import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/run/:runId', async (req, res) => {
  try {
    const entries = await db.all(`
      SELECT me.*,
        (SELECT COALESCE(SUM(rj.cost_to_refine), 0) FROM refining_jobs rj WHERE rj.mining_entry_id = me.id) as refining_cost,
        (SELECT COALESCE(SUM(s.total_revenue), 0) FROM sales s
          JOIN refining_jobs rj ON s.refining_job_id = rj.id
          WHERE rj.mining_entry_id = me.id) as revenue
      FROM mining_entries me
      WHERE me.run_id = ?
      ORDER BY me.id
    `, [req.params.runId]);

    let refiningJobs: any[] = [];
    let sales: any[] = [];

    if (entries.length > 0) {
      const entryIds = entries.map((e: any) => e.id);
      const placeholders = entryIds.map(() => '?').join(',');
      refiningJobs = await db.all(
        `SELECT rj.*, me.raw_material FROM refining_jobs rj JOIN mining_entries me ON rj.mining_entry_id = me.id WHERE rj.mining_entry_id IN (${placeholders})`,
        entryIds
      );

      if (refiningJobs.length > 0) {
        const rjIds = refiningJobs.map((r: any) => r.id);
        const rjPlaceholders = rjIds.map(() => '?').join(',');
        sales = await db.all(`SELECT * FROM sales WHERE refining_job_id IN (${rjPlaceholders})`, rjIds);
      }
    }

    res.json({ entries, refiningJobs, sales });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/entries', async (req, res) => {
  const { runId, rawMaterial, quantityRaw, location, notes } = req.body;
  if (!runId || !rawMaterial || quantityRaw == null) {
    return res.status(400).json({ error: 'runId, rawMaterial, quantityRaw required' });
  }
  try {
    const result = await db.run(
      'INSERT INTO mining_entries (run_id, raw_material, quantity_raw, location, notes) VALUES (?, ?, ?, ?, ?)',
      [runId, rawMaterial, quantityRaw, location ?? null, notes ?? null]
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/entries/:id', async (req, res) => {
  const { rawMaterial, quantityRaw, location, notes } = req.body;
  try {
    await db.run(
      'UPDATE mining_entries SET raw_material = COALESCE(?, raw_material), quantity_raw = COALESCE(?, quantity_raw), location = COALESCE(?, location), notes = COALESCE(?, notes) WHERE id = ?',
      [rawMaterial ?? null, quantityRaw ?? null, location ?? null, notes ?? null, req.params.id]
    );
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/entries/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM mining_entries WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/refining', async (req, res) => {
  const { miningEntryId, refineryName, refineryMethod, inputQuantity, outputMaterial, costToRefine, startedAt } = req.body;
  if (!miningEntryId || !inputQuantity || !outputMaterial) {
    return res.status(400).json({ error: 'miningEntryId, inputQuantity, outputMaterial required' });
  }
  try {
    const result = await db.run(
      'INSERT INTO refining_jobs (mining_entry_id, refinery_name, refinery_method, input_quantity, output_material, cost_to_refine, started_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [miningEntryId, refineryName ?? null, refineryMethod ?? null, inputQuantity, outputMaterial, costToRefine ?? 0, startedAt ?? null, 'pending']
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/refining/:id', async (req, res) => {
  const { refineryName, refineryMethod, outputQuantity, efficiency, costToRefine, completedAt, status } = req.body;
  try {
    await db.run(`
      UPDATE refining_jobs SET
        refinery_name = COALESCE(?, refinery_name),
        refinery_method = COALESCE(?, refinery_method),
        output_quantity = COALESCE(?, output_quantity),
        efficiency = COALESCE(?, efficiency),
        cost_to_refine = COALESCE(?, cost_to_refine),
        completed_at = COALESCE(?, completed_at),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [refineryName ?? null, refineryMethod ?? null, outputQuantity ?? null, efficiency ?? null, costToRefine ?? null, completedAt ?? null, status ?? null, req.params.id]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/refining/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM refining_jobs WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
