// app/api/quote/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://quotes.liupurnomo.com/api/quotes/random", {
      // Menambahkan cache: "no-store" agar setiap request selalu mendapatkan quote baru (tidak di-cache oleh server Next.js)
      cache: "no-store", 
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil data dari server quotes eksternal" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error saat fetch quote" },
      { status: 500 }
    );
  }
}