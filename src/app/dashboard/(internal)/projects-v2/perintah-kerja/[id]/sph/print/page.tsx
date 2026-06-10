'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

import { projectV2Service } from '@/features/projects/services/project-v2-service';
import { authService } from '@/features/auth/api/auth-service';

function terbilang(num: number): string {
  if (num === 0) return 'Nol';
  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];
  function convert(n: number): string {
    if (n < 12) return satuan[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100)
      return (
        convert(Math.floor(n / 10)) +
        ' Puluh' +
        (n % 10 ? ' ' + convert(n % 10) : '')
      );
    if (n < 200) return 'Seratus' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 1000)
      return (
        convert(Math.floor(n / 100)) +
        ' Ratus' +
        (n % 100 ? ' ' + convert(n % 100) : '')
      );
    if (n < 2000) return 'Seribu' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 1_000_000)
      return (
        convert(Math.floor(n / 1000)) +
        ' Ribu' +
        (n % 1000 ? ' ' + convert(n % 1000) : '')
      );
    if (n < 1_000_000_000)
      return (
        convert(Math.floor(n / 1_000_000)) +
        ' Juta' +
        (n % 1_000_000 ? ' ' + convert(n % 1_000_000) : '')
      );
    return (
      convert(Math.floor(n / 1_000_000_000)) +
      ' Miliar' +
      (n % 1_000_000_000 ? ' ' + convert(n % 1_000_000_000) : '')
    );
  }
  return convert(Math.round(num));
}

function toRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(
    Math.round(val)
  );
}

const BORDER = '1px solid black';
const th = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: BORDER,
  padding: '3px 5px',
  textAlign: 'center',
  fontWeight: 'bold',
  backgroundColor: '#f0f0f0',
  ...extra,
});
const td = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: BORDER,
  padding: '3px 5px',
  ...extra,
});

export default function PrintSPHPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['projects-v2', projectId],
    queryFn: () => projectV2Service.getProject(projectId),
  });

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['project-v2-items', projectId],
    queryFn: () => projectV2Service.getProjectItems(projectId),
  });

  const { data: profileRes } = useQuery({
    queryKey: ['auth-profile'],
    queryFn: () => authService.getProfile(),
  });

  const isLoading = isLoadingProject || isLoadingItems;

  React.useEffect(() => {
    if (project && items) {
      const timer = setTimeout(() => window.print(), 800);
      return () => clearTimeout(timer);
    }
  }, [project, items]);

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center bg-white'>
        <div className='flex flex-col items-center gap-3'>
          <Loader2 className='h-8 w-8 animate-spin text-neutral-400' />
          <p className='text-sm text-neutral-500'>
            Mempersiapkan dokumen SPH...
          </p>
        </div>
      </div>
    );
  }

  if (!project || !items) {
    return (
      <div className='p-8 text-center text-red-600 bg-white h-screen'>
        Data tidak ditemukan.
      </div>
    );
  }

  // Financial calculations
  const itemsWithTotal = items.map((item) => ({
    ...item,
    hargaTotal: (item.volume ?? 0) * (item.jumlah ?? 1) * (item.harga ?? 0),
  }));

  const total = itemsWithTotal.reduce((s, i) => s + i.hargaTotal, 0);
  const biayaKirim = Math.round(total * 0.15);
  const subTotal = total + biayaKirim;
  const dppLain = Math.round((subTotal * 11) / 12);
  const ppn = Math.round(dppLain * 0.12);
  const grandTotal = subTotal + ppn;

  // Group by lantai
  const lantaiOrder: string[] = [];
  const lantaiMap: Record<string, typeof itemsWithTotal> = {};
  for (const item of itemsWithTotal) {
    const key = item.lantai || '-';
    if (!lantaiOrder.includes(key)) lantaiOrder.push(key);
    if (!lantaiMap[key]) lantaiMap[key] = [];
    lantaiMap[key].push(item);
  }

  const nomorSPH = project.sph?.nomor_sph || '-';
  const tanggalDoc = format(new Date(), 'd MMMM yyyy', { locale: idLocale });
  const grandTotalWords = terbilang(grandTotal) + ' Rupiah';
  const marketingName = project.marketing?.name || profileRes?.data?.name || '-';

  return (
    <div
      className='bg-white min-h-screen p-4 text-black'
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * { visibility: hidden; background-color: transparent !important; }
            #sph-area, #sph-area * { visibility: visible; color: black !important; }
            #sph-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
          @page { size: A4; margin: 10mm 12mm 10mm 12mm; }
        `,
        }}
      />

      {/* Screen-only action bar */}
      <div className='no-print mb-4 p-4 bg-neutral-100 rounded-lg border flex justify-between items-center'>
        <div>
          <h2 className='font-semibold text-sm'>
            Pratinjau SPH — {project.name}
          </h2>
          <p className='text-xs text-neutral-500'>
            Diformat untuk A4. Dialog cetak muncul otomatis.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className='px-4 py-2 bg-neutral-800 text-white rounded text-sm font-medium hover:bg-neutral-900'
        >
          Cetak Manual
        </button>
      </div>

      {/* Print content */}
      <div
        id='sph-area'
        style={{
          maxWidth: 780,
          margin: '0 auto',
          backgroundColor: 'white',
          fontSize: 10,
        }}
      >
        {/* ── Company Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            paddingBottom: 8,
            borderBottom: '2.5px solid #1a237e',
            marginBottom: 12,
          }}
        >
          <div style={{ width: 68, height: 68, flexShrink: 0 }}>
            <svg viewBox='0 0 80 80' width='68' height='68'>
              <polygon
                points='40,3 77,40 40,77 3,40'
                fill='none'
                stroke='#1a237e'
                strokeWidth='3.5'
              />
              <polygon
                points='40,14 66,40 40,66 14,40'
                fill='none'
                stroke='#1a237e'
                strokeWidth='1.5'
              />
              <circle cx='40' cy='40' r='6' fill='#f9a825' />
              <line
                x1='40'
                y1='14'
                x2='40'
                y2='34'
                stroke='#1a237e'
                strokeWidth='1.5'
              />
              <line
                x1='40'
                y1='46'
                x2='40'
                y2='66'
                stroke='#1a237e'
                strokeWidth='1.5'
              />
              <line
                x1='14'
                y1='40'
                x2='34'
                y2='40'
                stroke='#1a237e'
                strokeWidth='1.5'
              />
              <line
                x1='46'
                y1='40'
                x2='66'
                y2='40'
                stroke='#1a237e'
                strokeWidth='1.5'
              />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#1a237e',
                letterSpacing: 0.4,
                lineHeight: 1.1,
              }}
            >
              PT. DHARMA PUTRA SEJAHTERA ABADI
            </div>
            <div style={{ fontSize: 9.5, color: '#555', marginTop: 2 }}>
              Interior &amp; Furniture Manufacture
            </div>
            <div style={{ fontSize: 9.5, color: '#333', marginTop: 2 }}>
              Jl. Matraman No.88 , Ringinsari , Maguwoharjo, Depok, Sleman,
              YOGYAKARTA
            </div>
            <div style={{ fontSize: 9.5, color: '#333' }}>
              Telepon &nbsp;: (0274) 2800089 &nbsp; Fax : (0274) 4332248 &nbsp;
              Hp : 0811-2850-7788
            </div>
            <div style={{ fontSize: 9.5, color: '#333' }}>
              E-Mail &nbsp;&nbsp;&nbsp;: dharmaputra04@yahoo.com ,
              dharmaputra888@gmail.com
            </div>
            <div style={{ fontSize: 9.5, color: '#333' }}>
              website &nbsp;: www.dharmaputrainterior.co.id
            </div>
          </div>
        </div>

        {/* ── Recipient + Doc Info ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          {/* Left: Kepada Yth */}
          <div style={{ fontSize: 10.5, lineHeight: 1.8 }}>
            <div>Kepada Yth.</div>
            {project.client?.director_name && (
              <div
                style={{
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                  textDecoration: 'underline',
                }}
              >
                {project.client.director_name}
              </div>
            )}
            <div>{project.client?.name || '-'}</div>
            {project.client?.address
              ? project.client.address
                  .split('\n')
                  .map((line, i) => <div key={i}>{line}</div>)
              : null}
          </div>

          {/* Right: MKT box + doc meta */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 8,
            }}
          >
            <table style={{ borderCollapse: 'collapse', fontSize: 9 }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      border: BORDER,
                      padding: '2px 12px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    MKT
                  </td>
                  <td
                    style={{
                      border: BORDER,
                      padding: '2px 12px',
                      textAlign: 'center',
                    }}
                  >
                    Rev : 00
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      border: BORDER,
                      padding: '2px 12px',
                      textAlign: 'center',
                    }}
                  >
                    001
                  </td>
                  <td
                    style={{
                      border: BORDER,
                      padding: '2px 12px',
                      textAlign: 'center',
                    }}
                  >
                    Terbit : 08/25
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, lineHeight: 1.8 }}>
              {(
                [
                  ['Nomor', nomorSPH],
                  ['Marketing', marketingName],
                  ['Perihal', `Surat Penawaran Harga ${project.name}`],
                  ['Tanggal', tanggalDoc],
                ] as [string, string][]
              ).map(([label, val]) => (
                <div key={label} style={{ display: 'flex', gap: 4 }}>
                  <span style={{ minWidth: 70, display: 'inline-block' }}>
                    {label}
                  </span>
                  <span>: {val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Opening paragraph ── */}
        <div style={{ fontSize: 10.5, marginBottom: 4 }}>Dengan hormat,</div>
        <div style={{ fontSize: 10.5, marginBottom: 12, lineHeight: 1.65 }}>
          Bersama surat ini, kami dari PT. Dharma Putra Sejahtera Abadi,
          berkeinginan mengajukan Penawaran harga pengadaan {project.name}{' '}
          dengan perincian sebagai berikut :
        </div>

        {/* ── Items Table ── */}
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}
        >
          <thead>
            <tr>
              <th rowSpan={2} style={th({ whiteSpace: 'nowrap', width: 24 })}>
                No
              </th>
              <th rowSpan={2} style={th({ minWidth: 70 })}>
                Ruang
              </th>
              <th rowSpan={2} style={th()}>
                Item / Perabot
              </th>
              <th colSpan={3} style={th()}>
                Dimensi
                <br />
                (meter)
              </th>
              <th rowSpan={2} style={th({ width: 30 })}>
                Vol
              </th>
              <th rowSpan={2} style={th({ width: 28 })}>
                Sat
              </th>
              <th rowSpan={2} style={th({ width: 28 })}>
                Jml
              </th>
              <th rowSpan={2} style={th({ width: 70, whiteSpace: 'nowrap' })}>
                Harga Sat
              </th>
              <th rowSpan={2} style={th({ width: 72, whiteSpace: 'nowrap' })}>
                Harga Total
              </th>
              <th rowSpan={2} style={th({ minWidth: 60 })}>
                Keterangan
              </th>
            </tr>
            <tr>
              <th style={th({ width: 30 })}>Pjg</th>
              <th style={th({ width: 30 })}>Lbr</th>
              <th style={th({ width: 30 })}>Tgi</th>
            </tr>
          </thead>
          <tbody>
            {lantaiOrder.map((lantai) => (
              <React.Fragment key={lantai}>
                {/* Lantai header row */}
                <tr>
                  <td
                    colSpan={12}
                    style={{
                      border: BORDER,
                      padding: '3px 6px',
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    LANTAI {lantai}
                  </td>
                </tr>
                {lantaiMap[lantai].map((item, idx) => (
                  <tr key={item.id}>
                    <td style={td({ textAlign: 'center' })}>{idx + 1}</td>
                    <td style={td()}>{item.ruang || '-'}</td>
                    <td style={td({ fontWeight: 500 })}>{item.item}</td>
                    <td style={td({ textAlign: 'center' })}>
                      {item.panjang ?? '-'}
                    </td>
                    <td style={td({ textAlign: 'center' })}>
                      {item.lebar ?? '-'}
                    </td>
                    <td style={td({ textAlign: 'center' })}>
                      {item.tinggi ?? '-'}
                    </td>
                    <td style={td({ textAlign: 'center' })}>
                      {item.volume != null
                        ? item.volume.toLocaleString('id-ID', {
                            maximumFractionDigits: 2,
                          })
                        : '-'}
                    </td>
                    <td style={td({ textAlign: 'center' })}>
                      {item.satuan || '-'}
                    </td>
                    <td style={td({ textAlign: 'center' })}>{item.jumlah}</td>
                    <td style={td({ textAlign: 'right' })}>
                      {item.harga != null ? toRupiah(item.harga) : '-'}
                    </td>
                    <td style={td({ textAlign: 'right', fontWeight: 500 })}>
                      {item.harga != null ? toRupiah(item.hargaTotal) : '-'}
                    </td>
                    <td style={td()}>{item.keterangan || '-'}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* ── Summary rows ── */}
            <tr>
              <td colSpan={12} style={td()} />
            </tr>

            <tr>
              <td style={td()} />
              <td
                style={td({
                  fontWeight: 'bold',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                })}
              >
                TOTAL
              </td>
              <td colSpan={9} style={td()} />
              <td
                style={td({
                  fontWeight: 'bold',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                })}
              >
                {toRupiah(total)}
              </td>
            </tr>

            <tr>
              <td style={td()} />
              <td
                style={td({
                  fontWeight: 'bold',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                })}
              >
                BIAYA KIRIM
              </td>
              <td
                colSpan={9}
                style={td({ textAlign: 'right', fontSize: 8.5, color: '#555' })}
              >
                15%
              </td>
              <td
                style={td({
                  fontWeight: 'bold',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                })}
              >
                {toRupiah(biayaKirim)}
              </td>
            </tr>

            <tr>
              <td style={td()} />
              <td
                style={td({
                  fontWeight: 'bold',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                })}
              >
                SUBTOTAL
              </td>
              <td
                colSpan={9}
                style={td({ textAlign: 'right', fontSize: 8.5, color: '#555' })}
              ></td>
              <td
                style={td({
                  fontWeight: 'bold',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                })}
              >
                {toRupiah(subTotal)}
              </td>
            </tr>

            <tr>
              <td style={td()} />
              <td
                colSpan={8}
                style={td({
                  fontWeight: 'bold',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                })}
              >
                DPP LAIN ( {toRupiah(subTotal)} x 11/12 )
              </td>
              <td style={td({ textAlign: 'right' })}>{toRupiah(dppLain)}</td>
              <td
                style={td({
                  textAlign: 'center',
                  fontSize: 8.5,
                  color: '#555',
                })}
              >
                12%
              </td>
              <td
                colSpan={2}
                style={td({ textAlign: 'right', whiteSpace: 'nowrap' })}
              >
                {toRupiah(ppn)}
              </td>
            </tr>
            <tr>
              <td colSpan={10} style={td()} />
              <td
                colSpan={2}
                style={td({
                  fontWeight: 'bold',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                })}
              >
                GRANDTOTAL&nbsp;&nbsp;&nbsp;&nbsp;{toRupiah(grandTotal)}
              </td>
            </tr>
            <tr>
              <td colSpan={12} style={td({ fontWeight: 'bold' })}>
                TERBILANG :&nbsp;
                <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>
                  {grandTotalWords}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
