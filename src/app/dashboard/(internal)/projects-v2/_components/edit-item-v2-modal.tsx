'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, Pencil, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

import { projectV2Service, ProjectItemV2 } from '@/features/projects/services/project-v2-service';
import { LokasiMDLService } from '@/features/lokasi-mdl/services/lokasi-mdl-service';
import { MdlService } from '@/features/mdl/services/mdl-service';
import { cn } from '@/lib/utils';

const schema = z.object({
  item: z.string().min(1, 'Nama item wajib diisi'),
  lantai: z.string().default(''),
  ruang: z.string().default(''),
  keterangan: z.string().default(''),
  panjang: z.preprocess(
    (v) => (v === '' || v === null ? null : Number(v)),
    z.number().nullable()
  ),
  lebar: z.preprocess(
    (v) => (v === '' || v === null ? null : Number(v)),
    z.number().nullable()
  ),
  tinggi: z.preprocess(
    (v) => (v === '' || v === null ? null : Number(v)),
    z.number().nullable()
  ),
  volume: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return null;
      const num = parseFloat(String(v).replace(',', '.'));
      return isNaN(num) ? null : num;
    },
    z.number().min(0, 'Volume tidak boleh kurang dari 0').nullable()
  ),
  satuan: z.string().default('UNIT'),
  jumlah: z.preprocess(
    (v) => (v === '' || v === null ? 1 : Number(v)),
    z.number().min(1)
  ),
  harga: z.preprocess(
    (v) => (v === '' || v === null ? null : Number(v)),
    z.number().nullable()
  ),
  custom: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

interface EditItemV2ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  item: ProjectItemV2 | null;
}

export function EditItemV2Modal({
  open,
  onOpenChange,
  projectId,
  item,
}: EditItemV2ModalProps) {
  const queryClient = useQueryClient();
  const [lokasiOpen, setLokasiOpen] = React.useState(false);

  // Ambil harga satuan dari tabel barang via MDL (hanya jika ada mdl_id)
  const hasMdlId = open && !!item?.mdl_id;
  const { data: mdlData, isFetching: isFetchingMdl } = useQuery({
    queryKey: ['mdl-by-id', item?.mdl_id],
    queryFn: () => MdlService.getMdlById(item!.mdl_id!),
    enabled: hasMdlId,
    staleTime: 5 * 60 * 1000,
  });

  // Prioritas: barang.harga dari MDL (fresh) → item.harga (tersimpan) → null
  const hargaSatuan = React.useMemo(() => {
    if (mdlData?.barang?.harga != null) return mdlData.barang.harga;
    if (item?.harga != null) return item.harga;
    return null;
  }, [mdlData, item?.harga]);

  const isLoadingHarga = hasMdlId && isFetchingMdl && hargaSatuan == null;

  const formatRupiah = (value: number | null | undefined) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      item: '',
      lantai: '',
      ruang: '',
      keterangan: '',
      panjang: null,
      lebar: null,
      tinggi: null,
      volume: null,
      satuan: 'UNIT',
      jumlah: 1,
      harga: null,
      custom: false,
    },
  });

  // Isi form saat item berubah
  React.useEffect(() => {
    if (open && item) {
      form.reset({
        item: item.item ?? '',
        lantai: item.lantai ?? '',
        ruang: item.ruang ?? '',
        keterangan: item.keterangan ?? '',
        panjang: item.panjang ?? null,
        lebar: item.lebar ?? null,
        tinggi: item.tinggi ?? null,
        volume: item.volume ?? null,
        satuan: item.satuan ?? 'UNIT',
        jumlah: item.jumlah ?? 1,
        harga: item.harga ?? null,
        custom: (item.custom as any) === true || (item.custom as any) === 1 || (item.custom as any) === '1',
      });
    }
  }, [open, item, form]);

  // Auto-hitung volume berdasarkan satuan
  const watched = useWatch({ control: form.control });
  React.useEffect(() => {
    const panjang = Number(watched.panjang) || 0;
    const lebar = Number(watched.lebar) || 0;
    const tinggi = Number(watched.tinggi) || 0;
    const satuan = watched.satuan;
    let vol: number | null = watched.volume ?? null;

    if (satuan === 'M1') vol = panjang;
    else if (satuan === 'M2 (pxl)') vol = panjang * lebar;
    else if (satuan === 'M2 (pxt)') vol = panjang * tinggi;
    else if (satuan === 'UNIT' || satuan === 'SET') vol = 1;

    const currentVol = watched.volume != null
      ? parseFloat(String(watched.volume).replace(',', '.'))
      : null;
    if (vol !== (isNaN(currentVol as number) ? null : currentVol)) {
      form.setValue('volume', vol, { shouldDirty: true });
    }
  }, [watched.panjang, watched.lebar, watched.tinggi, watched.satuan]);

  // Lokasi options dari LokasiMDL
  const { data: lokasiRes } = useQuery({
    queryKey: ['lokasi-mdl-options'],
    queryFn: () => LokasiMDLService.getLokasi({ per_page: -1 }),
    enabled: open,
  });
  const lokasiOptions = lokasiRes?.data || [];

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      projectV2Service.updateProjectItem(item!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-v2-items', projectId] });
      toast.success('Item berhasil diupdate');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Gagal mengupdate item');
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            <div className='h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center'>
              <Pencil className='h-4 w-4 text-blue-600' />
            </div>
            <div>
              <DialogTitle className='text-lg font-bold'>Edit Item V2</DialogTitle>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Update data item project
              </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className='space-y-4 mt-2'>

            {/* Nama Item */}
            <FormField
              control={form.control as any}
              name='item'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Item <span className='text-red-500'>*</span></FormLabel>
                  <FormControl>
                    <Input placeholder='Nama item...' {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lantai & Lokasi */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control as any}
                name='lantai'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lantai</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className={cn(
                              'h-9 w-full justify-between font-normal text-sm',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <div className='flex gap-1 flex-wrap truncate max-w-[90%]'>
                              {field.value ? (
                                field.value.split(', ').map((v: string) => (
                                  <Badge
                                    key={v}
                                    variant='secondary'
                                    className='text-[10px] h-5 px-1 font-normal'
                                  >
                                    {v}
                                  </Badge>
                                ))
                              ) : (
                                'Pilih lantai...'
                              )}
                            </div>
                            <ChevronsUpDown className='ml-2 h-3 w-3 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-[200px] p-2' align='start'>
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between pb-2 border-b'>
                            <span className='text-xs font-semibold'>Pilih Lantai</span>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 px-2 text-[10px]'
                              onClick={() => field.onChange('')}
                            >
                              Reset
                            </Button>
                          </div>
                          <div className='max-h-[200px] overflow-y-auto space-y-1 py-1'>
                            {Array.from({ length: 10 }, (_, i) => {
                              const val = `${i + 1}`;
                              const isSelected = field.value?.split(', ').includes(val);
                              return (
                                <div
                                  key={val}
                                  className='flex items-center space-x-2 p-1 hover:bg-neutral-100 rounded-md cursor-pointer'
                                  onClick={() => {
                                    const cur = field.value ? field.value.split(', ') : [];
                                    const next = isSelected
                                      ? cur.filter((v: string) => v !== val)
                                      : [...cur, val].sort();
                                    field.onChange(next.join(', '));
                                  }}
                                >
                                  <Checkbox checked={isSelected} onCheckedChange={() => {}} />
                                  <label className='text-xs font-medium cursor-pointer flex-1'>
                                    {val}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name='ruang'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasi / Ruang</FormLabel>
                    <Popover open={lokasiOpen} onOpenChange={setLokasiOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className={cn(
                              'h-9 w-full justify-between font-normal text-sm',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <span className='truncate'>{field.value || 'Cari lokasi...'}</span>
                            <ChevronsUpDown className='ml-2 h-3 w-3 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-[260px] p-0' align='start'>
                        <Command>
                          <CommandInput placeholder='Cari lokasi...' className='h-9 text-sm' />
                          <CommandList>
                            <CommandEmpty className='py-3 text-center text-sm text-muted-foreground'>
                              Lokasi tidak ditemukan
                            </CommandEmpty>
                            <CommandGroup className='max-h-[200px] overflow-y-auto'>
                              {lokasiOptions.map((l) => (
                                <CommandItem
                                  key={l.id}
                                  value={l.nama}
                                  onSelect={() => {
                                    field.onChange(l.nama);
                                    setLokasiOpen(false);
                                  }}
                                  className='text-sm'
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value === l.nama ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {l.nama}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Keterangan */}
            <FormField
              control={form.control as any}
              name='keterangan'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan / Spesifikasi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Keterangan...'
                      className='resize-none'
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dimensi */}
            <div className='grid grid-cols-3 gap-3'>
              <FormField
                control={form.control as any}
                name='panjang'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Panjang (m)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name='lebar'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lebar (m)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name='tinggi'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tinggi (m)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Satuan, Volume, Qty */}
            <div className='grid grid-cols-3 gap-3'>
              <FormField
                control={form.control as any}
                name='satuan'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satuan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'UNIT'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='M1'>M1</SelectItem>
                        <SelectItem value='M2 (pxl)'>M2 (pxl)</SelectItem>
                        <SelectItem value='M2 (pxt)'>M2 (pxt)</SelectItem>
                        <SelectItem value='UNIT'>UNIT</SelectItem>
                        <SelectItem value='SET'>SET</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name='volume'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        inputMode='decimal'
                        placeholder='0'
                        {...field}
                        value={field.value != null ? String(field.value).replace('.', ',') : ''}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9,]/g, '');
                          const commaIdx = val.indexOf(',');
                          if (commaIdx !== -1) {
                            val = val.slice(0, commaIdx + 1) +
                              val.slice(commaIdx + 1).replace(/,/g, '').slice(0, 2);
                          }
                          field.onChange(val === '' ? null : val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name='jumlah'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='1'
                        min={1}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Harga & Harga Total */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium leading-none'>Harga Satuan</label>
                <div className='h-9 px-3 flex items-center rounded-md border border-input bg-muted text-sm select-none'>
                  {isLoadingHarga ? (
                    <span className='italic text-xs text-muted-foreground'>Memuat...</span>
                  ) : hargaSatuan != null ? (
                    <span className='font-medium text-neutral-700'>{formatRupiah(hargaSatuan)}</span>
                  ) : (
                    <span className='italic text-xs text-muted-foreground'>-</span>
                  )}
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium leading-none'>Harga Total</label>
                <div className='h-9 px-3 flex items-center rounded-md border border-input bg-muted text-sm select-none'>
                  {isLoadingHarga ? (
                    <span className='italic text-xs text-muted-foreground'>Memuat...</span>
                  ) : hargaSatuan != null ? (
                    <span className='font-medium text-emerald-700'>
                      {formatRupiah((Number(watched.volume) || 0) * (Number(watched.jumlah) || 1) * hargaSatuan)}
                    </span>
                  ) : (
                    <span className='italic text-xs text-muted-foreground'>-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tipe */}
            <FormField
              control={form.control as any}
              name='custom'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === '1')}
                    value={field.value ? '1' : '0'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='0'>Standar</SelectItem>
                      <SelectItem value='1'>Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={mutation.isPending}
                className='bg-blue-600 hover:bg-blue-700 text-white'
              >
                {mutation.isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
