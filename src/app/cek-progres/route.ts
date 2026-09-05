import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const noSpk = searchParams.get('no_spk');
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';
  
  try {
    const targetUrl = noSpk 
      ? `${backendUrl}/cek-progres?no_spk=${encodeURIComponent(noSpk)}`
      : `${backendUrl}/cek-progres`;

    const res = await fetch(targetUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: 'Gagal menghubungkan ke server backend.' },
      { status: 500 }
    );
  }
}
