import React from 'react';

type CreditCardVisualProps = {
  title: string;
  issuer?: string;
  network?: string;
  rank?: number;
};

// A clean, professional-looking credit card visual with subtle gradient and chip
export function CreditCardVisual({ title, issuer, network, rank }: CreditCardVisualProps) {
  return (
    <div className="relative w-full aspect-[16/10] rounded-xl p-4 bg-gradient-to-br from-slate-800 to-slate-700 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18) 0, transparent 50%)'
      }} />

      {typeof rank === 'number' && (
        <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded bg-white/15 backdrop-blur">
          Rank #{rank}
        </span>
      )}

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs text-white/70">{issuer || 'Issuer'}</p>
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/80">{network || 'Network'}</p>
        </div>
      </div>

      <div className="relative mt-6 flex items-center gap-3">
        <div className="h-6 w-8 rounded-sm bg-amber-300" />
        <div className="h-5 w-5 rounded-full bg-white/40" />
        <div className="h-5 w-5 rounded-full bg-white/30 -ml-2" />
      </div>

      <div className="relative mt-4 text-sm tracking-widest">
        •••• •••• •••• 1234
      </div>
      {/* Footer intentionally simplified for consistency across cards */}
    </div>
  );
}

export default CreditCardVisual;


