"use client";

import { useState, useEffect } from "react";

// Struktur data response dari API
interface QuoteApiResponse {
  status: string;
  message: string;
  data: {
    text: string;
    author: string;
    category: string;
    id: number;
  };
  metadata: {
    totalAvailable: number;
    category: string | null;
  };
}

interface QuoteModalProps {
  username?: string;
}

export default function QuoteModal({ username = "John Doe" }: QuoteModalProps) {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [greeting, setGreeting] = useState<string>("Good Afternoon");
  
  // State untuk menampung quote dan status loading
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Atur sapaan berdasarkan waktu lokal user
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting("Good Morning");
    } else if (hours < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  // 2. Ambil data quote acak dari API
  useEffect(() => {
    async function fetchQuote() {
      try {
        setIsLoading(true);
        // const res = await fetch("https://quotes.liupurnomo.com/api/quotes/random");
        const res = await fetch("/api/quote");

        if (!res.ok) {
          throw new Error("Gagal mengambil data quote");
        }
        const result: QuoteApiResponse = await res.json();
        
        // Simpan hanya teks dan penulisnya ke state
        setQuote({
          text: result.data.text,
          author: result.data.author,
        });
      } catch (error) {
        console.error("Error fetching quote:", error);
        // Fallback jika API bermasalah/offline
        setQuote({
          text: "Hidup ini simple jangan dibuat susah.",
          author: "Michael Jordan",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuote();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Kotak Modal */}
      <div className="w-[90%] max-w-md transform rounded-2xl bg-white p-8 text-center shadow-2xl transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
        
        {/* Sapaan */}
        <h2 className="text-2xl font-bold text-gray-800">
          {greeting}, {username}!
        </h2>

        {/* Box Quote / Loading State */}
        <div className="my-6 border-l-4 border-blue-500 bg-gray-50 p-5 rounded-r-xl text-left min-h-[110px] flex flex-col justify-center">
          {isLoading ? (
            // Animasi loading sederhana (Skeleton)
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4 mt-4"></div>
            </div>
          ) : (
            <>
              <p className="text-lg italic text-gray-700 font-medium leading-relaxed">
                "{quote?.text}"
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-500">
                - {quote?.author}
              </p>
            </>
          )}
        </div>

        {/* Tombol Aksi */}
        <button
          onClick={() => setIsOpen(false)}
          className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-500/20"
        >
          Lanjut Nge-track
        </button>
      </div>
    </div>
  );
}