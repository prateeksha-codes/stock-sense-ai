import React from 'react';

// Reusable pill that shows stock status.
// Accepts either { stock, minStock } (numeric) or { status } ('in_stock' | 'low_stock' | 'out_of_stock')
const StockBadge = ({ stock, minStock, status, unit = '' }) => {
  let resolvedStatus = status;

  if (!resolvedStatus && typeof stock !== 'undefined') {
    const s = parseFloat(stock);
    const m = parseFloat(minStock || 0);
    if (s <= 0) resolvedStatus = 'out_of_stock';
    else if (s <= m) resolvedStatus = 'low_stock';
    else resolvedStatus = 'in_stock';
  }

  const config = {
    in_stock: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: '✓',
      label: 'In Stock',
    },
    low_stock: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: '⚠',
      label: `Only ${stock ?? ''}${unit ? ' ' + unit : ''} left`,
    },
    out_of_stock: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: '✕',
      label: 'Out of Stock',
    },
  };

  const c = config[resolvedStatus] || config.in_stock;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span>{c.icon}</span>
      <span>{c.label}</span>
    </span>
  );
};

export default StockBadge;