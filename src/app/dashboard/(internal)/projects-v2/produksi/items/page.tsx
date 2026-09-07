'use client';

import Link from 'next/link';
import { ArrowLeft, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProduksiItemsTable } from './_components/produksi-items-table';

export default function ProduksiAllItemsPage() {
  return (
    <div className='space-y-6 pt-4'>
      {/* Header Section */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <Link href='/dashboard/projects-v2/produksi'>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-neutral-500 hover:text-neutral-900'
                title='Kembali ke Dashboard Produksi'
              >
                <ArrowLeft className='h-4 w-4' />
              </Button>
            </Link>
            <div className='flex items-center gap-2'>
              <div className='h-7 w-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center'>
                <PackageCheck className='h-4 w-4' />
              </div>
              <h1 className='text-2xl font-semibold tracking-tight text-neutral-900'>
                Semua Item Produksi
              </h1>
            </div>
          </div>
          <p className='text-sm text-neutral-500 pl-10'>
            Monitoring dan pencarian keseluruhan item proyek beserta kuantitas dan progres produksi.
          </p>
        </div>

        <div>
          <Link href='/dashboard/projects-v2/produksi'>
            <Button
              variant='outline'
              size='sm'
              className='text-xs h-9 border-neutral-200 hover:bg-neutral-100'
            >
              <ArrowLeft className='h-3.5 w-3.5 mr-1.5' />
              Ke Proyek Produksi
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Content */}
      <ProduksiItemsTable />
    </div>
  );
}
