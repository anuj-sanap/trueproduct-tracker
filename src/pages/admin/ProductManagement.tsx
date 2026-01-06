import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Download, Package } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { generateProductHash, encodeQRPayload } from '@/lib/hash';
import QRCode from 'qrcode';
import { format } from 'date-fns';

interface Product {
  id: string;
  product_no: string;
  product_name: string;
  brand: string;
  manufacture_date: string;
  expiry_date: string;
  qr_hash: string;
  qr_image: string | null;
}

export default function ProductManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    product_no: '', product_name: '', brand: '', manufacture_date: '', expiry_date: ''
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = await generateProductHash(formData);
    const qrPayload = encodeQRPayload({ hash, product_no: formData.product_no });
    const qrImage = await QRCode.toDataURL(qrPayload, { width: 300, margin: 2 });

    if (editingProduct) {
      await supabase.from('products').update({ ...formData, qr_hash: hash, qr_image: qrImage }).eq('id', editingProduct.id);
      toast({ title: 'Product Updated' });
    } else {
      await supabase.from('products').insert({ ...formData, qr_hash: hash, qr_image: qrImage, created_by: user?.id });
      toast({ title: 'Product Added' });
    }
    setDialogOpen(false);
    setEditingProduct(null);
    setFormData({ product_no: '', product_name: '', brand: '', manufacture_date: '', expiry_date: '' });
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    toast({ title: 'Product Deleted' });
    fetchProducts();
  };

  const downloadQR = (product: Product) => {
    if (!product.qr_image) return;
    const link = document.createElement('a');
    link.href = product.qr_image;
    link.download = `QR_${product.product_no}.png`;
    link.click();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display">Product Management</h1>
            <p className="text-muted-foreground">Add and manage registered products</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={() => { setEditingProduct(null); setFormData({ product_no: '', product_name: '', brand: '', manufacture_date: '', expiry_date: '' }); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Product No</Label><Input value={formData.product_no} onChange={e => setFormData(p => ({ ...p, product_no: e.target.value }))} required /></div>
                <div><Label>Product Name</Label><Input value={formData.product_name} onChange={e => setFormData(p => ({ ...p, product_name: e.target.value }))} required /></div>
                <div><Label>Brand</Label><Input value={formData.brand} onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))} required /></div>
                <div><Label>Manufacture Date</Label><Input type="date" value={formData.manufacture_date} onChange={e => setFormData(p => ({ ...p, manufacture_date: e.target.value }))} required /></div>
                <div><Label>Expiry Date</Label><Input type="date" value={formData.expiry_date} onChange={e => setFormData(p => ({ ...p, expiry_date: e.target.value }))} required /></div>
                <Button type="submit" className="w-full">{editingProduct ? 'Update' : 'Add'} Product</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          {loading ? <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div> :
            products.length === 0 ? <div className="p-12 text-center"><Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No products yet</p></div> :
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50"><tr className="text-left text-sm">
                  <th className="p-4">Product No</th><th className="p-4">Name</th><th className="p-4">Brand</th><th className="p-4">Expiry</th><th className="p-4">QR</th><th className="p-4">Actions</th>
                </tr></thead>
                <tbody className="divide-y">{products.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="p-4 font-medium">{p.product_no}</td>
                    <td className="p-4">{p.product_name}</td>
                    <td className="p-4">{p.brand}</td>
                    <td className="p-4">{format(new Date(p.expiry_date), 'MMM d, yyyy')}</td>
                    <td className="p-4">{p.qr_image && <img src={p.qr_image} alt="QR" className="w-12 h-12" />}</td>
                    <td className="p-4 flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => downloadQR(p)}><Download className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { setEditingProduct(p); setFormData(p); setDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>}
        </div>
      </div>
    </Layout>
  );
}
