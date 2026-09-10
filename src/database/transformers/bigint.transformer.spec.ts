import { bigintTransformer } from './bigint.transformer';

describe('bigintTransformer', () => {
  describe('reading a column', () => {
    it('turns the string the driver returns into a number', () => {
      expect(bigintTransformer.from('1717200000000')).toBe(1717200000000);
    });

    it('keeps a missing timestamp null instead of turning it into zero', () => {
      expect(bigintTransformer.from(null)).toBeNull();
    });

    it('reads a stored zero as zero', () => {
      expect(bigintTransformer.from('0')).toBe(0);
    });

    it('reads a millisecond timestamp back without losing precision', () => {
      const timestamp = Date.UTC(2024, 5, 1, 12, 34, 56, 789);

      expect(bigintTransformer.from(String(timestamp))).toBe(timestamp);
      expect(timestamp).toBeLessThan(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('writing a column', () => {
    it('hands a number over as it is', () => {
      expect(bigintTransformer.to(1717200000000)).toBe(1717200000000);
    });

    it('hands null over as it is', () => {
      expect(bigintTransformer.to(null)).toBeNull();
    });
  });
});
