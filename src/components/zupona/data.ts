import catBath from "@/assets/cat-bath.jpg";
import catBeauty from "@/assets/cat-beauty.jpg";
import catMensAcc from "@/assets/cat-mens-acc.jpg";
import catWomensAcc from "@/assets/cat-womens-acc.jpg";
import catMensFashion from "@/assets/cat-mens-fashion.jpg";
import catWomensFashion from "@/assets/cat-womens-fashion.jpg";
import catBaby from "@/assets/cat-baby.jpg";
import catToys from "@/assets/cat-toys.jpg";
import catHome from "@/assets/cat-home.jpg";
import pSoap from "@/assets/p-soap.jpg";
import pBar from "@/assets/p-bar.jpg";
import pSerum from "@/assets/p-serum.jpg";
import pWatch from "@/assets/p-watch.jpg";
import pWatchRose from "@/assets/p-watch-rose.jpg";
import pPolo from "@/assets/p-polo.jpg";
import pShirtMan from "@/assets/p-shirt-man.jpg";

export type Category = { slug: string; name: string; image: string };

export const categories: Category[] = [
  { slug: "bath-body", name: "Bath & Body", image: catBath },
  { slug: "health-beauty", name: "Health & Beauty", image: catBeauty },
  { slug: "mens-accessories", name: "Men's Accessories", image: catMensAcc },
  { slug: "womens-accessories", name: "Women's Accessories", image: catWomensAcc },
  { slug: "mens-fashion", name: "Men's Fashion", image: catMensFashion },
  { slug: "womens-fashion", name: "Women's Fashion", image: catWomensFashion },
  { slug: "baby-accessories", name: "Baby Accessories", image: catBaby },
  { slug: "toys", name: "Toys", image: catToys },
  { slug: "home-living", name: "Home & Living", image: catHome },
];

export type Product = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  image: string;
  price: number;
  oldPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  category: string;
  bestSelling?: boolean;
  topPick?: boolean;
};

const raw: Omit<Product, "discount" | "id">[] = [
  {
    slug: "lux-botanicals-liquid-soap",
    brand: "Lux Botanicals",
    name: "Liquid Soap",
    image: pSoap,
    price: 320,
    oldPrice: 450,
    rating: 4.8,
    reviews: 125,
    category: "bath-body",
    bestSelling: true,
  },
  {
    slug: "dove-beauty-cream-bar-soap",
    brand: "Dove Beauty",
    name: "Cream Bar Soap",
    image: pBar,
    price: 210,
    oldPrice: 260,
    rating: 4.7,
    reviews: 98,
    category: "bath-body",
    bestSelling: true,
  },
  {
    slug: "the-ordinary-niacinamide-serum",
    brand: "The Ordinary",
    name: "Niacinamide 10% + Zinc 1% Serum",
    image: pSerum,
    price: 980,
    oldPrice: 1400,
    rating: 4.9,
    reviews: 210,
    category: "health-beauty",
    bestSelling: true,
  },
  {
    slug: "naviforce-nf9163-mens-watch",
    brand: "NAVIFORCE NF9163",
    name: "Men's Watch",
    image: pWatch,
    price: 2850,
    oldPrice: 3900,
    rating: 4.6,
    reviews: 76,
    category: "mens-accessories",
    bestSelling: true,
  },
  {
    slug: "curren-rose-gold-watch",
    brand: "Curren Classic",
    name: "Rose Gold Watch",
    image: pWatchRose,
    price: 3150,
    oldPrice: 4200,
    rating: 4.7,
    reviews: 64,
    category: "mens-accessories",
    topPick: true,
  },
  {
    slug: "zupona-tan-handbag",
    brand: "Zupona Leather",
    name: "Tan Handbag",
    image: catWomensAcc,
    price: 1890,
    oldPrice: 2400,
    rating: 4.8,
    reviews: 142,
    category: "womens-accessories",
    topPick: true,
  },
  {
    slug: "urban-basics-black-polo",
    brand: "Urban Basics",
    name: "Black Polo T-Shirt",
    image: pPolo,
    price: 690,
    oldPrice: 990,
    rating: 4.5,
    reviews: 233,
    category: "mens-fashion",
    topPick: true,
  },
  {
    slug: "formal-line-black-shirt",
    brand: "Formal Line",
    name: "Slim Fit Black Shirt",
    image: pShirtMan,
    price: 1250,
    oldPrice: 1650,
    rating: 4.6,
    reviews: 88,
    category: "mens-fashion",
    topPick: true,
  },
  {
    slug: "zupona-beige-blazer",
    brand: "Zupona Signature",
    name: "Beige Formal Blazer",
    image: catMensFashion,
    price: 3450,
    oldPrice: 4600,
    rating: 4.7,
    reviews: 51,
    category: "mens-fashion",
  },
  {
    slug: "noor-embroidered-abaya",
    brand: "Noor Modest",
    name: "Embroidered Abaya Set",
    image: catWomensFashion,
    price: 2790,
    oldPrice: 3500,
    rating: 4.9,
    reviews: 176,
    category: "womens-fashion",
    bestSelling: true,
  },
  {
    slug: "babycare-feeding-bottle-set",
    brand: "BabyCare",
    name: "Feeding Bottle & Pacifier Set",
    image: catBaby,
    price: 540,
    oldPrice: 720,
    rating: 4.6,
    reviews: 92,
    category: "baby-accessories",
  },
  {
    slug: "smart-dancing-robot-toy",
    brand: "PlayLab",
    name: "Smart Dancing Robot Toy",
    image: catToys,
    price: 1450,
    oldPrice: 1990,
    rating: 4.5,
    reviews: 118,
    category: "toys",
    topPick: true,
  },
  {
    slug: "nordic-boucle-armchair",
    brand: "Nordic Living",
    name: "Bouclé Accent Armchair",
    image: catHome,
    price: 12900,
    oldPrice: 16500,
    rating: 4.8,
    reviews: 34,
    category: "home-living",
  },
  {
    slug: "zupona-body-lotion-duo",
    brand: "Zupona Care",
    name: "Body Lotion Duo Pack",
    image: catBath,
    price: 760,
    oldPrice: 1050,
    rating: 4.7,
    reviews: 145,
    category: "bath-body",
  },
  {
    slug: "glow-vitamin-c-facial-oil",
    brand: "Glow Lab",
    name: "Vitamin C Facial Oil",
    image: catBeauty,
    price: 1180,
    oldPrice: 1600,
    rating: 4.8,
    reviews: 203,
    category: "health-beauty",
    topPick: true,
  },
  {
    slug: "elite-black-gold-chronograph",
    brand: "Elite Box",
    name: "Black & Gold Chronograph",
    image: catMensAcc,
    price: 4250,
    oldPrice: 5600,
    rating: 4.6,
    reviews: 47,
    category: "mens-accessories",
  },
];

export const products: Product[] = raw.map((p, i) => ({
  ...p,
  id: String(i + 1),
  discount: Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100),
}));

export const bestSelling = products.filter((p) => p.bestSelling);
export const topPicks = products.filter((p) => p.topPick);
export const deals = [...products].sort((a, b) => b.discount - a.discount);

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const productsByCategory = (slug: string) => products.filter((p) => p.category === slug);
export const searchProducts = (q: string) => {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return products.filter((p) =>
    `${p.brand} ${p.name} ${getCategory(p.category)?.name ?? ""}`.toLowerCase().includes(t),
  );
};
export const formatTk = (n: number) => `৳${n.toLocaleString()}`;

export const formatSavings = (p: Product) =>
  `${formatTk(p.oldPrice - p.price)} OFF`;

export const hasDiscount = (p: Product) => p.oldPrice > p.price;

const variantsByCategory: Record<string, string[]> = {
  "bath-body": ["250 ml", "500 ml", "1 L"],
  beauty: ["Mini", "Regular", "Value pack"],
  fashion: ["S", "M", "L", "XL"],
  watches: ["Silver", "Gold", "Black"],
  home: ["Single", "Pack of 2", "Pack of 4"],
  baby: ["Small", "Medium", "Large"],
  toys: ["Standard", "Deluxe"],
};

/** Selectable options shown in quick view; falls back to a simple pack choice. */
export const variantsFor = (product: Product): string[] =>
  variantsByCategory[product.category] ?? ["Single", "Pack of 2"];

/* ============================================================
   Product detail data (the local Zupona "database")
   ============================================================ */

export type ProductDetail = {
  images: string[];
  description: string;
  features: string[];
  specs: { label: string; value: string }[];
  stock: number;
  variantLabel: string;
  variants: string[];
};

const variantLabelByCategory: Record<string, string> = {
  "bath-body": "Select size",
  "health-beauty": "Select size",
  "mens-fashion": "Select size",
  "womens-fashion": "Select size",
  "mens-accessories": "Select colour",
  "womens-accessories": "Select colour",
  "baby-accessories": "Select pack",
  toys: "Select edition",
  "home-living": "Select pack",
};

const variantsBySlugCategory: Record<string, string[]> = {
  "bath-body": ["250 ml", "500 ml", "1 L"],
  "health-beauty": ["30 ml", "60 ml"],
  "mens-fashion": ["S", "M", "L", "XL", "XXL"],
  "womens-fashion": ["S", "M", "L", "XL"],
  "mens-accessories": ["Silver", "Gold", "Black"],
  "womens-accessories": ["Tan", "Black"],
  "baby-accessories": ["Starter pack", "Family pack"],
  toys: ["Standard", "Deluxe"],
  "home-living": ["Single", "Pack of 2"],
};

const detailBySlug: Record<
  string,
  { description: string; features: string[]; material?: string; stock: number }
> = {
  "lux-botanicals-liquid-soap": {
    description:
      "A gentle botanical hand and body wash that cleanses without stripping moisture, leaving skin soft with a light floral finish.",
    features: ["Botanical extract blend", "pH-balanced formula", "Non-drying daily cleanser", "Pump bottle"],
    material: "Plant-derived surfactants",
    stock: 24,
  },
  "dove-beauty-cream-bar-soap": {
    description:
      "Classic moisturising beauty bar with 1/4 cleansing cream that keeps skin feeling smooth after every wash.",
    features: ["1/4 moisturising cream", "Mild on sensitive skin", "Rich, creamy lather"],
    material: "Cream soap base",
    stock: 40,
  },
  "the-ordinary-niacinamide-serum": {
    description:
      "High-strength vitamin and zinc serum that visibly reduces the look of blemishes and balances excess oil over time.",
    features: ["10% Niacinamide", "1% Zinc PCA", "Water-based, oil-free", "Suitable for oily skin"],
    material: "Water-based serum",
    stock: 5,
  },
  "naviforce-nf9163-mens-watch": {
    description:
      "Sporty multifunction quartz watch with a stainless steel case, luminous hands and everyday water resistance.",
    features: ["Japanese quartz movement", "Stainless steel case", "3 ATM water resistant", "Luminous hands"],
    material: "Stainless steel",
    stock: 12,
  },
  "curren-rose-gold-watch": {
    description:
      "Minimal dress watch in a warm rose gold finish with a slim case profile that pairs with formal and casual looks.",
    features: ["Slim 9 mm case", "Rose gold plating", "Mineral crystal glass"],
    material: "Alloy with rose gold plating",
    stock: 9,
  },
  "zupona-tan-handbag": {
    description:
      "Structured tan handbag with a roomy lined interior, inner zip pocket and a detachable shoulder strap.",
    features: ["Detachable strap", "Zip inner pocket", "Structured base", "Gold-tone hardware"],
    material: "PU leather",
    stock: 15,
  },
  "urban-basics-black-polo": {
    description:
      "Everyday pique polo cut for a regular fit, with a ribbed collar that holds its shape wash after wash.",
    features: ["Breathable cotton pique", "Regular fit", "Ribbed collar and cuffs", "Machine washable"],
    material: "100% cotton",
    stock: 30,
  },
  "formal-line-black-shirt": {
    description:
      "Slim fit formal shirt in a soft wrinkle-resistant weave, tailored for office wear and evening events.",
    features: ["Slim fit", "Wrinkle resistant", "Full sleeve with button cuff"],
    material: "Cotton blend",
    stock: 18,
  },
  "zupona-beige-blazer": {
    description:
      "Single-breasted beige blazer with a lightly padded shoulder and half lining for comfortable all-day wear.",
    features: ["Single breasted", "Half lined", "Notch lapel", "Two front pockets"],
    material: "Polyester viscose blend",
    stock: 7,
  },
  "noor-embroidered-abaya": {
    description:
      "Flowing embroidered abaya set with a matching hijab, cut in a breathable fabric that drapes softly.",
    features: ["Hand-finished embroidery", "Includes matching hijab", "Breathable drape fabric"],
    material: "Nida fabric",
    stock: 11,
  },
  "babycare-feeding-bottle-set": {
    description:
      "Anti-colic feeding bottle set with soft silicone nipples and a pacifier, all BPA-free and sterilisable.",
    features: ["BPA free", "Anti-colic valve", "Steriliser safe", "Includes pacifier"],
    material: "Food-grade PP and silicone",
    stock: 22,
  },
  "smart-dancing-robot-toy": {
    description:
      "Interactive dancing robot with light effects, music modes and gesture response for hours of play.",
    features: ["Music and dance modes", "LED light show", "USB rechargeable", "Ages 3+"],
    material: "ABS plastic",
    stock: 14,
  },
  "nordic-boucle-armchair": {
    description:
      "Bouclé accent armchair on solid wood legs with high-density foam cushioning and a deep, supportive seat.",
    features: ["Solid wood legs", "High-density foam", "Removable seat cushion"],
    material: "Bouclé fabric, solid wood",
    stock: 3,
  },
  "zupona-body-lotion-duo": {
    description:
      "Duo pack of fast-absorbing body lotion that keeps skin hydrated for up to 24 hours without a greasy feel.",
    features: ["24-hour hydration", "Non-greasy finish", "Two bottles included"],
    material: "Lotion emulsion",
    stock: 26,
  },
  "glow-vitamin-c-facial-oil": {
    description:
      "Lightweight vitamin C facial oil that brightens dull skin and boosts glow when used as the last step at night.",
    features: ["Stabilised vitamin C", "Lightweight, fast absorbing", "Dropper bottle"],
    material: "Cold-pressed oil blend",
    stock: 8,
  },
  "elite-black-gold-chronograph": {
    description:
      "Bold black and gold chronograph with three working sub-dials, presented in an Elite Box gift case.",
    features: ["Working chronograph", "Gift box included", "Scratch-resistant glass"],
    material: "Stainless steel",
    stock: 6,
  },
};

/** Detail record for a product, assembled from the product row + detail table. */
export const getProductDetail = (product: Product): ProductDetail => {
  const extra = detailBySlug[product.slug];
  const catImage = getCategory(product.category)?.image;
  const images = catImage && catImage !== product.image ? [product.image, catImage] : [product.image];
  const specs: { label: string; value: string }[] = [
    { label: "Brand", value: product.brand },
    { label: "Category", value: getCategory(product.category)?.name ?? product.category },
    ...(extra?.material ? [{ label: "Material", value: extra.material }] : []),
    { label: "SKU", value: `ZUP-${product.id.padStart(4, "0")}` },
    { label: "Country of origin", value: "Bangladesh" },
  ];
  return {
    images,
    description:
      extra?.description ??
      `${product.brand} ${product.name}, quality-checked by Zupona and delivered nationwide.`,
    features: extra?.features ?? [],
    specs,
    stock: extra?.stock ?? 10,
    variantLabel: variantLabelByCategory[product.category] ?? "Select option",
    variants: variantsBySlugCategory[product.category] ?? [],
  };
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  date: string;
  text: string;
};

const reviewPool = [
  { name: "Rafi H.", text: "Exactly as described and delivery was quick. Packaging was neat too." },
  { name: "Sadia K.", text: "Really good quality for the price. Would order again from Zupona." },
  { name: "Mahin R.", text: "Works well for daily use. Happy with the purchase overall." },
  { name: "Nusrat J.", text: "Genuine product, matched the photos. Only wish it came in more options." },
  { name: "Tanvir A.", text: "Solid value. Took two days to arrive in Dhaka." },
];

/** Deterministic review list derived from the product's rating so it stays stable across renders. */
export const getReviews = (product: Product): Review[] => {
  const seed = Number(product.id);
  return reviewPool.slice(0, 4).map((r, i) => {
    const day = ((seed * 7 + i * 5) % 27) + 1;
    const month = ((seed + i) % 12) + 1;
    return {
      id: `${product.slug}-r${i}`,
      name: r.name,
      rating: Math.max(3, Math.min(5, Math.round(product.rating) - (i === 3 ? 1 : 0))),
      date: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/2026`,
      text: r.text,
    };
  });
};

/** Rating distribution percentages (5→1) approximated from the average rating. */
export const ratingDistribution = (rating: number): number[] => {
  const five = Math.round((rating - 3) * 42);
  const four = Math.round((5 - rating) * 45);
  const three = Math.max(2, Math.round((5 - rating) * 18));
  const two = Math.max(1, Math.round((5 - rating) * 8));
  const one = Math.max(1, 100 - five - four - three - two);
  return [five, four, three, two, one];
};

/** Complementary products from other categories with a nearby price. */
export const frequentlyBoughtWith = (product: Product): Product[] =>
  products
    .filter((p) => p.slug !== product.slug && p.category !== product.category)
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, 2);

/** Related products: same category first, then similar price range. */
export const relatedProducts = (product: Product): Product[] => {
  const same = products.filter((p) => p.category === product.category && p.slug !== product.slug);
  if (same.length >= 4) return same.slice(0, 4);
  const nearby = products
    .filter((p) => p.slug !== product.slug && !same.includes(p))
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price));
  return [...same, ...nearby].slice(0, 4);
};
