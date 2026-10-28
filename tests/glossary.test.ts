import { describe, expect, it } from 'vitest';
import { LINE_POOLS } from '../src/data/dialogue';
import { GLOSSARY, PHRASES } from '../src/data/glossary';
import { glossFor, glossLine } from '../src/logic/glossary';

const gloss = (text: string, max?: number) => glossFor(text, GLOSSARY, PHRASES, max);

describe('word meanings under speech', () => {
  it('explains Kannada and Hindi words in the order they appear', () => {
    expect(glossLine(gloss('Maga, coffee aaytha?'))).toBe('maga: dude · aaytha: done?');
    expect(glossLine(gloss('Arre yaar, cab cancel aaytu again.'))).toBe('arre: hey! · yaar: friend, mate · aaytu: it happened');
  });
  it('keeps a known phrase together instead of splitting it', () => {
    expect(gloss('Swalpa adjust maadi, ellaru hogbeku.')).toEqual([
      { word: 'swalpa adjust maadi', meaning: 'please adjust a little' },
      { word: 'ellaru', meaning: 'everyone' },
      { word: 'hogbeku', meaning: 'have to go' },
    ]);
  });
  it('explains each word once and at most three per line', () => {
    expect(gloss('Bega bega bega!')).toHaveLength(1);
    expect(gloss('Maga, swalpa bega, oota beku, mane hogona', 3)).toHaveLength(3);
  });
  it('leaves plain English alone', () => {
    expect(gloss('Honestly, this city runs on filter coffee and patience.')).toEqual([]);
  });
  it('has something to explain in most Kannada and Hindi street lines', () => {
    const lines = Object.values(LINE_POOLS).flat().map((l) => l.text);
    const explained = lines.filter((t) => gloss(t).length > 0).length;
    expect(explained / lines.length).toBeGreaterThan(0.4);
  });
});
