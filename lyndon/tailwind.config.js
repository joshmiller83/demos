// Rebuilt from the Lyndon urban theme tokens. The original config was not part
// of the portfolio snapshot.
const tokens = file => require(`./src/tailwind/tokens/urban/${file}`);

module.exports = {
  // Purge utilities (only lbj-person-card's shadow CSS pulls them in) down to
  // classes actually used in component markup.
  purge: {
    enabled: true,
    content: ['./src/**/*.tsx'],
  },
  future: {
    removeDeprecatedGapUtilities: true,
  },
  theme: {
    screens: tokens('screens.json'),
    colors: tokens('colors.json'),
    fontFamily: tokens('font-family.json'),
    extend: {
      spacing: tokens('spacing.json'),
      fontSize: tokens('font-size.json'),
      lineHeight: tokens('line-height.json'),
      height: tokens('height.json'),
      zIndex: tokens('z-index.json'),
      borderRadius: tokens('border-radius.json'),
      borderWidth: tokens('border-width.json'),
      inset: tokens('inset.js'),
      boxShadow: tokens('box-shadows.js'),
      // Tailwind 1.x has no extralight; Lyndon's config added it.
      fontWeight: { extralight: '200' },
    },
  },
};
