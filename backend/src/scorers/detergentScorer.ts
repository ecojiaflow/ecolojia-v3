const RED_FLAGS = [/sls\b/i, /sles\b/i, /methylisothiazolinone/i, /benzisothiazolinone/i, /optical brightener/i];

export function scoreDetergent(input: { ingredients?: string }) {
  const text = input.ingredients || '';
  const flags = RED_FLAGS.reduce((acc, rx)=> acc + (rx.test(text) ? 1 : 0), 0);
  const base = 85;
  const health = Math.max(20, base - flags*12);
  const eco    = Math.max(25, 80 - flags*10);
  const global = Math.round(0.6*health + 0.4*eco);
  return { health, eco, global, flags };
}
