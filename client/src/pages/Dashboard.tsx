import { useQuery } from '@tanstack/react-query';
import { accountingApi, runsApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { fmtCurrency, fmtDuration, profitColor } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';

export function Dashboard() {
  const { data: summary = [] } = useQuery({ queryKey: ['accounting-summary'], queryFn: () => accountingApi.summary() });
  const { data: runs = [] } = useQuery({ queryKey: ['runs-recent'], queryFn: () => runsApi.list({ status: 'active' }) });
  const { data: allRuns = [] } = useQuery({ queryKey: ['runs-report'], queryFn: () => accountingApi.runsReport() });

  const totalIncome = (summary as any[]).reduce((s: number, g: any) => s + g.total_income, 0);
  const totalExpenses = (summary as any[]).reduce((s: number, g: any) => s + g.total_expenses + g.total_investment, 0);
  const totalNet = (summary as any[]).reduce((s: number, g: any) => s + g.net, 0);
  const totalCrewPayouts = (summary as any[]).reduce((s: number, g: any) => s + g.total_crew_payouts, 0);

  const recentRuns = (allRuns as any[]).slice(0, 8);
  const activeRuns = (runs as any[]);
  const bestRun = (allRuns as any[]).reduce((best: any, r: any) => (!best || r.profit > best.profit ? r : best), null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your game economy at a glance</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={fmtCurrency(totalIncome)} trend="up" />
        <StatCard label="Total Expenses" value={fmtCurrency(totalExpenses)} trend="down" />
        <StatCard label="Net Profit" value={fmtCurrency(totalNet)} trend={totalNet >= 0 ? 'up' : 'down'} />
        <StatCard label="Crew Payouts" value={fmtCurrency(totalCrewPayouts)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Per-game breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Per-Game Summary</CardTitle>
          </CardHeader>
          {(summary as any[]).length === 0 ? (
            <p className="text-sm text-slate-500">No data yet. Start a run to see stats here.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Game</Th>
                  <Th>Revenue</Th>
                  <Th>Expenses</Th>
                  <Th>Net</Th>
                </tr>
              </thead>
              <tbody>
                {(summary as any[]).map((g: any) => (
                  <Tr key={g.game_id}>
                    <Td><span className="font-medium text-slate-200">{g.game_name}</span></Td>
                    <Td><span className="text-emerald-400">{fmtCurrency(g.total_income, g.currency)}</span></Td>
                    <Td><span className="text-red-400">{fmtCurrency(g.total_expenses + g.total_investment, g.currency)}</span></Td>
                    <Td><span className={profitColor(g.net)}>{fmtCurrency(g.net, g.currency)}</span></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {/* Active runs */}
        <Card>
          <CardHeader>
            <CardTitle>Active Runs</CardTitle>
          </CardHeader>
          {activeRuns.length === 0 ? (
            <p className="text-sm text-slate-500">No active runs.</p>
          ) : (
            <div className="space-y-2">
              {activeRuns.map((r: any) => (
                <Link
                  key={r.id}
                  to={`/runs/${r.id}`}
                  className="flex items-center justify-between rounded-lg p-2.5 hover:bg-[#1a2444] transition-colors border border-[#1e2d4f]"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{r.title || `Run #${r.id}`}</p>
                    <p className="text-xs text-slate-500">{r.game_name} · {r.vehicle_name || 'No vehicle'}</p>
                  </div>
                  <Badge label={r.type} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent runs table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
          <Link to="/runs" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
        </CardHeader>
        <Table>
          <thead>
            <tr>
              <Th>Run</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Revenue</Th>
              <Th>Expenses</Th>
              <Th>Profit</Th>
              <Th>Duration</Th>
              <Th>UEC/hr</Th>
            </tr>
          </thead>
          <tbody>
            {recentRuns.length === 0 ? (
              <Tr>
                <Td className="text-slate-500 col-span-8" colSpan={8}>No runs yet. Create your first run!</Td>
              </Tr>
            ) : (
              recentRuns.map((r: any) => (
                <Tr key={r.id} onClick={() => window.location.href = `/runs/${r.id}`}>
                  <Td>
                    <div>
                      <span className="font-medium text-slate-200">{r.title || `Run #${r.id}`}</span>
                      {r.vehicle_name && <p className="text-xs text-slate-500">{r.vehicle_name}</p>}
                    </div>
                  </Td>
                  <Td><Badge label={r.type} /></Td>
                  <Td><Badge label={r.status} /></Td>
                  <Td className="text-emerald-400">{fmtCurrency(r.revenue)}</Td>
                  <Td className="text-red-400">{fmtCurrency(r.expenses)}</Td>
                  <Td className={profitColor(r.profit)}>{fmtCurrency(r.profit)}</Td>
                  <Td className="text-slate-400">{fmtDuration(r.duration_hours)}</Td>
                  <Td className={r.profitPerHour != null ? profitColor(r.profitPerHour) : 'text-slate-500'}>
                    {r.profitPerHour != null ? fmtCurrency(r.profitPerHour) : '—'}
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
