import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      const scannerId = 'qr-scanner-container';
      
      if (!document.getElementById(scannerId)) {
        const scannerElement = document.createElement('div');
        scannerElement.id = scannerId;
        containerRef.current.appendChild(scannerElement);
      }

      scannerRef.current = new Html5Qrcode(scannerId);
      
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {}
      );
      
      setIsScanning(true);
      setScannerReady(true);
    } catch (err) {
      onError?.('Failed to start camera. Please check permissions.');
      console.error(err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
    setScannerReady(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const scannerId = 'qr-file-scanner';
      
      if (!document.getElementById(scannerId)) {
        const element = document.createElement('div');
        element.id = scannerId;
        element.style.display = 'none';
        document.body.appendChild(element);
      }

      const html5Qrcode = new Html5Qrcode(scannerId);
      const result = await html5Qrcode.scanFile(file, true);
      onScan(result);
    } catch (err) {
      onError?.('Could not read QR code from image.');
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full max-w-md mx-auto aspect-square rounded-xl overflow-hidden bg-card border border-border"
      >
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-glow"
            >
              <Camera className="h-12 w-12 text-primary-foreground" />
            </motion.div>
            <p className="text-center text-muted-foreground">
              Click below to start scanning or upload a QR code image
            </p>
          </div>
        )}
        
        {isScanning && (
          <button
            onClick={stopScanning}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Scanning overlay */}
        {isScanning && scannerReady && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-64 h-64 border-4 border-accent rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        {!isScanning ? (
          <Button onClick={startScanning} className="gradient-primary">
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        ) : (
          <Button variant="destructive" onClick={stopScanning}>
            <X className="mr-2 h-4 w-4" />
            Stop Scanning
          </Button>
        )}
        
        <label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              Upload QR
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
}
