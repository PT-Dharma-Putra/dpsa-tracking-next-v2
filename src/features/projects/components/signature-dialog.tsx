'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { suratSerahTerimaService, UserSignature } from '@/features/projects/services/surat-serah-terima-service';
import { Loader2, Eraser, Check, Upload, PenTool } from 'lucide-react';
import { toast } from 'sonner';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (signature: UserSignature) => void;
}

export function SignatureDialog({
  open,
  onOpenChange,
  onSuccess,
}: SignatureDialogProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
  const [existingSignature, setExistingSignature] = useState<UserSignature | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Upload file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadSignature();
      resetCanvas();
    }
  }, [open]);

  const loadSignature = async () => {
    try {
      setLoading(true);
      const res = await suratSerahTerimaService.getMySignature();
      if (res.signature) {
        setExistingSignature(res.signature);
      }
    } catch (err) {
      console.error('Error fetching signature:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar (PNG/JPG)');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      let payload: File | string | null = null;

      if (activeTab === 'draw') {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) {
          toast.error('Silakan buat tanda tangan terlebih dahulu pada bidang kanvas');
          return;
        }
        payload = canvas.toDataURL('image/png');
      } else {
        if (!selectedFile) {
          toast.error('Pilih file gambar tanda tangan terlebih dahulu');
          return;
        }
        payload = selectedFile;
      }

      const res = await suratSerahTerimaService.uploadSignature(payload);
      toast.success('Tanda tangan berhasil disimpan');
      setExistingSignature(res.signature);
      onSuccess?.(res.signature);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan tanda tangan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <PenTool className='h-5 w-5 text-primary' />
            Atur Tanda Tangan Digital
          </DialogTitle>
          <DialogDescription>
            Tanda tangan ini akan otomatis digunakan pada dokumen projek (serah terima gambar, order pekerjaan produksi, dll) saat Anda menyerahkan atau menerima berkas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center p-8'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='space-y-4'>
            {existingSignature?.file_url && (
              <div className='rounded-lg border bg-muted/30 p-3'>
                <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Tanda Tangan Saat Ini
                </Label>
                <div className='mt-2 flex items-center justify-center rounded border bg-white p-2'>
                  <img
                    src={existingSignature.file_url}
                    alt='Tanda Tangan'
                    className='max-h-24 object-contain'
                  />
                </div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'draw' | 'upload')}>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='draw' className='flex items-center gap-2'>
                  <PenTool className='h-4 w-4' />
                  Gores Tanda Tangan
                </TabsTrigger>
                <TabsTrigger value='upload' className='flex items-center gap-2'>
                  <Upload className='h-4 w-4' />
                  Upload Gambar
                </TabsTrigger>
              </TabsList>

              <TabsContent value='draw' className='space-y-3 pt-2'>
                <div className='rounded-lg border bg-white p-2 text-center'>
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={180}
                    className='w-full cursor-crosshair touch-none rounded border border-dashed border-gray-300 bg-slate-50'
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Gunakan mouse atau sentuhan layar untuk menandatangani di dalam kotak
                  </p>
                </div>
                <div className='flex justify-end'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={resetCanvas}
                    className='gap-1 text-xs text-destructive hover:bg-destructive/10'
                  >
                    <Eraser className='h-3.5 w-3.5' />
                    Hapus Goresan
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value='upload' className='space-y-3 pt-2'>
                <div className='space-y-2'>
                  <Label>Pilih Berkas Gambar (PNG Transparan disarankan)</Label>
                  <Input
                    type='file'
                    accept='image/png,image/jpeg,image/webp'
                    onChange={handleFileChange}
                  />
                </div>
                {previewUrl && (
                  <div className='rounded-lg border bg-white p-3 text-center'>
                    <Label className='text-xs text-muted-foreground'>Pratinjau File</Label>
                    <img
                      src={previewUrl}
                      alt='Preview'
                      className='mx-auto mt-2 max-h-28 object-contain'
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            type='button'
            onClick={handleSave}
            disabled={submitting}
            className='gap-1.5'
          >
            {submitting ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Check className='h-4 w-4' />
            )}
            Simpan Tanda Tangan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
