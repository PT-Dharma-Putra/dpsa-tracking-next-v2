import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';
  
  try {
    const res = await fetch(`${backendUrl}/cek-progres/${slug}`, {
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
