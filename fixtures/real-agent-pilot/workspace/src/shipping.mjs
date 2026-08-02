export const SYNTHETIC_SHIPPING_CENTS = 500;

export function totalWithShipping(subtotalCents) {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new TypeError("subtotalCents must be a non-negative integer");
  }

  return subtotalCents;
}
