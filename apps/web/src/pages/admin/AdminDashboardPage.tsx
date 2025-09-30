import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/state/auth';

type Stats = {
  vendors: number;
  factories: number;
  countries: number;
  lastIngest?: string;
};

export default function AdminDashboardPage() {
  const token = useAuth((s) => s.token);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<Stats>('/admin/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setStats(res);
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load admin stats');
      }
    })();
  }, [token]);

  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card label="Vendors" value={stats.vendors} />
          <Card label="Factories" value={stats.factories} />
          <Card label="Countries" value={stats.countries} />
        </div>
      ) : (
        <div>Loading…</div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
