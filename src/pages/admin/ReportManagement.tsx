import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface FakeReport {
  id: string;
  product_no: string;
  product_id: string | null;
  user_id: string | null;
  reason: string;
  status: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function ReportManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<FakeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<FakeReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Fetch reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('fake_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set((reportsData || []).map(r => r.user_id).filter(Boolean))];
      let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = { full_name: profile.full_name, email: profile.email };
            return acc;
          }, {} as Record<string, { full_name: string | null; email: string | null }>);
        }
      }

      // Merge reports with profiles
      const reportsWithProfiles = (reportsData || []).map(report => ({
        ...report,
        profiles: report.user_id ? profilesMap[report.user_id] || null : null,
      }));

      setReports(reportsWithProfiles);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({ title: 'Error', description: 'Failed to load reports', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user?.id;
      } else if (newStatus === 'pending') {
        updateData.resolved_at = null;
        updateData.resolved_by = null;
      }

      const { error } = await supabase
        .from('fake_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      toast({ title: 'Success', description: `Report status updated to ${newStatus}` });
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({ title: 'Error', description: 'Failed to update report status', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="mr-1 h-3 w-3" />Resolved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display">Report Management</h1>
            <p className="text-muted-foreground">View and manage fake product reports</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reports yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-sm">
                    <th className="p-4">Product No</th>
                    <th className="p-4">Reported By</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/30">
                      <td className="p-4 font-medium">{report.product_no}</td>
                      <td className="p-4">
                        {report.profiles ? (
                          <div>
                            <div className="font-medium">{report.profiles.full_name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{report.profiles.email || 'No email'}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown User</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs truncate" title={report.reason}>
                          {report.reason}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(report.status)}</td>
                      <td className="p-4">
                        {report.created_at
                          ? format(new Date(report.created_at), 'MMM d, yyyy HH:mm')
                          : 'N/A'}
                      </td>
                      <td className="p-4 flex gap-2">
                        <Dialog open={dialogOpen && selectedReport?.id === report.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) setSelectedReport(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReport(report);
                                setDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Report Details</DialogTitle>
                            </DialogHeader>
                            {selectedReport && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Product Number</label>
                                  <p className="text-lg font-semibold">{selectedReport.product_no}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Reported By</label>
                                  <p className="text-base">
                                    {selectedReport.profiles?.full_name || 'Unknown User'}
                                    {selectedReport.profiles?.email && (
                                      <span className="text-muted-foreground ml-2">({selectedReport.profiles.email})</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Reason</label>
                                  <p className="text-base whitespace-pre-wrap">{selectedReport.reason}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Reported At</label>
                                  <p className="text-base">
                                    {selectedReport.created_at
                                      ? format(new Date(selectedReport.created_at), 'PPpp')
                                      : 'N/A'}
                                  </p>
                                </div>
                                {selectedReport.resolved_at && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Resolved At</label>
                                    <p className="text-base">
                                      {format(new Date(selectedReport.resolved_at), 'PPpp')}
                                    </p>
                                  </div>
                                )}
                                <div className="flex gap-2 pt-4 border-t">
                                  {selectedReport.status !== 'resolved' && (
                                    <Button
                                      onClick={() => {
                                        handleStatusUpdate(selectedReport.id, 'resolved');
                                        setDialogOpen(false);
                                      }}
                                      className="gradient-primary"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Mark as Resolved
                                    </Button>
                                  )}
                                  {selectedReport.status !== 'rejected' && (
                                    <Button
                                      onClick={() => {
                                        handleStatusUpdate(selectedReport.id, 'rejected');
                                        setDialogOpen(false);
                                      }}
                                      variant="destructive"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </Button>
                                  )}
                                  {selectedReport.status !== 'pending' && (
                                    <Button
                                      onClick={() => {
                                        handleStatusUpdate(selectedReport.id, 'pending');
                                        setDialogOpen(false);
                                      }}
                                      variant="outline"
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      Reset to Pending
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <div className="flex gap-1">
                          {report.status !== 'resolved' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusUpdate(report.id, 'resolved')}
                              title="Mark as Resolved"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {report.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusUpdate(report.id, 'rejected')}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

