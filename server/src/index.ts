import express from 'express';
import cors from 'cors';
import { initDb } from './db';

import gamesRouter from './routes/games';
import crewRouter from './routes/crew';
import vehiclesRouter from './routes/vehicles';
import runsRouter from './routes/runs';
import miningRouter from './routes/mining';
import tradingRouter from './routes/trading';
import salesRouter from './routes/sales';
import craftingRouter from './routes/crafting';
import contractsRouter from './routes/contracts';
import expensesRouter from './routes/expenses';
import inventoryRouter from './routes/inventory';
import accountingRouter from './routes/accounting';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/games', gamesRouter);
app.use('/api/crew', crewRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/runs', runsRouter);
app.use('/api/mining', miningRouter);
app.use('/api/trading', tradingRouter);
app.use('/api/sales', salesRouter);
app.use('/api/crafting', craftingRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/accounting', accountingRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

async function main() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Game Ledger API running on http://localhost:${PORT}`);
  });
}

main().catch(err => { console.error('Failed to start:', err); process.exit(1); });
