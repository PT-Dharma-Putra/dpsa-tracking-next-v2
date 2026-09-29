'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  Camera,
  Eye,
  X,
  ExternalLink,
  FileText,
  Package,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  PengirimanService,
  Pengiriman,
  PengirimanDokumentasi,
} from '@/features/pengiriman/services/pengiriman-service';

interface ClientPengirimanTabProps {
  projectId: number;
  clientName?: string;
  spkId?: number | null;
}

export function ClientPengirimanTab({
  projectId,
  clientName,
  spkId,
}: ClientPengirimanTabProps) {
  // Query shipments for this project (or SPK)
  const { data: pengirimanResponse, isLoading, isError } = useQuery({
    queryKey: ['client-pengiriman', projectId, spkId],
    queryFn: () =>
      PengirimanService.getPengiriman({
        project_id: projectId,
        spk_id: spkId ?? undefined,
        per_page: 100,
      }),
    enabled: !!projectId,
  });

  const shipments = pengirimanResponse?.data ?? [];

  // Lightbox modal state for photo viewing
  const [selectedPhoto, setSelectedPhoto] = React.useState<PengirimanDokumentasi | null>(null);

  // Surat Jalan preview modal state
  const [previewSjUrl, setPreviewSjUrl] = React.useState<string | null>(null);
  const [previewSjTitle, setPreviewSjTitle] = React.useState<string>('');

  // Expand state for item details per shipment
  const [expandedShipments, setExpandedShipments] = React.useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandedShipments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

  const getMediaUrl = (doc: PengirimanDokumentasi) => {
    if (doc.url && (doc.url.startsWith('http://') || doc.url.startsWith('https://'))) {
      return doc.url;
    }
    const cleanPath = doc.file_path.startsWith('/') ? doc.file_path.slice(1) : doc.file_path;
    return `${baseUrl}/storage/${cleanPath}`;
  };

  // Aggregate stats
  const totalShipments = shipments.length;
  const arrivedShipments = shipments.filter((s) => !!s.tanggal_unloading).length;
  const inTransitShipments = totalShipments - arrivedShipments;
  const totalItemsShipped = shipments.reduce((sum, s) => {
    const shipmentTotal = s.details?.reduce((dSum, d) => dSum + Number(d.jumlah_keluar || 0), 0) ?? 0;
    return sum + shipmentTotal;
  }, 0);
  const totalPhotos = shipments.reduce((sum, s) => sum + (s.dokumentasi?.length ?? 0), 0);

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center p-12 space-y-3 bg-white rounded-xl border border-neutral-200'>
        <Loader2 className='h-8 w-8 animate-spin text-orange-600' />
        <p className='text-xs font-semibold text-neutral-500'>Memuat data pengiriman & dokumentasi...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='p-8 text-center bg-red-50 rounded-xl border border-red-200 text-red-600'>
        <AlertCircle className='h-8 w-8 mx-auto mb-2 text-red-500' />
        <p className='text-sm font-semibold'>Gagal memuat data pengiriman</p>
        <p className='text-xs text-red-500 mt-0.5'>Silakan coba muat ulang halaman ini.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 1. Header Overview Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card className='border border-neutral-200/80 bg-white shadow-2xs'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div>
              <p className='text-[11px] font-semibold text-neutral-500 uppercase tracking-wider'>
                Total Pengiriman
              </p>
              <p className='text-xl font-bold text-neutral-800 mt-0.5'>
                {totalShipments} <span className='text-xs font-normal text-neutral-400'>Ritase</span>
              </p>
            </div>
            <div className='h-9 w-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center'>
              <Truck className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='border border-neutral-200/80 bg-white shadow-2xs'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div>
              <p className='text-[11px] font-semibold text-neutral-500 uppercase tracking-wider'>
                Status Tiba di Lokasi
              </p>
              <div className='flex items-center gap-1.5 mt-0.5'>
                <span className='text-xl font-bold text-emerald-600'>{arrivedShipments}</span>
                <span className='text-xs text-neutral-400'>/ {totalShipments} Rit</span>
              </div>
            </div>
            <div className='h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center'>
              <CheckCircle2 className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='border border-neutral-200/80 bg-white shadow-2xs'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div>
              <p className='text-[11px] font-semibold text-neutral-500 uppercase tracking-wider'>
                Total Barang Terkirim
              </p>
              <p className='text-xl font-bold text-sky-600 mt-0.5'>
                {totalItemsShipped} <span className='text-xs font-normal text-neutral-400'>Unit</span>
              </p>
            </div>
            <div className='h-9 w-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center'>
              <Package className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='border border-neutral-200/80 bg-white shadow-2xs'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div>
              <p className='text-[11px] font-semibold text-neutral-500 uppercase tracking-wider'>
                Foto Dokumentasi
              </p>
              <p className='text-xl font-bold text-purple-600 mt-0.5'>
                {totalPhotos} <span className='text-xs font-normal text-neutral-400'>Foto</span>
              </p>
            </div>
            <div className='h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center'>
              <Camera className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Empty State */}
      {shipments.length === 0 ? (
        <Card className='border border-dashed border-neutral-300 bg-neutral-50/60 p-12 text-center'>
          <div className='p-3 rounded-full bg-neutral-100 text-neutral-400 w-fit mx-auto mb-3'>
            <Truck className='h-8 w-8' />
          </div>
          <h3 className='text-base font-bold text-neutral-800'>Belum Ada Pengiriman untuk Proyek Ini</h3>
          <p className='text-xs text-neutral-500 max-w-md mx-auto mt-1'>
            Informasi nomor surat jalan, driver, jadwal kedatangan, serta dokumentasi foto saat muat (Loading) dan bongkar (Unloading) akan ditampilkan di sini setelah pengiriman barang dimulai.
          </p>
        </Card>
      ) : (
        /* 3. List of Shipment Cards */
        <div className='space-y-6'>
          {[...shipments]
            .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
            .map((shipment, index) => {
              const ritNumber = shipments.length - index;
              const loadingPhotos = shipment.dokumentasi?.filter((d) => d.kategori === 'loading') ?? [];
              const unloadingPhotos = shipment.dokumentasi?.filter((d) => d.kategori === 'unloading') ?? [];
              const isExpanded = !!expandedShipments[shipment.id];

              const totalQtyKeluar =
                shipment.details?.reduce((s, d) => s + Number(d.jumlah_keluar || 0), 0) ?? 0;

              return (
                <Card
                  key={shipment.id}
                  className='border border-neutral-200/90 shadow-sm bg-white overflow-hidden transition-all hover:border-neutral-300'
                >
                  {/* Card Header: Ritase Meta & Status */}
                  <CardHeader className='p-5 pb-4 bg-gradient-to-r from-neutral-50/90 via-white to-neutral-50/40 border-b border-neutral-100'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                      <div className='flex items-center gap-3'>
                        <div className='h-9 w-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs'>
                          #{ritNumber}
                        </div>
                        <div>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <CardTitle className='text-sm font-bold text-neutral-800'>
                              Pengiriman Rit ke-{ritNumber}
                            </CardTitle>
                            {shipment.tanggal_unloading ? (
                              <Badge
                                variant='outline'
                                className='bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold gap-1 py-0.5'
                              >
                                <CheckCircle2 className='h-3 w-3 text-emerald-600' />
                                Tiba:{' '}
                                {format(
                                  new Date(shipment.tanggal_unloading),
                                  'dd MMM yyyy, HH:mm',
                                  { locale: idLocale }
                                )}{' '}
                                WIB
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold gap-1 py-0.5'
                              >
                                <Clock className='h-3 w-3 text-amber-600' />
                                Sedang Dalam Perjalanan
                              </Badge>
                            )}
                          </div>
                          <p className='text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 flex-wrap'>
                            <span className='font-medium text-neutral-700'>
                              Kirim: {format(new Date(shipment.tanggal), 'dd MMMM yyyy', { locale: idLocale })}
                            </span>
                            {shipment.supir && (
                              <>
                                <span className='text-neutral-300'>•</span>
                                <span>Supir: <strong className='text-neutral-700'>{shipment.supir}</strong></span>
                              </>
                            )}
                            {shipment.no_kendaraan && (
                              <>
                                <span className='text-neutral-300'>•</span>
                                <span>Plat: <strong className='text-neutral-700 uppercase'>{shipment.no_kendaraan}</strong></span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right Action: Surat Jalan */}
                      <div className='flex items-center gap-2 self-start sm:self-auto'>
                        {shipment.surat_jalan && (
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setPreviewSjUrl(`${baseUrl}/storage/${shipment.surat_jalan}`);
                              setPreviewSjTitle(`Surat Jalan - Rit #${ritNumber}`);
                            }}
                            className='h-7 text-xs font-semibold border-neutral-200 text-neutral-700 hover:bg-neutral-50 gap-1.5'
                          >
                            <FileText className='h-3.5 w-3.5 text-neutral-500' />
                            Lihat Surat Jalan
                          </Button>
                        )}
                        <Badge variant='secondary' className='text-[10px] font-bold bg-neutral-100 text-neutral-700'>
                          {totalQtyKeluar} Item
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className='p-5 space-y-5'>
                    {/* Documentation Tabs (Loading vs Unloading) */}
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <h4 className='text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5'>
                          <Camera className='h-3.5 w-3.5 text-orange-600' />
                          Dokumentasi Foto Pengiriman
                        </h4>
                        <span className='text-[10px] text-neutral-400'>
                          Klik foto untuk memperbesar tampilan
                        </span>
                      </div>

                      <Tabs defaultValue='loading' className='w-full'>
                        <TabsList className='grid grid-cols-2 max-w-sm h-8 bg-neutral-100 p-0.5'>
                          <TabsTrigger
                            value='loading'
                            className='text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-2xs gap-1.5'
                          >
                            <Package className='h-3 w-3' />
                            Saat Loading (Muat)
                            <Badge
                              variant='secondary'
                              className={`ml-1 text-[9px] px-1 py-0 h-3.5 ${
                                loadingPhotos.length > 0 ? 'bg-purple-100 text-purple-700 font-bold' : ''
                              }`}
                            >
                              {loadingPhotos.length}
                            </Badge>
                          </TabsTrigger>
                          <TabsTrigger
                            value='unloading'
                            className='text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-2xs gap-1.5'
                          >
                            <CheckCircle2 className='h-3 w-3' />
                            Saat Tiba & Bongkar
                            <Badge
                              variant='secondary'
                              className={`ml-1 text-[9px] px-1 py-0 h-3.5 ${
                                unloadingPhotos.length > 0 ? 'bg-emerald-100 text-emerald-700 font-bold' : ''
                              }`}
                            >
                              {unloadingPhotos.length}
                            </Badge>
                          </TabsTrigger>
                        </TabsList>

                        {/* Content Loading */}
                        <TabsContent value='loading' className='pt-3'>
                          {loadingPhotos.length === 0 ? (
                            <div className='p-6 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 text-center'>
                              <ImageIcon className='h-6 w-6 text-neutral-300 mx-auto mb-1' />
                              <p className='text-xs font-medium text-neutral-500'>
                                Belum ada foto dokumentasi saat muat barang untuk rit ini.
                              </p>
                            </div>
                          ) : (
                            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
                              {loadingPhotos.map((photo) => {
                                const mediaUrl = getMediaUrl(photo);
                                return (
                                  <div
                                    key={photo.id}
                                    onClick={() => setSelectedPhoto(photo)}
                                    className='group relative rounded-lg border border-neutral-200/80 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col'
                                  >
                                    <div className='relative aspect-4/3 w-full bg-neutral-100 overflow-hidden'>
                                      <img
                                        src={mediaUrl}
                                        alt={photo.file_name || 'Loading Photo'}
                                        className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                                        loading='lazy'
                                      />
                                      <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                        <div className='p-1.5 rounded-full bg-white/90 text-neutral-800 shadow-sm'>
                                          <Eye className='h-3.5 w-3.5' />
                                        </div>
                                      </div>
                                    </div>
                                    <div className='p-2 text-[10px] flex-1 flex flex-col justify-between'>
                                      {photo.keterangan ? (
                                        <p className='text-neutral-700 font-medium line-clamp-2 leading-tight'>
                                          {photo.keterangan}
                                        </p>
                                      ) : (
                                        <p className='text-neutral-400 italic'>Foto Loading</p>
                                      )}
                                      <span className='text-[9px] text-neutral-400 mt-1 block'>
                                        {photo.created_at
                                          ? format(new Date(photo.created_at), 'dd MMM HH:mm')
                                          : '-'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TabsContent>

                        {/* Content Unloading */}
                        <TabsContent value='unloading' className='pt-3 space-y-3'>
                          {/* Arrival Datetime Note for Client */}
                          {shipment.tanggal_unloading && (
                            <div className='flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 text-xs'>
                              <ShieldCheck className='h-4 w-4 text-emerald-600 shrink-0' />
                              <span>
                                Armada tiba dan membongkar muatan di lokasi pada:{' '}
                                <strong>
                                  {format(
                                    new Date(shipment.tanggal_unloading),
                                    'EEEE, dd MMMM yyyy - HH:mm',
                                    { locale: idLocale }
                                  )}{' '}
                                  WIB
                                </strong>
                              </span>
                            </div>
                          )}

                          {unloadingPhotos.length === 0 ? (
                            <div className='p-6 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 text-center'>
                              <ImageIcon className='h-6 w-6 text-neutral-300 mx-auto mb-1' />
                              <p className='text-xs font-medium text-neutral-500'>
                                Belum ada foto dokumentasi saat tiba / serah terima untuk rit ini.
                              </p>
                            </div>
                          ) : (
                            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
                              {unloadingPhotos.map((photo) => {
                                const mediaUrl = getMediaUrl(photo);
                                return (
                                  <div
                                    key={photo.id}
                                    onClick={() => setSelectedPhoto(photo)}
                                    className='group relative rounded-lg border border-neutral-200/80 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col'
                                  >
                                    <div className='relative aspect-4/3 w-full bg-neutral-100 overflow-hidden'>
                                      <img
                                        src={mediaUrl}
                                        alt={photo.file_name || 'Unloading Photo'}
                                        className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                                        loading='lazy'
                                      />
                                      <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                        <div className='p-1.5 rounded-full bg-white/90 text-neutral-800 shadow-sm'>
                                          <Eye className='h-3.5 w-3.5' />
                                        </div>
                                      </div>
                                    </div>
                                    <div className='p-2 text-[10px] flex-1 flex flex-col justify-between'>
                                      {photo.keterangan ? (
                                        <p className='text-neutral-700 font-medium line-clamp-2 leading-tight'>
                                          {photo.keterangan}
                                        </p>
                                      ) : (
                                        <p className='text-neutral-400 italic'>Foto Unloading</p>
                                      )}
                                      <span className='text-[9px] text-neutral-400 mt-1 block'>
                                        {photo.created_at
                                          ? format(new Date(photo.created_at), 'dd MMM HH:mm')
                                          : '-'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Collapsible: Rincian Barang yang Dikirim */}
                    {shipment.details && shipment.details.length > 0 && (
                      <div className='border-t border-neutral-100 pt-3'>
                        <button
                          type='button'
                          onClick={() => toggleExpand(shipment.id)}
                          className='flex items-center justify-between w-full text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors py-1'
                        >
                          <span className='flex items-center gap-1.5'>
                            <Package className='h-3.5 w-3.5 text-neutral-400' />
                            Daftar Barang pada Rit Ini ({shipment.details.length} Jenis Item)
                          </span>
                          {isExpanded ? (
                            <ChevronUp className='h-4 w-4 text-neutral-400' />
                          ) : (
                            <ChevronDown className='h-4 w-4 text-neutral-400' />
                          )}
                        </button>

                        {isExpanded && (
                          <div className='mt-2 rounded-lg border border-neutral-200 overflow-hidden shadow-2xs'>
                            <Table className='text-xs'>
                              <TableHeader className='bg-neutral-50'>
                                <TableRow>
                                  <TableHead className='font-bold text-neutral-700'>Nama Item</TableHead>
                                  <TableHead className='font-bold text-neutral-700'>Divisi / Ruang</TableHead>
                                  <TableHead className='font-bold text-neutral-700 text-center w-28'>
                                    Jumlah Dikirim
                                  </TableHead>
                                  <TableHead className='font-bold text-neutral-700'>Catatan</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {shipment.details.map((detail, dIdx) => {
                                  const itemName = detail.project_item?.item || 'Item';
                                  const divisi =
                                    typeof detail.project_item?.divisi === 'object'
                                      ? detail.project_item?.divisi?.nama || detail.project_item?.divisi?.name
                                      : detail.project_item?.divisi || detail.project_item?.po_divisi || '-';
                                  const ruang = detail.project_item?.ruang || detail.project_item?.lantai || '';

                                  return (
                                    <TableRow key={detail.id || dIdx} className='hover:bg-neutral-50/60'>
                                      <TableCell className='font-medium text-neutral-800'>
                                        {itemName}
                                      </TableCell>
                                      <TableCell className='text-neutral-500'>
                                        {divisi} {ruang && `• ${ruang}`}
                                      </TableCell>
                                      <TableCell className='text-center font-bold text-neutral-800'>
                                        <Badge
                                          variant='secondary'
                                          className='bg-teal-50 text-teal-700 border border-teal-200 text-[10px]'
                                        >
                                          {detail.jumlah_keluar} {detail.project_item?.satuan || 'Unit'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className='text-neutral-400 text-[11px] italic'>
                                        {detail.keterangan || '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Lightbox / Zoom Dialog for Photos */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className='max-w-4xl p-2 bg-black/95 border-none text-white overflow-hidden flex flex-col items-center justify-center'>
            <DialogHeader className='sr-only'>
              <DialogTitle>
                {selectedPhoto.file_name || 'Pratinjau Foto Dokumentasi Pengiriman'}
              </DialogTitle>
              <DialogDescription>
                Foto dokumentasi kategori {selectedPhoto.kategori}
              </DialogDescription>
            </DialogHeader>

            {/* Custom Modal Bar */}
            <div className='w-full flex items-center justify-between p-2 text-xs'>
              <div className='flex items-center gap-2'>
                <Badge
                  className={
                    selectedPhoto.kategori === 'loading'
                      ? 'bg-purple-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }
                >
                  {selectedPhoto.kategori === 'loading' ? 'Saat Loading (Muat)' : 'Saat Unloading (Bongkar)'}
                </Badge>
                <span className='text-neutral-300 font-medium truncate max-w-md'>
                  {selectedPhoto.file_name || 'Foto Dokumentasi'}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <a
                  href={getMediaUrl(selectedPhoto)}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-1.5 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors'
                  title='Buka gambar di tab baru'
                >
                  <ExternalLink className='h-4 w-4' />
                </a>
                <button
                  type='button'
                  onClick={() => setSelectedPhoto(null)}
                  className='p-1.5 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>

            <div className='max-h-[75vh] w-full flex items-center justify-center overflow-auto p-1'>
              <img
                src={getMediaUrl(selectedPhoto)}
                alt={selectedPhoto.file_name || 'Dokumentasi'}
                className='max-h-[70vh] max-w-full object-contain rounded-md shadow-2xl'
              />
            </div>

            {selectedPhoto.keterangan && (
              <div className='w-full text-center py-2 px-4 bg-black/60 backdrop-blur-xs rounded-b-md'>
                <p className='text-xs text-neutral-200 font-normal leading-relaxed'>
                  {selectedPhoto.keterangan}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Surat Jalan Viewer Dialog */}
      {previewSjUrl && (
        <Dialog open={!!previewSjUrl} onOpenChange={() => setPreviewSjUrl(null)}>
          <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col p-4'>
            <DialogHeader className='pb-2 border-b'>
              <div className='flex items-center justify-between'>
                <DialogTitle className='text-sm font-bold text-neutral-800 flex items-center gap-2'>
                  <FileText className='h-4 w-4 text-orange-600' />
                  {previewSjTitle || 'Surat Jalan Pengiriman'}
                </DialogTitle>
                <a
                  href={previewSjUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-semibold pr-6'
                >
                  <ExternalLink className='h-3.5 w-3.5' /> Buka Full Tab
                </a>
              </div>
              <DialogDescription className='sr-only'>
                Pratinjau file surat jalan pengiriman
              </DialogDescription>
            </DialogHeader>

            <div className='flex-1 overflow-auto p-2 bg-neutral-100 rounded-lg min-h-[500px] flex items-center justify-center'>
              {previewSjUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewSjUrl}
                  className='w-full h-[550px] rounded-md border border-neutral-200'
                  title='Surat Jalan PDF'
                />
              ) : (
                <img
                  src={previewSjUrl}
                  alt='Surat Jalan'
                  className='max-h-[550px] max-w-full object-contain rounded-md shadow-sm'
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
