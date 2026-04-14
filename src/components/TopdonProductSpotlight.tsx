'use client';

import { TOPDON_PRODUCTS, buildTopdonProductUrl } from '@/lib/topdonAffiliate';
import Image from 'next/image';

interface TopdonProductSpotlightProps {
  productKey: keyof typeof TOPDON_PRODUCTS;
  title?: string;
  reason?: string;
  surface?: string;
}

export default function TopdonProductSpotlight({ 
  productKey, 
  title = "Recommended Diagnostic Tool", 
  reason,
  surface = "repair-page-spotlight"
}: TopdonProductSpotlightProps) {
  const product = TOPDON_PRODUCTS[productKey];
  const url = buildTopdonProductUrl(product.slug);

  const handleClick = () => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'affiliate_click', {
        provider: 'topdon',
        product: product.shortName,
        price: product.price,
        surface,
        tier: product.tier,
      });
    }
  };

  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-gray-900 to-black shadow-xl">
      <div className="flex flex-col md:flex-row">
        {/* Image Area */}
        <div className="relative flex items-center justify-center bg-white/5 p-6 md:w-1/3">
          <Image 
            src={product.image} 
            alt={product.name} 
            width={240} 
            height={240} 
            className="object-contain drop-shadow-2xl"
          />
          <div className="absolute top-4 left-4 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
            Pro Choice
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">{title}</h3>
          <h4 className="mt-2 text-2xl font-bold text-white">{product.name}</h4>
          
          <p className="mt-4 text-sm leading-relaxed text-gray-300">
            {reason || product.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Professional Price</p>
              <p className="text-2xl font-bold text-white">${product.price}</p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="sponsored noopener"
              onClick={handleClick}
              className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-orange-500/20"
            >
              Check Price on TOPDON →
            </a>
          </div>
          
          <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-6">
            {product.features.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-gray-400">
                <svg className="h-3 w-3 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
