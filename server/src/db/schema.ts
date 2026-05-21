import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Reference / lookup tables ────────────────────────────────────────────────

export const games = sqliteTable('games', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),          // "Star Citizen", "EVE Online"
  currency: text('currency').notNull().default('UEC'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const crewMembers = sqliteTable('crew_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  gameHandle: text('game_handle'),       // in-game username
  gameId: integer('game_id').references(() => games.id),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),          // "Prospector", "Mole"
  type: text('type').notNull(),          // "mining" | "trading" | "combat" | "multi"
  gameId: integer('game_id').references(() => games.id),
  notes: text('notes'),
});

// ─── Run — parent session for any activity ────────────────────────────────────

export const runs = sqliteTable('runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id').notNull().references(() => games.id),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  type: text('type').notNull(),          // "mining" | "trading" | "crafting" | "contract"
  status: text('status').notNull().default('active'),  // "active" | "completed" | "cancelled"
  title: text('title'),
  location: text('location'),
  startedAt: text('started_at'),
  endedAt: text('ended_at'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Crew on a run ────────────────────────────────────────────────────────────

export const runCrew = sqliteTable('run_crew', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: integer('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  crewMemberId: integer('crew_member_id').notNull().references(() => crewMembers.id),
  role: text('role'),                    // "pilot", "gunner", "miner" etc.
  payoutType: text('payout_type').notNull().default('percentage'),  // "fixed" | "percentage"
  payoutValue: real('payout_value').notNull().default(0),           // amount or 0-100
  payoutSettled: integer('payout_settled', { mode: 'boolean' }).notNull().default(false),
  actualPayout: real('actual_payout'),   // recorded after settlement
});

// ─── Expenses / investments tied to a run or standalone ───────────────────────

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: integer('run_id').references(() => runs.id, { onDelete: 'set null' }),
  gameId: integer('game_id').references(() => games.id),
  category: text('category').notNull(),  // "fuel" | "repairs" | "equipment" | "investment" | "other"
  itemName: text('item_name'),           // e.g. "Rieger C3 mining laser"
  amount: real('amount').notNull(),
  notes: text('notes'),
  date: text('date').notNull().default(sql`(date('now'))`),
});

// ─── Mining pipeline ──────────────────────────────────────────────────────────

export const miningEntries = sqliteTable('mining_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: integer('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  rawMaterial: text('raw_material').notNull(),   // "Quantainium", "Bexalite"
  quantityRaw: real('quantity_raw').notNull(),   // SCU / units
  location: text('location'),
  notes: text('notes'),
});

export const refiningJobs = sqliteTable('refining_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  miningEntryId: integer('mining_entry_id').notNull().references(() => miningEntries.id, { onDelete: 'cascade' }),
  refineryName: text('refinery_name'),
  refineryMethod: text('refinery_method'),       // "Dinyx Solventation", "Cormack Method" etc.
  inputQuantity: real('input_quantity').notNull(),
  outputMaterial: text('output_material').notNull(),
  outputQuantity: real('output_quantity'),        // filled when refining completes
  efficiency: real('efficiency'),                // % yield
  costToRefine: real('cost_to_refine').default(0),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  status: text('status').notNull().default('pending'),  // "pending" | "in_progress" | "done"
});

export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: integer('run_id').references(() => runs.id),
  refiningJobId: integer('refining_job_id').references(() => refiningJobs.id),
  tradingEntryId: integer('trading_entry_id'),   // FK set below via alter or join
  contractId: integer('contract_id'),
  commodity: text('commodity').notNull(),
  quantitySold: real('quantity_sold').notNull(),
  pricePerUnit: real('price_per_unit').notNull(),
  totalRevenue: real('total_revenue').notNull(),
  location: text('location'),
  soldAt: text('sold_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Trading ──────────────────────────────────────────────────────────────────

export const tradingEntries = sqliteTable('trading_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: integer('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  commodity: text('commodity').notNull(),
  quantityBought: real('quantity_bought').notNull(),
  buyPricePerUnit: real('buy_price_per_unit').notNull(),
  totalCost: real('total_cost').notNull(),
  buyLocation: text('buy_location'),
  sellLocation: text('sell_location'),
  status: text('status').notNull().default('in_transit'),  // "in_transit" | "sold" | "partial"
});

// ─── Crafting / manufacturing ─────────────────────────────────────────────────

export const craftingJobs = sqliteTable('crafting_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: integer('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  outputItem: text('output_item').notNull(),
  outputQuantity: real('output_quantity').notNull(),
  estimatedValue: real('estimated_value'),
  status: text('status').notNull().default('in_progress'),  // "in_progress" | "complete"
  completedAt: text('completed_at'),
});

export const craftingInputs = sqliteTable('crafting_inputs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  craftingJobId: integer('crafting_job_id').notNull().references(() => craftingJobs.id, { onDelete: 'cascade' }),
  material: text('material').notNull(),
  quantityRequired: real('quantity_required').notNull(),
  quantityUsed: real('quantity_used'),
  costPerUnit: real('cost_per_unit'),
  totalCost: real('total_cost'),
});

// ─── Contracts / missions ─────────────────────────────────────────────────────

export const contracts = sqliteTable('contracts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: integer('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),          // "combat" | "hauling" | "refueling" | "escort" | "other"
  clientName: text('client_name'),
  description: text('description'),
  agreedPayout: real('agreed_payout').notNull(),
  bonusPayout: real('bonus_payout').default(0),
  status: text('status').notNull().default('active'),  // "active" | "complete" | "failed" | "cancelled"
  completedAt: text('completed_at'),
});

// ─── Inventory (stock — useful for refueling contracts, crafting stock) ────────

export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id').notNull().references(() => games.id),
  item: text('item').notNull(),
  quantity: real('quantity').notNull().default(0),
  unitCost: real('unit_cost'),           // average cost basis
  location: text('location'),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const inventoryTransactions = sqliteTable('inventory_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  inventoryId: integer('inventory_id').notNull().references(() => inventory.id),
  runId: integer('run_id').references(() => runs.id),
  type: text('type').notNull(),          // "in" | "out"
  quantity: real('quantity').notNull(),
  unitCost: real('unit_cost'),
  reason: text('reason'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Ledger — full accounting journal ────────────────────────────────────────

export const ledgerEntries = sqliteTable('ledger_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id').notNull().references(() => games.id),
  runId: integer('run_id').references(() => runs.id),
  type: text('type').notNull(),          // "income" | "expense" | "investment" | "crew_payout"
  category: text('category').notNull(),  // "mining_sale" | "trading" | "contract" | "fuel" | "equipment" | ...
  amount: real('amount').notNull(),      // always positive; type determines debit/credit
  description: text('description').notNull(),
  date: text('date').notNull().default(sql`(date('now'))`),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
