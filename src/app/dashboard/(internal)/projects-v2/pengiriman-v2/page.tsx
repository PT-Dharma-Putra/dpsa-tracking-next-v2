'use client';

import { ProjectsV2Table } from '../_components/projects-v2-table';

export default function PengirimanV2Page() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight pt-4'>
          Project V2 | Pengiriman V2
        </h1>
        <p className='text-sm text-muted-foreground'>
          Project planning and tracking dashboard.
        </p>
      </div>

      <ProjectsV2Table
        showSPD={false}
        showPengirimanV2={true}
        onlyShowDetail={true}
      />
    </div>
  );
}
