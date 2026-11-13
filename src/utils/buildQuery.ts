export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

export function buildQuery(params: QueryParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}
