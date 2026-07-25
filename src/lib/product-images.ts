import type { StoreCategory } from "@/lib/types";

const assets = (file: string) => `/assets/${file}`;

/** Category pools — fallback picks stay inside the same section. */
const categoryImagePools: Record<StoreCategory, string[]> = {
  "natural-honey": [
    assets("img6.jpeg"),
    assets("img7.jpeg"),
    assets("img1.jpeg"),
    assets("img4.jpeg"),
    assets("img13.jpeg"),
    assets("img16.jpeg"),
  ],
  sidr: [
    assets("img10.jpeg"),
    assets("img12.jpeg"),
    assets("img20.jpeg"),
    assets("img3.jpeg"),
  ],
  "bee-products": [
    assets("img12.jpeg"),
    assets("img20.jpeg"),
    assets("img19.jpeg"),
  ],
  "mixed-honey": [
    assets("img15.jpeg"),
    assets("img19.jpeg"),
    assets("img4.jpeg"),
  ],
  formulations: [assets("img17.jpeg"), assets("img24.jpeg")],
  "vip-formulations": [assets("img22.jpeg")],
  "natural-oils": [assets("img18.jpeg"), assets("img3.jpeg")],
  dates: [assets("img14.jpeg")],
};

export const productImages: Record<string, string> = {
  // Natural honey
  "clover-blossom": assets("img6.jpeg"),
  "citrus-blossom": assets("img1.jpeg"),
  "black-seed-honey": assets("img15.jpeg"),
  "sage-honey": assets("img16.jpeg"),
  "wild-herbs-honey": assets("img15.jpeg"),
  "nuts-honey": assets("img4.jpeg"),
  "citrus-wax": assets("img7.jpeg"),
  "clover-wax": assets("img6.jpeg"),
  "fennel-honey": assets("img16.jpeg"),
  "acacia-sunt": assets("img16.jpeg"),
  "anise-honey": assets("img16.jpeg"),

  // Sidr honey
  "sidr-egyptian": assets("img20.jpeg"),
  "sidr-kashmiri": assets("img10.jpeg"),
  "sidr-hadhrami": assets("img20.jpeg"),
  "sidr-saudi": assets("img12.jpeg"),
  "white-russian": assets("img3.jpeg"),

  // Bee products
  "royal-jelly": assets("img12.jpeg"),
  "bee-pollen": assets("img12.jpeg"),
  "palm-pollen": assets("img20.jpeg"),
  "red-ginseng": assets("img19.jpeg"),
  propolis: assets("img19.jpeg"),

  // Mixed honey
  "ginseng-honey": assets("img19.jpeg"),
  "royal-honey-blend": assets("img15.jpeg"),
  "propolis-honey": assets("img19.jpeg"),
  "squeeze-honey": assets("img15.jpeg"),

  // Formulations
  "custom-formulation": assets("img17.jpeg"),
  "vip-formulation": assets("img22.jpeg"),

  // Natural oils & rural products
  "rural-products": assets("img18.jpeg"),

  // Dates — storefront banner includes dates & nuts section
  "madinah-dates": assets("img14.jpeg"),
  "qassim-dates": assets("img14.jpeg"),
  "majdoul-dates": assets("img14.jpeg"),
  "ajwa-dates": assets("img14.jpeg"),
  "sukkari-dates": assets("img14.jpeg"),
};

export const blogImages: Record<string, string> = {
  storage: assets("img13.jpeg"),
  benefits: assets("img21.jpeg"),
  recipes: assets("img6.jpeg"),
};

function hashProductId(productId: string) {
  let hash = 0;

  for (let index = 0; index < productId.length; index += 1) {
    hash = (hash + productId.charCodeAt(index) * (index + 1)) % 997;
  }

  return hash;
}

export function getProductImage(productId: string, category?: StoreCategory) {
  if (productImages[productId]) {
    return productImages[productId];
  }

  if (category) {
    const pool = categoryImagePools[category];

    if (pool.length > 0) {
      return pool[hashProductId(productId) % pool.length];
    }
  }

  return assets("pic1.jpeg");
}

export function getBlogImage(postId: string) {
  return blogImages[postId] ?? blogImages.storage;
}
