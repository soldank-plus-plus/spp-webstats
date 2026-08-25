// TypeORM returns bigint columns as strings by default (to avoid silent
// precision loss for values beyond Number.MAX_SAFE_INTEGER). This transformer
// converts back to a number, which is safe for millisecond unix timestamps,
// since they stay well within Number.MAX_SAFE_INTEGER.
export const bigintTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};
