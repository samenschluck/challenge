export interface FoodProduct {
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,product_name_de,nutriments`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  const n = p.nutriments ?? {};
  return {
    name: p.product_name_de || p.product_name || 'Unbekanntes Produkt',
    kcalPer100g: Math.round(n['energy-kcal_100g'] ?? 0),
    proteinPer100g: +((n['proteins_100g'] ?? 0).toFixed(1)),
    carbsPer100g: +((n['carbohydrates_100g'] ?? 0).toFixed(1)),
    fatPer100g: +((n['fat_100g'] ?? 0).toFixed(1)),
  };
}
