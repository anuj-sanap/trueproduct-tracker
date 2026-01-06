import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ReportFeedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({ product_no: '', reason: '' });
  const [feedbackData, setFeedbackData] = useState({ subject: '', message: '' });

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('fake_reports').insert({ ...reportData, user_id: user?.id });
    toast({ title: 'Report Submitted', description: 'Thank you for helping us fight counterfeits.' });
    setReportData({ product_no: '', reason: '' });
    setLoading(false);
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('feedback').insert({ ...feedbackData, user_id: user?.id });
    toast({ title: 'Feedback Sent', description: 'Thank you for your feedback!' });
    setFeedbackData({ subject: '', message: '' });
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display">Report & Feedback</h1>
          <p className="text-muted-foreground">Help us improve and fight counterfeits</p>
        </motion.div>

        <Tabs defaultValue="report" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="report"><AlertTriangle className="mr-2 h-4 w-4" />Report Fake</TabsTrigger>
            <TabsTrigger value="feedback"><MessageSquare className="mr-2 h-4 w-4" />Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="report">
            <form onSubmit={handleReport} className="bg-card rounded-xl border p-6 space-y-4">
              <div><Label>Product Number</Label><Input value={reportData.product_no} onChange={e => setReportData(p => ({ ...p, product_no: e.target.value }))} required /></div>
              <div><Label>Reason</Label><Textarea value={reportData.reason} onChange={e => setReportData(p => ({ ...p, reason: e.target.value }))} rows={4} required /></div>
              <Button type="submit" className="w-full gradient-danger" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Submit Report</>}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="feedback">
            <form onSubmit={handleFeedback} className="bg-card rounded-xl border p-6 space-y-4">
              <div><Label>Subject</Label><Input value={feedbackData.subject} onChange={e => setFeedbackData(p => ({ ...p, subject: e.target.value }))} required /></div>
              <div><Label>Message</Label><Textarea value={feedbackData.message} onChange={e => setFeedbackData(p => ({ ...p, message: e.target.value }))} rows={4} required /></div>
              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Send Feedback</>}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
