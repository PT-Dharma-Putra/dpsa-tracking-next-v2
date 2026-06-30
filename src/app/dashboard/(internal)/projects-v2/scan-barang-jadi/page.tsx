'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Camera,
  CameraOff,
  Package,
  CheckCircle2,
  Loader2,
  Building2,
  Hash,
  Layers,
  ClipboardList,
  Upload,
  X,
  ScanLine,
  Keyboard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { QrScanner } from './_components/qr-scanner';
import { ScanBarangJadiService } from '@/features/scan-barang-jadi/services/scan-barang-jadi-service';

interface ScanRecord {
  id: string;
  recordId: number; // barang_jadi_masuk.id in DB
  itemId: number;
  itemName: string;
  project: string;
  lantai: string | null;
  ruang: string | null;
  jumlah: number;
  tanggal: string;
  scannedAt: string;
  source: 'camera' | 'external' | 'manual';
}

export default function ScanBarangJadiPage() {
  const queryClient = useQueryClient();

  // --- scanner input (external barcode device) ---
  const [externalInput, setExternalInput] = useState('');
  const externalInputRef = useRef<HTMLInputElement>(null);

  // --- camera ---
  const [isCameraActive, setIsCameraActive] = useState(false);

  // --- manual form ---
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualItemId, setManualItemId] = useState('');
  const [manualJumlah, setManualJumlah] = useState('');
  const [manualFileSetrim, setManualFileSetrim] = useState<File | null>(null);

  // --- shared ---
  const [tanggal, setTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scanRecords, setScanRecords] = useState<ScanRecord[]>([]);

  // --- refs ---
  const submitSourceRef = useRef<'camera' | 'external' | 'manual'>('external');
  const autoSubmitRef = useRef(false);
  // The ID being queried for item detail (manual form lookup)
  const [manualQueryId, setManualQueryId] = useState<string | null>(null);
  // The ID being auto-submitted (camera / external)
  const [autoQueryId, setAutoQueryId] = useState<string | null>(null);

  // Auto-focus external scanner input on mount
  useEffect(() => {
    externalInputRef.current?.focus();
  }, []);

  // ── Query for auto-submit (camera & external scanner) ──
  const {
    data: autoItemDetail,
    isLoading: isAutoLoading,
    isError: isAutoError,
  } = useQuery({
    queryKey: ['project-item-detail-auto', autoQueryId],
    queryFn: () => ScanBarangJadiService.getItemDetail(autoQueryId!),
    enabled: !!autoQueryId,
    retry: false,
    staleTime: 0,  // always fetch fresh — never use cached data for qty check
    gcTime: 0,
  });

  // ── Query for manual form (shows detail before submit) ──
  const {
    data: manualItemDetail,
    isLoading: isManualLoading,
    isError: isManualError,
  } = useQuery({
    queryKey: ['project-item-detail-manual', manualQueryId],
    queryFn: () => ScanBarangJadiService.getItemDetail(manualQueryId!),
    enabled: !!manualQueryId,
    retry: false,
  });

  // ── Mutation ──
  const submitMutation = useMutation({
    mutationFn: (data: {
      itemId: number;
      jumlah: number;
      tanggal: string;
      file?: File | null;
    }) =>
      ScanBarangJadiService.submitBarangJadiMasuk(data.itemId, {
        tanggal: data.tanggal,
        jumlah: data.jumlah,
        file_setrim: data.file ?? null,
      }),
    onSuccess: (response, variables) => {
      const detail =
        submitSourceRef.current === 'manual' ? manualItemDetail : autoItemDetail;
      if (!detail) return;

      setScanRecords((prev) => [
        {
          id: crypto.randomUUID(),
          recordId: response.data.id,
          itemId: variables.itemId,
          itemName: detail.item,
          project: detail.project?.name ?? '-',
          lantai: detail.lantai,
          ruang: detail.ruang,
          jumlah: variables.jumlah,
          tanggal: variables.tanggal,
          scannedAt: new Date().toISOString(),
          source: submitSourceRef.current,
        },
        ...prev,
      ]);

      toast.success(`+${variables.jumlah} — ${detail.item}`);

      const src = submitSourceRef.current;

      if (src === 'camera') {
        queryClient.removeQueries({ queryKey: ['project-item-detail-auto'] });
        setAutoQueryId(null);
        setIsCameraActive(true);
      } else if (src === 'external') {
        queryClient.removeQueries({ queryKey: ['project-item-detail-auto'] });
        setAutoQueryId(null);
        setTimeout(() => externalInputRef.current?.focus(), 50);
      } else {
        // manual
        queryClient.invalidateQueries({
          queryKey: ['project-item-detail-manual', manualQueryId],
        });
        setManualItemId('');
        setManualJumlah('');
        setManualFileSetrim(null);
        setManualQueryId(null);
        setTimeout(() => externalInputRef.current?.focus(), 50);
      }
    },
    onError: () => {
      toast.error('Gagal menyimpan data. Silakan coba lagi.');
      autoSubmitRef.current = false;
      setTimeout(() => externalInputRef.current?.focus(), 50);
    },
  });

  // Auto-submit when auto item detail loads (camera or external scanner)
  useEffect(() => {
    if (
      !autoSubmitRef.current ||
      !autoItemDetail ||
      isAutoLoading ||
      submitMutation.isPending
    )
      return;
    autoSubmitRef.current = false;

    const totalMasuk =
      autoItemDetail.barang_jadi_masuk?.reduce((s, r) => s + r.jumlah, 0) ?? 0;

    if (totalMasuk >= autoItemDetail.jumlah) {
      toast.error(
        `"${autoItemDetail.item}" sudah memenuhi qty order (${autoItemDetail.jumlah} ${autoItemDetail.satuan ?? 'pcs'}).`
      );
      setAutoQueryId(null);
      setTimeout(() => externalInputRef.current?.focus(), 50);
      return;
    }

    submitMutation.mutate({
      itemId: autoItemDetail.id,
      jumlah: 1,
      tanggal,
      file: null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoItemDetail, isAutoLoading]);

  // Reset flag on error
  useEffect(() => {
    if (isAutoError) {
      autoSubmitRef.current = false;
      toast.error('Item tidak ditemukan.');
      setAutoQueryId(null);
      setTimeout(() => externalInputRef.current?.focus(), 50);
    }
  }, [isAutoError]);

  // ── Handlers ──

  // Way 1: camera
  const handleCameraScan = useCallback((result: string) => {
    submitSourceRef.current = 'camera';
    autoSubmitRef.current = true;
    setIsCameraActive(false);
    setAutoQueryId(result.trim());
  }, []);

  // Way 2: external barcode scanner (types into externalInput)
  const handleExternalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExternalInput(e.target.value);
  };

  const handleExternalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !externalInput.trim()) return;
    submitSourceRef.current = 'external';
    autoSubmitRef.current = true;
    setAutoQueryId(externalInput.trim());
    setExternalInput('');
  };

  // Way 3: manual form submit
  const handleManualSubmit = () => {
    if (!manualItemDetail) return;
    const qty = parseInt(manualJumlah);
    if (!manualJumlah || isNaN(qty) || qty <= 0) {
      toast.error('Masukkan jumlah yang valid.');
      return;
    }

    const totalMasuk =
      manualItemDetail.barang_jadi_masuk?.reduce((s, r) => s + r.jumlah, 0) ?? 0;
    const sisa = manualItemDetail.jumlah - totalMasuk;

    if (sisa <= 0) {
      toast.error(
        `"${manualItemDetail.item}" sudah memenuhi qty order (${manualItemDetail.jumlah} ${manualItemDetail.satuan ?? 'pcs'}).`
      );
      return;
    }
    if (qty > sisa) {
      toast.error(
        `Jumlah melebihi sisa order. Sisa: ${sisa} ${manualItemDetail.satuan ?? 'pcs'}.`
      );
      return;
    }

    submitSourceRef.current = 'manual';
    autoSubmitRef.current = false;
    submitMutation.mutate({
      itemId: manualItemDetail.id,
      jumlah: qty,
      tanggal,
      file: manualFileSetrim,
    });
  };

  const handleManualIdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && manualItemId.trim()) {
      setManualQueryId(manualItemId.trim());
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (recordId: number) =>
      ScanBarangJadiService.deleteBarangJadiMasuk(recordId),
    onSuccess: (_, recordId) => {
      setScanRecords((prev) => prev.filter((r) => r.recordId !== recordId));
      toast.success('Data berhasil dihapus.');
    },
    onError: () => {
      toast.error('Gagal menghapus data.');
    },
  });

  const handleDeleteRecord = (rec: ScanRecord) => {
    deleteMutation.mutate(rec.recordId);
  };

  const manualTotalMasuk =
    manualItemDetail?.barang_jadi_masuk?.reduce((s, r) => s + r.jumlah, 0) ?? 0;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight pt-4'>Scan Barang Jadi</h1>
        <p className='text-sm text-muted-foreground'>
          Catat barang jadi masuk via scanner eksternal, kamera, atau input manual.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* ═══ PANEL KIRI — Input ═══ */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <ScanLine className='h-4 w-4' />
              Input Scan
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>

            {/* ── Way 2: External Scanner (default, auto-focused) ── */}
            <div className='space-y-1.5'>
              <Label className='text-xs flex items-center gap-1.5 font-medium'>
                Scanner Eksternal
                <Badge variant='secondary' className='text-[10px] px-1.5 py-0'>
                  default
                </Badge>
              </Label>
              <Input
                ref={externalInputRef}
                placeholder='Arahkan scanner ke sini, scan barcode...'
                value={externalInput}
                onChange={handleExternalInputChange}
                onKeyDown={handleExternalKeyDown}
                autoComplete='off'
                autoCorrect='off'
                autoCapitalize='off'
                spellCheck={false}
                className='font-mono'
              />
              <p className='text-[11px] text-muted-foreground'>
                Input ini auto-fokus saat halaman dibuka. Scan barcode → langsung tersimpan (qty 1).
              </p>
            </div>

            <div className='flex items-center gap-2'>
              <div className='h-px flex-1 bg-border' />
              <span className='text-xs text-muted-foreground'>atau</span>
              <div className='h-px flex-1 bg-border' />
            </div>

            {/* ── Way 1: Camera ── */}
            <div className='space-y-3'>
              <Button
                variant={isCameraActive ? 'destructive' : 'outline'}
                className='w-full gap-2'
                onClick={() => {
                  setIsCameraActive((prev) => !prev);
                  if (isCameraActive) {
                    setTimeout(() => externalInputRef.current?.focus(), 50);
                  }
                }}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className='h-4 w-4' />
                    Tutup Kamera
                  </>
                ) : (
                  <>
                    <Camera className='h-4 w-4' />
                    Buka Kamera
                  </>
                )}
              </Button>
              <QrScanner onScan={handleCameraScan} isActive={isCameraActive} />
            </div>

            {/* ── Way 3: Manual ── */}
            <Button
              variant='outline'
              className='w-full gap-2'
              onClick={() => setShowManualForm((prev) => !prev)}
            >
              <Keyboard className='h-4 w-4' />
              Input Manual
              {showManualForm ? (
                <ChevronUp className='h-4 w-4 ml-auto' />
              ) : (
                <ChevronDown className='h-4 w-4 ml-auto' />
              )}
            </Button>

            {showManualForm && (
              <div className='rounded-lg border bg-muted/30 p-4 space-y-3'>
                {/* ID lookup */}
                <div className='space-y-1.5'>
                  <Label className='text-xs'>ID Item</Label>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Masukkan ID item...'
                      value={manualItemId}
                      onChange={(e) => {
                        setManualItemId(e.target.value);
                        setManualQueryId(null);
                      }}
                      onKeyDown={handleManualIdKeyDown}
                      autoComplete='off'
                      className='font-mono'
                    />
                    <Button
                      variant='outline'
                      onClick={() => manualItemId.trim() && setManualQueryId(manualItemId.trim())}
                      disabled={!manualItemId.trim()}
                    >
                      Cari
                    </Button>
                  </div>
                </div>

                {/* Item detail preview */}
                {isManualLoading && (
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    Mencari item...
                  </div>
                )}
                {isManualError && !isManualLoading && (
                  <p className='text-xs text-destructive'>
                    Item tidak ditemukan.
                  </p>
                )}
                {manualItemDetail && !isManualLoading && (
                  <div className='rounded-md border bg-background px-3 py-2 space-y-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='text-xs font-semibold leading-tight'>{manualItemDetail.item}</p>
                      <Badge variant='outline' className='text-[10px] shrink-0'>
                        ID {manualItemDetail.id}
                      </Badge>
                    </div>
                    <p className='text-[11px] text-muted-foreground'>
                      {manualItemDetail.project?.name ?? '-'}
                      {manualItemDetail.lantai ? ` · Lt. ${manualItemDetail.lantai}` : ''}
                      {manualItemDetail.ruang ? ` · ${manualItemDetail.ruang}` : ''}
                    </p>
                    <p className='text-[11px] text-muted-foreground'>
                      Sisa:{' '}
                      <span className='font-medium text-orange-600'>
                        {Math.max(0, manualItemDetail.jumlah - manualTotalMasuk)}{' '}
                        {manualItemDetail.satuan ?? 'pcs'}
                      </span>
                    </p>
                  </div>
                )}

                {/* Jumlah & tanggal */}
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Jumlah (pcs)</Label>
                    <Input
                      type='number'
                      min={1}
                      placeholder='0'
                      value={manualJumlah}
                      onChange={(e) => setManualJumlah(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                      className='text-sm'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>Tanggal</Label>
                    <Input
                      type='date'
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className='text-sm'
                    />
                  </div>
                </div>

                {/* File setrim */}
                <div className='space-y-1.5'>
                  <Label className='text-xs'>File Setrim (opsional)</Label>
                  <div className='flex items-center gap-2'>
                    <label className='flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors'>
                      <Upload className='h-3.5 w-3.5' />
                      {manualFileSetrim ? manualFileSetrim.name : 'Pilih file...'}
                      <input
                        type='file'
                        accept='image/*,.pdf'
                        className='sr-only'
                        onChange={(e) =>
                          setManualFileSetrim(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                    {manualFileSetrim && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() => setManualFileSetrim(null)}
                      >
                        <X className='h-3.5 w-3.5' />
                      </Button>
                    )}
                  </div>
                </div>

                <Button
                  className='w-full gap-2'
                  onClick={handleManualSubmit}
                  disabled={
                    submitMutation.isPending ||
                    !manualItemDetail ||
                    !manualJumlah
                  }
                >
                  {submitMutation.isPending && submitSourceRef.current === 'manual' ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <CheckCircle2 className='h-4 w-4' />
                  )}
                  Simpan Barang Masuk
                </Button>
              </div>
            )}

            {/* Auto-submit status */}
            {(isAutoLoading || (submitMutation.isPending && submitSourceRef.current !== 'manual')) && (
              <div className='flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700'>
                <Loader2 className='h-4 w-4 animate-spin shrink-0' />
                {isAutoLoading ? 'Membaca item...' : 'Menyimpan...'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══ PANEL KANAN — Riwayat terakhir ═══ */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Package className='h-4 w-4' />
              Terakhir Disimpan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scanRecords.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-10 text-center text-muted-foreground'>
                <ClipboardList className='h-10 w-10 mb-2 opacity-30' />
                <p className='text-sm'>Belum ada barang yang discan.</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {scanRecords.slice(0, 5).map((rec, i) => (
                  <div
                    key={rec.id}
                    className={`rounded-lg border px-4 py-3 space-y-1 ${
                      i === 0 ? 'bg-green-50 border-green-200' : 'bg-muted/20'
                    }`}
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <p className='text-sm font-medium leading-tight'>{rec.itemName}</p>
                      <span className='text-sm font-bold text-green-600 shrink-0'>
                        +{rec.jumlah}
                      </span>
                    </div>
                    <p className='text-[11px] text-muted-foreground'>
                      {rec.project}
                      {rec.lantai ? ` · Lt. ${rec.lantai}` : ''}
                      {rec.ruang ? ` · ${rec.ruang}` : ''}
                    </p>
                    <div className='flex items-center justify-between'>
                      <span className='text-[11px] text-muted-foreground'>
                        {format(new Date(rec.scannedAt), 'HH:mm:ss')} ·{' '}
                        {format(new Date(rec.tanggal), 'dd/MM/yyyy')}
                      </span>
                      <span className='text-[10px] text-muted-foreground'>
                        {rec.source === 'camera' ? 'Kamera' : rec.source === 'external' ? 'Scanner' : 'Manual'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ TABEL RIWAYAT LENGKAP ═══ */}
      {scanRecords.length > 0 && (
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <ClipboardList className='h-4 w-4' />
                Riwayat Sesi Ini
              </CardTitle>
              <Badge variant='secondary'>{scanRecords.length} item</Badge>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-xs'>Waktu</TableHead>
                  <TableHead className='text-xs'>Item</TableHead>
                  <TableHead className='text-xs'>Project</TableHead>
                  <TableHead className='text-xs'>Lantai / Ruang</TableHead>
                  <TableHead className='text-right text-xs'>Qty</TableHead>
                  <TableHead className='text-xs'>Tanggal</TableHead>
                  <TableHead className='text-xs'>Via</TableHead>
                  <TableHead className='w-10' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanRecords.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className='text-xs text-muted-foreground'>
                      {format(new Date(rec.scannedAt), 'HH:mm:ss')}
                    </TableCell>
                    <TableCell className='text-xs font-medium max-w-45 truncate'>
                      {rec.itemName}
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground max-w-37.5 truncate'>
                      {rec.project}
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      {[rec.lantai && `Lt. ${rec.lantai}`, rec.ruang]
                        .filter(Boolean)
                        .join(' · ') || '-'}
                    </TableCell>
                    <TableCell className='text-right text-xs font-medium text-green-600'>
                      +{rec.jumlah}
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      {format(new Date(rec.tanggal), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      {rec.source === 'camera'
                        ? 'Kamera'
                        : rec.source === 'external'
                        ? 'Scanner'
                        : 'Manual'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 text-muted-foreground hover:text-destructive'
                        onClick={() => handleDeleteRecord(rec)}
                        title='Hapus dari riwayat'
                      >
                        <X className='h-3.5 w-3.5' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
