import { Sparkles, Truck, RotateCcw, ShieldCheck } from 'lucide-react';

const ITEMS = [
  { icon: Truck, text: 'Free shipping on orders above ₹999' },
  { icon: RotateCcw, text: '7-day easy returns' },
  { icon: Sparkles, text: 'Handcrafted by independent Indian makers' },
  { icon: ShieldCheck, text: 'Secure payments — UPI, cards & COD' },
];

export default function AnnouncementBar() {
  const loop = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden bg-teal-900 py-2">
      <div className="flex w-max animate-marquee items-center gap-10 [animation-duration:32s]">
        {loop.map(({ icon: Icon, text }, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-teal-50/85">
            <Icon size={13} className="text-marigold-400" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
