const RED_FLAGS = [/paraben/i, /phenoxyethanol/i, /bht\b/i, /bpa\b/i, /siloxane/i, /sls\b/i, /peg-\d+/i];

export function scoreCosmetics(input: { ingredients?: string }) {
  const text = input.ingredients || '';
  const flags = RED_FLAGS.reduce((acc, rx)=> acc + (rx.test(text) ? 1 : 0), 0);
  const base = 90;
  const health = Math.max(25, base - flags*10);
  const eco    = Math.max(25, 85 - Math.floor(flags*7));
  const global = Math.round(0.75*health + 0.25*eco);
  return { health, eco, global, flags };
}
