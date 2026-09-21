import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart-context';
import { Navbar } from '@/components/Navbar';
import { DemoScenarioBar } from '@/components/DemoScenarioBar';

export const metadata: Metadata = {
  title: 'MerchantPilot AI ? Turn Every Merchant into an AI-Native Store',
  description: 'AI Growth & Agentic Commerce Platform for Razorpay AI Builder Buildathon 2026',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className="bg-[#0B0F19] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">
        <CartProvider>
          <DemoScenarioBar />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 bg-slate-950/40">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">MerchantPilot AI</span>
                <span className="text-slate-600">?</span>
                <span>Track 01 ? AI Growth & Agentic Commerce</span>
              </div>
              <div className="text-slate-400">
                Built for <span className="text-blue-400 font-semibold">Razorpay AI Builder Buildathon 2026</span>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
