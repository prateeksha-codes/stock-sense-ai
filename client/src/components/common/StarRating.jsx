import React, { useState } from 'react';

// Display-only mode: pass { value }
// Input mode: pass { value, onChange } — used for submitting reviews
const StarRating = ({ value = 0, onChange = null, size = 'md', showNumber = false }) => {
  const [hover, setHover] = useState(0);
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };
  const interactive = typeof onChange === 'function';

  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hover || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            className={`${sizes[size]} ${
              interactive ? 'cursor-pointer' : 'cursor-default'
            } transition-colors leading-none`}
            style={{ color: filled ? '#f59e0b' : '#d1d5db' }}
          >
            ★
          </button>
        );
      })}
      {showNumber && (
        <span className="ml-1 text-sm text-gray-600">
          {Number(value).toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;