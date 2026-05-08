import { normalizeRawEdges } from '../model/normalize-raw-edges';

describe('normalizeRawEdges', () => {
  it('expands string to into a single edge', () => {
    expect(normalizeRawEdges([{ from: 'a', to: 'b' }])).toEqual([
      { from: 'a', to: 'b' },
    ]);
  });

  it('expands array to into multiple edges', () => {
    expect(normalizeRawEdges([{ from: 'a', to: ['b', 'c'] }])).toEqual([
      { from: 'a', to: 'b' },
      { from: 'a', to: 'c' },
    ]);
  });

  it('handles mixed edges in one batch', () => {
    expect(
      normalizeRawEdges([
        { from: 'x', to: 'y' },
        { from: 'p', to: ['q', 'r'] },
      ]),
    ).toEqual([
      { from: 'x', to: 'y' },
      { from: 'p', to: 'q' },
      { from: 'p', to: 'r' },
    ]);
  });
});
