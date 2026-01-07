import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanLine, Clock, CheckCircle, XCircle, ArrowRight, Package } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ScanHistory {
  id: string;
  product_no: string;
  is_fake: boolean;
  scan_time: string;
  verification_result: string | null;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanHistory[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    originalProducts: 0,
    fakeProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchScanHistory();
    }
  }, [user]);

  const fetchScanHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user?.id)
        .order('scan_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      setScans(data || []);
      
      const totalScans = data?.length || 0;
      const fakeProducts = data?.filter(s => s.is_fake).length || 0;
      const originalProducts = totalScans - fakeProducts;

      setStats({ totalScans, originalProducts, fakeProducts });
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Unified Header Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-success/5 via-success/10 to-primary/5 border border-success/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <ScanLine className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AuthentiScan Platform</p>
                <p className="text-xs text-success font-medium">User Verification Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success">Verified Access</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">
            Welcome back!
          </h1>
          <p className="text-muted-foreground">
            Here's your product verification overview
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Scans"
            value={stats.totalScans}
            icon={<ScanLine className="h-6 w-6" />}
          />
          <StatCard
            title="Original Products"
            value={stats.originalProducts}
            icon={<CheckCircle className="h-6 w-6" />}
            variant="success"
          />
          <StatCard
            title="Fake Detections"
            value={stats.fakeProducts}
            icon={<XCircle className="h-6 w-6" />}
            variant="danger"
          />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          <Link to="/scan">
            <div className="p-6 rounded-xl gradient-primary text-primary-foreground hover:shadow-glow transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold font-display mb-2">
                    Scan Product
                  </h3>
                  <p className="text-primary-foreground/80">
                    Verify a product's authenticity now
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <ScanLine className="h-6 w-6" />
                </div>
              </div>
              <Button variant="secondary" size="sm" className="mt-4">
                Start Scanning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Link>

          <Link to="/report">
            <div className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold font-display mb-2 text-foreground">
                    Report Fake Product
                  </h3>
                  <p className="text-muted-foreground">
                    Help us fight counterfeits
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-danger" />
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4">
                Report Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Link>
        </motion.div>

        {/* Recent Scans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold font-display text-foreground">
              Recent Scans
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : scans.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No scans yet</p>
              <Button asChild className="mt-4">
                <Link to="/scan">Scan Your First Product</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      scan.is_fake ? 'bg-danger/10' : 'bg-success/10'
                    }`}>
                      {scan.is_fake ? (
                        <XCircle className="h-5 w-5 text-danger" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{scan.product_no}</p>
                      <p className="text-sm text-muted-foreground">
                        {scan.verification_result || (scan.is_fake ? 'Fake Product' : 'Original Product')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(scan.scan_time), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
