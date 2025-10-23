export function scoreFood(input: { nutriScore?: 'A'|'B'|'C'|'D'|'E'; novaGroup?: 1|2|3|4; ecoScore?: 'A'|'B'|'C'|'D'|'E' }) {
  const mapLetter = (g?: string) => ({A:95,B:85,C:70,D:50,E:30}[g as any] ?? 55);
  const mapNova   = (n?: number) => ({1:95,2:80,3:55,4:30}[n as any] ?? 55);

  const health = Math.round(0.65 * mapLetter(input.nutriScore) + 0.35 * mapNova(input.novaGroup));
  const eco    = Math.round(input.ecoScore ? mapLetter(input.ecoScore) : 60);
  const global = Math.round(0.7*health + 0.3*eco);
  return { health, eco, global };
}
