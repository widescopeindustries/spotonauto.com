'use client';

import Image from 'next/image';
import {
  type TopdonProduct,
  buildTopdonProductUrl,
  TOPDON_LOGO,
} from '@/lib/topdonAffiliate';

interface TopdonProductCardProps {
  product: TopdonProduct;
  /** Optional "Our Pick", "Best Value", "Best Budget" badge */
  badge?: string;
  /** Surface name for analytics */
  surface?: string;
  /** Compact mode for grids */
  compact?: boolean;
}

export default function TopdonProductCard({
  product,
  badge,
  surface = 'comparison',
  compact = false,
}: TopdonProductCardProps) {
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

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="sponsored noopener"
        onClick={handleClick}
        className="group relative flex flex-col bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        {badge && (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
            {badge}
          </span>
        )}
        <div className="relative bg-gray-50 p-4 flex items-center justify-center h-48">
          <Image
            src={product.image}
            alt={product.name}
            width={200}
            height={200}
            className="object-contain max-h-40 group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4 flex flex-col flex-1">
          <p className="text-gray-900 font-bold text-sm leading-tight">{product.shortName}</p>
          <p className="text-orange-600 font-bold text-lg mt-1">${product.price}</p>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2 flex-1">{product.bestFor}</p>
          <span className="mt-3 block text-center px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg group-hover:bg-orange-600 transition-colors">
            View on TOPDON
          </span>
        </div>
      </a>
    );
  }

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
      {badge && (
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg uppercase tracking-wide">
          {badge}
        </div>
      )}

      {/* Product image area */}
      <div className="relative bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <Image
          src={product.image}
          alt={product.name}
          width={300}
          height={300}
          className="object-contain max-h-56 drop-shadow-md"
        />
      </div>

      {/* Product details */}
      <div className="p-6 border-t border-gray-100">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-gray-900 font-bold text-xl leading-tight">{product.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{product.description}</p>
          </div>
          <Image
            src={TOPDON_LOGO}
            alt="TOPDON"
            width={80}
            height={24}
            className="shrink-0 opacity-60 mt-1"
          />
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-orange-600 font-bold text-2xl">${product.price}</span>
        </div>

        {/* Best for */}
        <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg">
          <span className="text-blue-700 text-sm font-semibold">Best for: </span>
          <span className="text-blue-600 text-sm">{product.bestFor}</span>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-5">
          {product.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-gray-700 text-sm">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <a
          href={url}
          target="_blank"
          rel="sponsored noopener"
          onClick={handleClick}
          className="block w-full text-center px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg text-base"
        >
          Check Price on TOPDON →
        </a>

        <p className="text-center text-gray-400 text-xs mt-2">
          Free shipping on orders over $59
        </p>
      </div>
    </div>
  );
}

/**
 * Horizontal comparison row for tables / side-by-side layouts.
 */
export function TopdonProductRow({
  product,
  highlight = false,
  surface = 'comparison-table',
}: {
  product: TopdonProduct;
  highlight?: boolean;
  surface?: string;
}) {
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
    <tr className={highlight ? 'bg-orange-50' : ''}>
      <td className="px-4 py-4 flex items-center gap-3">
        <Image
          src={product.image}
          alt={product.name}
          width={64}
          height={64}
          className="object-contain rounded-lg bg-gray-50 p-1"
        />
        <div>
          <p className="font-bold text-gray-900 text-sm">{product.shortName}</p>
          <p className="text-gray-500 text-xs">{product.bestFor}</p>
        </div>
      </td>
      <td className="px-4 py-4 text-orange-600 font-bold">${product.price}</td>
      <td className="px-4 py-4">
        <a
          href={url}
          target="_blank"
          rel="sponsored noopener"
          onClick={handleClick}
          className="inline-block px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
        >
          View →
        </a>
      </td>
    </tr>
  );
}
