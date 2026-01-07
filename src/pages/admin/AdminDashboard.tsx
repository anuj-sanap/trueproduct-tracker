import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, ScanLine, AlertTriangle, TrendingUp } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/ui/stat-card';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, scans: 0, fakeDetections: 0 });
  const [chartData, setChartData] = useState<{ name: string; scans: number }[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [productsRes, scansRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('scans').select('*'),
    ]);

    const scans = scansRes.data || [];
    const fakeDetections = scans.filter(s => s.is_fake).length;

    setStats({
      products: productsRes.count || 0,
      scans: scans.length,
      fakeDetections,
    });

    // Generate chart data from scans
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return { name: date.toLocaleDateString('en-US', { weekday: 'short' }), scans: 0 };
    });

    scans.forEach(scan => {
      const scanDate = new Date(scan.scan_time);
      const dayIndex = last7Days.findIndex(d => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - last7Days.indexOf(d)));
        return scanDate.toDateString() === date.toDateString();
      });
      if (dayIndex !== -1) last7Days[dayIndex].scans++;
    });

    setChartData(last7Days);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Unified Header Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-accent/5 via-accent/10 to-primary/5 border border-accent/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AuthentiScan Platform</p>
                <p className="text-xs text-accent font-medium">Administration Console</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent">System Active</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor product verification activity</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Products" value={stats.products} icon={<Package className="h-6 w-6" />} />
          <StatCard title="Total Scans" value={stats.scans} icon={<ScanLine className="h-6 w-6" />} />
          <StatCard title="Fake Detections" value={stats.fakeDetections} icon={<AlertTriangle className="h-6 w-6" />} variant="danger" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold font-display">Scan Activity (Last 7 Days)</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="scans" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
