import React from 'react';
import { MerchantSidebar } from '@/components/MerchantSidebar';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#080C14]">
      <MerchantSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">{children}</div>
    </div>
  );
}
