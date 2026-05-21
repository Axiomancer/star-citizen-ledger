import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/run/:runId', async (req, res) => {
  try {
    const entries = await db.all(`
      SELECT te.*,
        (SELECT COALESCE(SUM(s.total_revenue), 0) FROM sales s WHERE s.trading_entry_id = te.id) as revenue,
        (SELECT COALESCE(SUM(s.quantity_sold), 0) FROM sales s WHERE s.trading_entry_id = te.id) as sold_quantity
      FROM trading_entries te
      WHERE te.run_id = ?
      ORDER BY te.id
    `, [req.params.runId]);
    res.json(entries);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { runId, commodity, quantityBought, buyPricePerUnit, buyLocation, sellLocation } = req.body;
  if (!runId || !commodity || quantityBought == null || buyPricePerUnit == null) {
    return res.status(400).json({ error: 'runId, commodity, quantityBought, buyPricePerUnit required' });
  }
  try {
    const totalCost = quantityBought * buyPricePerUnit;
    const result = await db.run(
      'INSERT INTO trading_entries (run_id, commodity, quantity_bought, buy_price_per_unit, total_cost, buy_location, sell_location) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [runId, commodity, quantityBought, buyPricePerUnit, totalCost, buyLocation ?? null, sellLocation ?? null]
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { commodity, quantityBought, buyPricePerUnit, buyLocation, sellLocation, status } = req.body;
  const totalCost = (quantityBought != null && buyPricePerUnit != null) ? quantityBought * buyPricePerUnit : null;
  try {
    await db.run(`
      UPDATE trading_entries SET
        commodity = COALESCE(?, commodity),
        quantity_bought = COALESCE(?, quantity_bought),
        buy_price_per_unit = COALESCE(?, buy_price_per_unit),
        total_cost = COALESCE(?, total_cost),
        buy_location = COALESCE(?, buy_location),
        sell_location = COALESCE(?, sell_location),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [commodity ?? null, quantityBought ?? null, buyPricePerUnit ?? null, totalCost, buyLocation ?? null, sellLocation ?? null, status ?? null, req.params.id]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM trading_entries WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
