import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Download, Package, Upload, X, Image as ImageIcon } from 'lucide-react';
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
  product_image: string | null;
}

export default function ProductManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    product_no: '', product_name: '', brand: '', manufacture_date: '', expiry_date: ''
  });

  useEffect(() => { 
    fetchProducts();
    checkStorageBucket();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } else {
      // Ensure product_image field exists (can be null) and map to Product type
      const productsWithImage: Product[] = (data || []).map((product: any) => ({
        id: product.id,
        product_no: product.product_no,
        product_name: product.product_name,
        brand: product.brand,
        manufacture_date: product.manufacture_date,
        expiry_date: product.expiry_date,
        qr_hash: product.qr_hash,
        qr_image: product.qr_image || null,
        product_image: (product as any).product_image || null,
      }));
      setProducts(productsWithImage);
    }
    setLoading(false);
  };

  const checkStorageBucket = async () => {
    try {
      // Try to list buckets to verify access
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        // Don't show error if user doesn't have permission to list buckets
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.id === 'product-images');
      
      if (!bucketExists) {
        console.warn('Storage bucket "product-images" not found.');
        // Only show toast once, not on every page load
        const hasShownError = sessionStorage.getItem('bucket-error-shown');
        if (!hasShownError) {
          toast({ 
            title: 'Storage bucket not found', 
            description: 'Open QUICK_FIX.sql file, copy all SQL code, paste it in Supabase SQL Editor and click RUN. Or create bucket manually: Dashboard → Storage → New bucket → Name: product-images → Public: ON', 
            variant: 'destructive',
            duration: 20000
          });
          sessionStorage.setItem('bucket-error-shown', 'true');
        }
      } else {
        // Bucket exists, clear the error flag
        sessionStorage.removeItem('bucket-error-shown');
        // Try to list files to verify permissions
        const { error: listError } = await supabase.storage.from('product-images').list('', { limit: 1 });
        if (listError && !listError.message?.includes('not found')) {
          console.warn('Bucket exists but may have permission issues:', listError);
        }
      }
    } catch (error) {
      console.warn('Could not verify storage bucket:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image smaller than 5MB', variant: 'destructive' });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, selectedImage, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        console.error('Error message:', uploadError.message);
        console.error('Error name:', uploadError.name);
        
        // Check if bucket doesn't exist
        const errorMessage = uploadError.message?.toLowerCase() || '';
        if (errorMessage.includes('bucket not found') || 
            errorMessage.includes('not found') ||
            errorMessage.includes('the resource was not found') ||
            errorMessage.includes('404')) {
          toast({ 
            title: 'Storage bucket not found', 
            description: 'The "product-images" bucket does not exist. Open CREATE_BUCKET.sql file and run it in Supabase SQL Editor, or create it manually in Dashboard → Storage → New bucket.', 
            variant: 'destructive',
            duration: 15000
          });
        } else if (errorMessage.includes('new row violates row-level security policy') ||
                   errorMessage.includes('permission denied') ||
                   errorMessage.includes('403') ||
                   errorMessage.includes('forbidden')) {
          toast({ 
            title: 'Permission denied', 
            description: 'You do not have permission to upload images. Please verify you have admin role and the storage policies are set correctly. Run CREATE_BUCKET.sql to set up policies.', 
            variant: 'destructive',
            duration: 15000
          });
        } else {
          toast({ 
            title: 'Upload failed', 
            description: uploadError.message || 'Failed to upload image. Please check the browser console for details.', 
            variant: 'destructive',
            duration: 10000
          });
        }
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      // Error already handled above, just return null
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      if (!imageUrl) return;
      
      // Extract file path from Supabase storage URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/product-images/products/filename.jpg
      const urlParts = imageUrl.split('/');
      const productsIndex = urlParts.findIndex(part => part === 'products');
      
      if (productsIndex !== -1) {
        // Get everything after 'products/' including the filename
        const filePath = urlParts.slice(productsIndex).join('/');
        
        const { error } = await supabase.storage
          .from('product-images')
          .remove([filePath]);

        if (error) {
          console.error('Error deleting image from storage:', error);
          // Don't throw - allow product deletion even if image deletion fails
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw - allow product deletion even if image deletion fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingImage(true);
    
    try {
      let productImageUrl = editingProduct?.product_image || null;
      
      // Upload new image if selected
      if (selectedImage) {
        // Delete old image if editing
        if (editingProduct?.product_image) {
          await deleteImage(editingProduct.product_image);
        }
        productImageUrl = await uploadImage();
        if (!productImageUrl && selectedImage) {
          // Error message already shown in uploadImage function
          setUploadingImage(false);
          return;
        }
      }

      const hash = await generateProductHash(formData);
      const qrPayload = encodeQRPayload({ hash, product_no: formData.product_no });
      const qrImage = await QRCode.toDataURL(qrPayload, { width: 300, margin: 2 });

      const updateData: any = {
        ...formData,
        qr_hash: hash,
        qr_image: qrImage,
      };

      if (productImageUrl !== null) {
        updateData.product_image = productImageUrl;
      }

      if (editingProduct) {
        await supabase.from('products').update(updateData).eq('id', editingProduct.id);
        toast({ title: 'Product Updated' });
      } else {
        await supabase.from('products').insert({ ...updateData, created_by: user?.id });
        toast({ title: 'Product Added' });
      }
      
      setDialogOpen(false);
      setEditingProduct(null);
      setFormData({ product_no: '', product_name: '', brand: '', manufacture_date: '', expiry_date: '' });
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (product?.product_image) {
      await deleteImage(product.product_image);
    }
    await supabase.from('products').delete().eq('id', id);
    toast({ title: 'Product Deleted' });
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_no: product.product_no,
      product_name: product.product_name,
      brand: product.brand,
      manufacture_date: product.manufacture_date,
      expiry_date: product.expiry_date
    });
    setImagePreview(product.product_image || null);
    setSelectedImage(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingProduct(null);
      setFormData({ product_no: '', product_name: '', brand: '', manufacture_date: '', expiry_date: '' });
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setDialogOpen(open);
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
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={() => { setEditingProduct(null); setFormData({ product_no: '', product_name: '', brand: '', manufacture_date: '', expiry_date: '' }); setImagePreview(null); setSelectedImage(null); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Product No</Label><Input value={formData.product_no} onChange={e => setFormData(p => ({ ...p, product_no: e.target.value }))} required /></div>
                <div><Label>Product Name</Label><Input value={formData.product_name} onChange={e => setFormData(p => ({ ...p, product_name: e.target.value }))} required /></div>
                <div><Label>Brand</Label><Input value={formData.brand} onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))} required /></div>
                <div><Label>Manufacture Date</Label><Input type="date" value={formData.manufacture_date} onChange={e => setFormData(p => ({ ...p, manufacture_date: e.target.value }))} required /></div>
                <div><Label>Expiry Date</Label><Input type="date" value={formData.expiry_date} onChange={e => setFormData(p => ({ ...p, expiry_date: e.target.value }))} required /></div>
                
                {/* Image Upload Section */}
                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <div className="space-y-3">
                    {imagePreview && (
                      <div className="relative w-full h-48 rounded-lg border border-border overflow-hidden bg-muted">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedImage(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <Label htmlFor="product-image-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            {imagePreview ? 'Change Image' : 'Upload Image'}
                          </span>
                        </Button>
                      </Label>
                      {selectedImage && (
                        <span className="text-sm text-muted-foreground">
                          {selectedImage.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, PNG, GIF. Max size: 5MB
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading...' : editingProduct ? 'Update' : 'Add'} Product
                </Button>
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
                  <th className="p-4">Image</th><th className="p-4">Product No</th><th className="p-4">Name</th><th className="p-4">Brand</th><th className="p-4">Expiry</th><th className="p-4">QR</th><th className="p-4">Actions</th>
                </tr></thead>
                <tbody className="divide-y">{products.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      {p.product_image ? (
                        <img src={p.product_image} alt={p.product_name} className="w-16 h-16 object-cover rounded-lg border border-border" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-border bg-muted flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium">{p.product_no}</td>
                    <td className="p-4">{p.product_name}</td>
                    <td className="p-4">{p.brand}</td>
                    <td className="p-4">{format(new Date(p.expiry_date), 'MMM d, yyyy')}</td>
                    <td className="p-4">{p.qr_image && <img src={p.qr_image} alt="QR" className="w-12 h-12" />}</td>
                    <td className="p-4 flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => downloadQR(p)}><Download className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
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
