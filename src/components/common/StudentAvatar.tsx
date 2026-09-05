import React, { useState } from 'react';

interface StudentAvatarProps {
  src?: string | null;
  name?: string;
  gender?: 'ชาย' | 'หญิง' | string;
  className?: string;
  alt?: string;
}

// Crisp, friendly vector illustrations for student avatar fallback
const BOY_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%23E0F2FE"/><circle cx="50" cy="40" r="18" fill="%23FBBF24"/><path d="M34 34C34 26 41 20 50 20C59 20 66 26 66 34C66 35 65 37 63 37C61 37 60 35 58 33C55 31 52 30 50 30C48 30 45 31 42 33C40 35 39 37 37 37C35 37 34 35 34 34Z" fill="%23334155"/><circle cx="44" cy="40" r="2.2" fill="%231E293B"/><circle cx="56" cy="40" r="2.2" fill="%231E293B"/><path d="M46 47C47.5 49 52.5 49 54 47" stroke="%23EA580C" stroke-width="1.8" stroke-linecap="round"/><path d="M22 84C22 68 34 58 50 58C66 58 78 68 78 84" fill="%230284C7"/><path d="M50 58L44 68H56L50 58Z" fill="%23FFFFFF"/><polygon points="48,68 52,68 51,76 49,76" fill="%23E11D48"/></svg>`;

const GIRL_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%23FCE7F3"/><circle cx="50" cy="40" r="18" fill="%23FDE68A"/><path d="M30 36C30 24 39 18 50 18C61 18 70 24 70 36C70 42 66 46 66 50C66 52 64 54 62 54C60 48 59 40 59 36C56 32 53 30 50 30C47 30 44 32 41 36C41 40 40 48 38 54C36 54 34 52 34 50C34 46 30 42 30 36Z" fill="%23475569"/><circle cx="44" cy="40" r="2.2" fill="%231E293B"/><circle cx="56" cy="40" r="2.2" fill="%231E293B"/><path d="M46 47C47.5 49 52.5 49 54 47" stroke="%23E11D48" stroke-width="1.8" stroke-linecap="round"/><path d="M22 84C22 68 34 58 50 58C66 58 78 68 78 84" fill="%23DB2777"/><path d="M50 58L42 70H58L50 58Z" fill="%23FFFFFF"/><circle cx="50" cy="67" r="3" fill="%23F43F5E"/></svg>`;

const NEUTRAL_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%23F1F5F9"/><circle cx="50" cy="40" r="17" fill="%23CBD5E1"/><path d="M24 84C24 69 35 60 50 60C65 60 76 69 76 84" fill="%2394A3B8"/></svg>`;

export const getDemoAvatarUrl = (gender?: 'ชาย' | 'หญิง' | string) => {
  if (gender === 'ชาย') return BOY_AVATAR_SVG;
  if (gender === 'หญิง') return GIRL_AVATAR_SVG;
  return NEUTRAL_AVATAR_SVG;
};

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  src,
  name = 'นักเรียน',
  gender,
  className = 'w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 flex-shrink-0 shadow-2xs',
  alt
}) => {
  const [hasError, setHasError] = useState(false);

  // If no source provided or previous image load failed, use demo avatar
  const effectiveSrc = (!src || src.trim() === '' || hasError)
    ? getDemoAvatarUrl(gender)
    : src;

  return (
    <img
      src={effectiveSrc}
      alt={alt || name}
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  );
};
