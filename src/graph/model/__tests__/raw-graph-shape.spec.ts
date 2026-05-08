import { isRawGraphData } from '../raw-graph-shape';

describe('isRawGraphData', () => {
  it('accepts minimal valid document', () => {
    expect(
      isRawGraphData({
        nodes: [{ name: 'a', kind: 'service' }],
        edges: [{ from: 'a', to: 'b' }],
      }),
    ).toBe(true);
  });

  it('accepts edge to as array', () => {
    expect(
      isRawGraphData({
        nodes: [
          { name: 'a', kind: 'service' },
          { name: 'b', kind: 'service' },
        ],
        edges: [{ from: 'a', to: ['b'] }],
      }),
    ).toBe(true);
  });

  it('rejects non-object', () => {
    expect(isRawGraphData(null)).toBe(false);
    expect(isRawGraphData([])).toBe(false);
  });

  it('rejects missing node fields', () => {
    expect(
      isRawGraphData({
        nodes: [{ name: 1, kind: 'service' }],
        edges: [],
      }),
    ).toBe(false);
  });
});
