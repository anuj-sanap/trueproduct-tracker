import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Calendar, Building, Hash } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { QRScanner } from '@/components/scanner/QRScanner';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { decodeQRPayload, verifyProductHash, isProductExpired } from '@/lib/hash';
import { format } from 'date-fns';

interface ProductDetails {
  id: string;
  product_no: string;
  product_name: string;
  brand: string;
  manufacture_date: string;
  expiry_date: string;
}

type VerificationStatus = 'original' | 'fake' | 'expired' | 'unknown' | null;

export default function ScanProduct() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [productNo, setProductNo] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'qr' | 'manual'>('qr');

  const verifyProduct = async (productNumber: string, qrHash?: string) => {
    setLoading(true);
    setVerificationStatus(null);
    setProductDetails(null);

    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_no', productNumber)
        .single();

      if (error || !product) {
        setVerificationStatus('unknown');
        await recordScan(productNumber, true, 'Product not found in database');
        toast({
          title: 'Product Not Found',
          description: 'This product number is not registered in our system.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      setProductDetails(product);

      // Check expiry first
      if (isProductExpired(product.expiry_date)) {
        setVerificationStatus('expired');
        await recordScan(productNumber, true, 'Product expired');
        toast({
          title: 'Product Expired',
          description: 'This product has passed its expiry date.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // If QR hash provided, verify it
      if (qrHash) {
        const isValid = await verifyProductHash(qrHash, {
          product_no: product.product_no,
          product_name: product.product_name,
          brand: product.brand,
          manufacture_date: product.manufacture_date,
          expiry_date: product.expiry_date,
        });

        if (isValid && qrHash === product.qr_hash) {
          setVerificationStatus('original');
          await recordScan(productNumber, false, 'Hash verified - Original');
          toast({
            title: 'Product Verified!',
            description: 'This is an authentic product.',
          });
        } else {
          setVerificationStatus('fake');
          await recordScan(productNumber, true, 'Hash mismatch - Fake');
          toast({
            title: 'Warning: Counterfeit Detected',
            description: 'This product appears to be fake. The verification hash does not match.',
            variant: 'destructive',
          });
        }
      } else {
        // Manual entry - just verify product exists
        setVerificationStatus('original');
        await recordScan(productNumber, false, 'Manual verification - Product exists');
        toast({
          title: 'Product Found',
          description: 'Product exists in database. For full verification, please scan the QR code.',
        });
      }
    } catch (err) {
      console.error('Verification error:', err);
      toast({
        title: 'Verification Error',
        description: 'An error occurred during verification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const recordScan = async (productNo: string, isFake: boolean, result: string) => {
    if (!user) return;

    try {
      await supabase.from('scans').insert({
        product_no: productNo,
        user_id: user.id,
        is_fake: isFake,
        verification_result: result,
      });
    } catch (err) {
      console.error('Error recording scan:', err);
    }
  };

  const handleQRScan = async (data: string) => {
    const payload = decodeQRPayload(data);
    
    if (payload) {
      setProductNo(payload.product_no);
      await verifyProduct(payload.product_no, payload.hash);
    } else {
      // Try as plain product number
      setProductNo(data);
      await verifyProduct(data);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productNo.trim()) return;
    await verifyProduct(productNo.trim());
  };

  const resetScan = () => {
    setVerificationStatus(null);
    setProductDetails(null);
    setProductNo('');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">
            Verify Product
          </h1>
          <p className="text-muted-foreground">
            Scan a QR code or enter the product number to verify authenticity
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={scanMode === 'qr' ? 'default' : 'outline'}
            onClick={() => setScanMode('qr')}
          >
            Scan QR Code
          </Button>
          <Button
            variant={scanMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setScanMode('manual')}
          >
            Enter Product No
          </Button>
        </div>

        {verificationStatus ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            {/* Verification Result */}
            <div className="bg-card rounded-xl border border-border p-8 text-center mb-6">
              <VerificationBadge status={verificationStatus} size="lg" />
              
              {productDetails && (
                <div className="mt-8 text-left space-y-4">
                  <h3 className="text-lg font-semibold font-display text-foreground border-b border-border pb-2">
                    Product Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Hash className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Product No</p>
                        <p className="font-medium text-foreground">{productDetails.product_no}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Product Name</p>
                        <p className="font-medium text-foreground">{productDetails.product_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Brand</p>
                        <p className="font-medium text-foreground">{productDetails.brand}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Manufacture Date</p>
                        <p className="font-medium text-foreground">
                          {format(new Date(productDetails.manufacture_date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Expiry Date</p>
                        <p className={`font-medium ${
                          isProductExpired(productDetails.expiry_date) ? 'text-danger' : 'text-foreground'
                        }`}>
                          {format(new Date(productDetails.expiry_date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={resetScan} className="w-full">
              Scan Another Product
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            {scanMode === 'qr' ? (
              <QRScanner
                onScan={handleQRScan}
                onError={(error) => toast({
                  title: 'Scanner Error',
                  description: error,
                  variant: 'destructive',
                })}
              />
            ) : (
              <form onSubmit={handleManualSearch} className="bg-card rounded-xl border border-border p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productNo">Product Number</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="productNo"
                        placeholder="Enter product number"
                        value={productNo}
                        onChange={(e) => setProductNo(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Verify Product
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
