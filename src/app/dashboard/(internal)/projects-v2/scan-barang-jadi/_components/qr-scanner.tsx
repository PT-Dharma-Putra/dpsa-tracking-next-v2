'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QrScannerProps {
  onScan: (result: string) => void;
  isActive: boolean;
}

export function QrScanner({ onScan, isActive }: QrScannerProps) {
  const scannerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const elementId = 'qr-scanner-region';
  const lastScanRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    let mounted = true;

    const startScanner = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;

        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            // Debounce: skip duplicate scans within 2 seconds
            if (lastScanRef.current === decodedText) return;
            lastScanRef.current = decodedText;
            setTimeout(() => {
              lastScanRef.current = null;
            }, 2000);
            onScan(decodedText);
          },
          undefined
        );
      } catch (err: any) {
        if (mounted) {
          setError(
            err?.message?.includes('Permission')
              ? 'Izin kamera ditolak. Mohon izinkan akses kamera.'
              : 'Gagal membuka kamera. Pastikan kamera tersedia.'
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isActive, onScan]);

  return (
    <div className='flex flex-col items-center gap-3'>
      {isLoading && (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Membuka kamera...
        </div>
      )}
      {error && (
        <div className='flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          <CameraOff className='h-4 w-4 shrink-0' />
          {error}
        </div>
      )}
      <div
        id={elementId}
        className='w-full overflow-hidden rounded-lg border bg-black'
        style={{ minHeight: isActive && !error ? 300 : 0 }}
      />
    </div>
  );
}
