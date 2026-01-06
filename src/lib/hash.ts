// Hash utility functions for product verification
export async function generateProductHash(product: {
  product_no: string;
  product_name: string;
  brand: string;
  manufacture_date: string;
  expiry_date: string;
}): Promise<string> {
  const dataString = `${product.product_no}|${product.product_name}|${product.brand}|${product.manufacture_date}|${product.expiry_date}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyProductHash(
  storedHash: string,
  product: {
    product_no: string;
    product_name: string;
    brand: string;
    manufacture_date: string;
    expiry_date: string;
  }
): Promise<boolean> {
  const computedHash = await generateProductHash(product);
  return storedHash === computedHash;
}

export function isProductExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

export interface QRPayload {
  hash: string;
  product_no: string;
}

export function encodeQRPayload(payload: QRPayload): string {
  return btoa(JSON.stringify(payload));
}

export function decodeQRPayload(encoded: string): QRPayload | null {
  try {
    const decoded = atob(encoded);
    return JSON.parse(decoded) as QRPayload;
  } catch {
    return null;
  }
}
