'use client';

import React, { useState } from 'react';
import { Wrench, ShoppingBag, ExternalLink, Check, Square } from 'lucide-react';
import { getAmazonAffiliateLink, type AffiliateVehicle } from '../lib/affiliateLinks';

interface ParsedItem {
  id: string;
  name: string;
  type: 'part' | 'tool' | 'consumable';
  affiliateUrl: string;
}

interface PartsConciergeProps {
  text: string;
  vehicle?: AffiliateVehicle;
}

export function parsePartsAndTools(
  text: string,
  vehicle?: AffiliateVehicle
): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = text.split('\n');

  const partRegex = /^\s*-\s*\*\*Part:\*\*\s*(.+)$/i;
  const toolRegex = /^\s*-\s*\*\*Tool:\*\*\s*(.+)$/i;
  const consumableRegex = /^\s*-\s*\*\*Consumable:\*\*\s*(.+)$/i;

  lines.forEach((line, index) => {
    let match = line.match(partRegex);
    if (match && match[1]) {
      const name = match[1].trim();
      items.push({
        id: `part-${index}`,
        name,
        type: 'part',
        affiliateUrl: getAmazonAffiliateLink(name, vehicle),
      });
      return;
    }

    match = line.match(toolRegex);
    if (match && match[1]) {
      const name = match[1].trim();
      items.push({
        id: `tool-${index}`,
        name,
        type: 'tool',
        affiliateUrl: getAmazonAffiliateLink(name), // tools generally do not need exact vehicle fit
      });
      return;
    }

    match = line.match(consumableRegex);
    if (match && match[1]) {
      const name = match[1].trim();
      items.push({
        id: `consumable-${index}`,
        name,
        type: 'consumable',
        affiliateUrl: getAmazonAffiliateLink(name, vehicle),
      });
    }
  });

  return items;
}

export default function PartsConcierge({ text, vehicle }: PartsConciergeProps) {
  const items = parsePartsAndTools(text, vehicle);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  if (items.length === 0) return null;

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Group items by type for better layout
  const parts = items.filter((item) => item.type === 'part');
  const tools = items.filter((item) => item.type === 'tool');
  const consumables = items.filter((item) => item.type === 'consumable');

  const renderSection = (title: string, sectionItems: ParsedItem[], badgeColor: string, textColor: string) => {
    if (sectionItems.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{title}</h4>
        <div className="space-y-2">
          {sectionItems.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-xl border border-white/5 bg-black/30 p-3 transition-all duration-300 hover:border-white/10 ${
                  isChecked ? 'opacity-50' : ''
                }`}
              >
                <div
                  className="flex flex-1 cursor-pointer items-center space-x-3 select-none"
                  onClick={() => toggleCheck(item.id)}
                >
                  <button className="text-gray-400 hover:text-white transition">
                    {isChecked ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded border border-cyan-400 bg-cyan-950/50 text-cyan-400">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <Square className="h-5 w-5 opacity-70" />
                    )}
                  </button>
                  <span
                    className={`text-sm font-medium transition ${
                      isChecked ? 'line-through text-gray-500' : 'text-gray-200'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
                <a
                  href={item.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ml-4 flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/[0.04] border border-white/5 hover:border-white/10 hover:bg-white/[0.08] transition duration-200 ${textColor}`}
                >
                  <span>Shop</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#121214] to-[#0d0d0f] p-5 shadow-2xl">
      <div className="flex items-center space-x-3 border-b border-white/5 pb-4 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
          <Wrench className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-wider text-white uppercase">DIY Parts & Tools Concierge</h3>
          <p className="text-xs text-gray-400">Checked items are saved. Click Shop to open exact Amazon affiliate fits.</p>
        </div>
      </div>

      <div className="space-y-4">
        {renderSection('Required Parts', parts, 'bg-cyan-500/10 text-cyan-400', 'text-cyan-400')}
        {renderSection('Required Tools', tools, 'bg-amber-500/10 text-amber-400', 'text-amber-400')}
        {renderSection('Consumables & Liquids', consumables, 'bg-emerald-500/10 text-emerald-400', 'text-emerald-400')}
      </div>
    </div>
  );
}
