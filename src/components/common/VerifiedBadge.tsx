import React from 'react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  className?: string;
  title?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'auto',
  className = '',
  title = 'Verified Store / ভেরিফাইড স্টোর'
}) => {
  // Proportional sizing: 1 step smaller than the container text font
  // If text is 12px (text-xs) -> badge is 11px
  // If text is 14px (text-sm) -> badge is 13px
  // If text is 16px (text-base) -> badge is 15px
  // If text is 20px (text-xl) -> badge is 18px (mobile)
  // If text is 24px (text-2xl) -> badge is 21px (desktop)
  // 'auto' uses 0.88em which automatically scales 1 step smaller than parent font size
  const sizeClasses = {
    xs: 'w-[11px] h-[11px] min-w-[11px]',
    sm: 'w-[13px] h-[13px] min-w-[13px]',
    md: 'w-[15px] h-[15px] min-w-[15px]',
    lg: 'w-[18px] h-[18px] min-w-[18px] sm:w-[21px] sm:h-[21px] sm:min-w-[21px]',
    xl: 'w-[22px] h-[22px] min-w-[22px]',
    auto: 'w-[0.9em] h-[0.9em] min-w-[0.9em]'
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle text-emerald-700 select-none ${sizeClasses} ${className}`}
      title={title}
      aria-label={title}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-full h-full block overflow-visible drop-shadow-[0_1px_1px_rgba(4,120,87,0.15)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Scalloped rosette official starburst outer badge */}
        <path
          d="M10.5213 2.62368C11.3147 1.75255 12.6853 1.75255 13.4787 2.62368L14.4989 3.74391C14.8998 4.18418 15.4761 4.42288 16.071 4.39508L17.5845 4.32435C18.7614 4.26934 19.7307 5.23857 19.6757 6.41554L19.6049 7.92905C19.5771 8.52388 19.8158 9.10016 20.2561 9.50111L21.3763 10.5213C22.2475 11.3147 22.2475 12.6853 21.3763 13.4787L20.2561 14.4989C19.8158 14.8998 19.5771 15.4761 19.6049 16.071L19.6757 17.5845C19.7307 18.7614 18.7614 19.7307 17.5845 19.6757L16.071 19.6049C15.4761 19.5771 14.8998 19.8158 14.4989 20.2561L13.4787 21.3763C12.6853 22.2475 11.3147 22.2475 10.5213 21.3763L9.50111 20.2561C9.10016 19.8158 8.52388 19.5771 7.92905 19.6049L6.41553 19.6757C5.23857 19.7307 4.26934 18.7614 4.32435 17.5845L4.39508 16.071C4.42288 15.4761 4.18418 14.8998 3.74391 14.4989L2.62368 13.4787C1.75255 12.6853 1.75255 11.3147 2.62368 10.5213L3.74391 9.50111C4.18418 9.10016 4.42288 8.52388 4.39508 7.92905L4.32435 6.41553C4.26934 5.23857 5.23857 4.26934 6.41554 4.32435L7.92905 4.39508C8.52388 4.42288 9.10016 4.18418 9.50111 3.74391L10.5213 2.62368Z"
          fill="currentColor"
        />
        {/* Authentic crisp white checkmark */}
        <path
          d="M9 12.3L11.2 14.5L15.8 9.8"
          stroke="#ffffff"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

interface VerifiedStoreNameProps {
  name: string;
  prefix?: string;
  badgeSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  className?: string;
  badgeClassName?: string;
}

/**
 * VerifiedStoreName:
 * Attaches the VerifiedBadge directly to the final word of the store name using whitespace-nowrap.
 * This guarantees the badge NEVER orphans onto a blank line alone, even on small mobile screens.
 */
export const VerifiedStoreName: React.FC<VerifiedStoreNameProps> = ({
  name,
  prefix = '',
  badgeSize = 'auto',
  className = '',
  badgeClassName = ''
}) => {
  const trimmed = (name || '').trim();
  const words = trimmed ? trimmed.split(/\s+/) : [];
  if (words.length === 0) return null;

  const lastWord = words[words.length - 1];
  const leadingWords = words.slice(0, -1).join(' ');

  return (
    <span className={className}>
      {prefix && `${prefix} `}
      {leadingWords && `${leadingWords} `}
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap align-middle">
        <span>{lastWord}</span>
        <VerifiedBadge size={badgeSize} className={badgeClassName} />
      </span>
    </span>
  );
};
