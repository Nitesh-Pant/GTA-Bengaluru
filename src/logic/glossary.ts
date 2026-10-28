/**
 * Picks the Kannada / Hindi words in a line worth explaining, in the order they appear:
 * phrases first (so "swalpa adjust maadi" isn't split up), then single words, each once.
 */
export function glossFor(
  text: string,
  words: Readonly<Record<string, string>>,
  phrases: Readonly<Record<string, string>>,
  max = 3,
): Array<{ word: string; meaning: string }> {
  const lower = ` ${text.toLowerCase().replace(/[^a-z\s'-]/g, ' ').replace(/\s+/g, ' ')} `;
  const found: Array<{ at: number; word: string; meaning: string }> = [];
  const covered: Array<[number, number]> = [];
  for (const [phrase, meaning] of Object.entries(phrases)) {
    const at = lower.indexOf(` ${phrase} `);
    if (at < 0) continue;
    found.push({ at, word: phrase, meaning });
    covered.push([at, at + phrase.length + 1]);
  }
  const seen = new Set<string>();
  const re = /[a-z'-]+/g;
  for (let m = re.exec(lower); m; m = re.exec(lower)) {
    const word = m[0];
    const meaning = words[word];
    if (!meaning || seen.has(word) || covered.some(([a, b]) => m!.index >= a && m!.index < b)) continue;
    seen.add(word);
    found.push({ at: m.index, word, meaning });
  }
  return found
    .sort((a, b) => a.at - b.at)
    .slice(0, max)
    .map(({ word, meaning }) => ({ word, meaning }));
}

/** "maga: dude · oota: meal", or '' when nothing needs explaining. */
export const glossLine = (items: ReadonlyArray<{ word: string; meaning: string }>) => items.map((g) => `${g.word}: ${g.meaning}`).join(' · ');
