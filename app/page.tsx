'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((item) => item.startsWith("itour_role="));
    const role = match?.split("=")[1] || null;

    if (role === "TOURGUIDE") {
      router.replace('/tourguide/dashboard');
    } else if (role === "CONSULTANT") {
      router.replace('/consultant/dashboard');
    } else {
      router.replace('/admin');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
