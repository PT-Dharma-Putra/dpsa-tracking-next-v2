import React from 'react';
import ClientPage from './client';

export const metadata = {
  title: 'Setrim Barang Jadi',
};

export default function SetrimBarangJadiPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Setrim Barang Jadi</h2>
      </div>
      <ClientPage />
    </div>
  );
}
