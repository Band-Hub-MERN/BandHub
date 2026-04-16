import { useEffect, useMemo, useState, type ImgHTMLAttributes } from 'react';

const CATEGORY_COLORS: Record<string, string> = {
  Band: '#FFC904',
  Dance: '#A855F7',
  Acapella: '#22C55E',
  DJ: '#3B82F6',
  Comedy: '#F97316',
  'Frat/Sorority': '#EC4899',
  Poetry: '#14B8A6',
  Other: '#8A8A9A',
};

function getInitials(value: string): string {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'EV';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function isHexColor(value?: string): value is string {
  return Boolean(value && /^#([0-9A-Fa-f]{6})$/.test(value));
}

function buildPlaceholderImage(title: string, category: string, orgColor?: string): string {
  const accent = CATEGORY_COLORS[category] || '#FFC904';
  const brandColor = isHexColor(orgColor) ? orgColor : accent;
  const placeholderTitle = escapeSvgText(truncateText(title || 'Campus Event', 34));
  const placeholderCategory = escapeSvgText((category || 'Garage Jam').toUpperCase());
  const initials = escapeSvgText(getInitials(title || category || 'Event'));

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#09090B" />
          <stop offset="100%" stop-color="#17171C" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" />
      <circle cx="180" cy="110" r="180" fill="${accent}" fill-opacity="0.15" />
      <circle cx="1040" cy="520" r="240" fill="${brandColor}" fill-opacity="0.18" />
      <rect x="66" y="66" width="1068" height="498" rx="34" fill="none" stroke="rgba(255,255,255,0.10)" />
      <rect x="92" y="92" width="164" height="164" rx="28" fill="${brandColor}" fill-opacity="0.20" stroke="${brandColor}" stroke-opacity="0.35" />
      <text x="174" y="190" text-anchor="middle" fill="#FAFAFA" font-size="68" font-family="Arial, sans-serif" font-weight="700">${initials}</text>
      <text x="92" y="330" fill="${accent}" font-size="26" font-family="Arial, sans-serif" font-weight="700" letter-spacing="3">${placeholderCategory}</text>
      <text x="92" y="406" fill="#FAFAFA" font-size="64" font-family="Arial, sans-serif" font-weight="700">${placeholderTitle}</text>
      <text x="92" y="468" fill="#A1A1AA" font-size="28" font-family="Arial, sans-serif">Garage Jam event cover</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

type EventCoverImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  title: string;
  category: string;
  orgColor?: string;
};

export function EventCoverImage({
  src,
  alt,
  title,
  category,
  orgColor,
  onError,
  ...rest
}: EventCoverImageProps) {
  const [didError, setDidError] = useState(false);

  useEffect(() => {
    setDidError(false);
  }, [src]);

  const placeholderSrc = useMemo(
    () => buildPlaceholderImage(title, category, orgColor),
    [category, orgColor, title],
  );

  const normalizedSrc = typeof src === 'string' ? src.trim() : '';
  const resolvedSrc = !didError && normalizedSrc ? normalizedSrc : placeholderSrc;

  return (
    <img
      {...rest}
      src={resolvedSrc}
      alt={alt || title}
      onError={(event) => {
        if (!didError) {
          setDidError(true);
        }
        onError?.(event);
      }}
    />
  );
}
