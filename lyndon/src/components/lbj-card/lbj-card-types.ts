// Keep runtime sources of truth and derive types from them so values and types stay in sync
export const CARD_VARIANTS = ['grid', 'full', 'hero-featured', 'hero-basic', 'research'] as const;
export type CardVariant = (typeof CARD_VARIANTS)[number];

export const DATE_POSITIONS = ['above', 'below'] as const;
export type DatePosition = (typeof DATE_POSITIONS)[number];
