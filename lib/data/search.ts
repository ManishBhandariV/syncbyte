import {
  productCategories,
  getCategoryUrl,
  getProductUrl,
} from "@/lib/data/products";

export type SearchResult =
  | {
      type: "category";
      name: string;
      description: string;
      category: string;
      category_slug: string;
      url: string;
      icon: string;
      product_count: number;
    }
  | {
      type: "product";
      id: string;
      name: string;
      description: string;
      category: string;
      category_slug: string;
      url: string;
      image: string;
    };

export function search(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];
  for (const [slug, category] of Object.entries(productCategories)) {
    if (category.name.toLowerCase().includes(q)) {
      results.push({
        type: "category",
        name: category.name,
        description: category.description,
        category: "Product Category",
        category_slug: slug,
        url: getCategoryUrl(slug),
        icon: category.icon,
        product_count: category.products.length,
      });
    }
    for (const product of category.products) {
      const name = product.name.toLowerCase();
      const desc = product.short_desc.toLowerCase();
      if (name.includes(q) || desc.includes(q)) {
        results.push({
          type: "product",
          id: product.id,
          name: product.name,
          description: product.short_desc,
          category: category.name,
          category_slug: slug,
          url: getProductUrl(slug, product.id),
          image: `/images/products/${encodeURIComponent(product.id)}.jpg`,
        });
      }
    }
  }
  return results;
}
