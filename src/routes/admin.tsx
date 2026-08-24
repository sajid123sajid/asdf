import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ShoppingBag,
  Layers,
  DollarSign,
  Tag,
  Star,
  ExternalLink,
  ChevronRight,
  X,
  Image as ImageIcon,
  Check,
  Truck,
  Clock,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useShop } from "@/components/zupona/shop-store";
import {
  type Product,
  type ProductDetail,
  formatTk,
  categories,
  imagePresets,
} from "@/components/zupona/data";
import {
  deleteAdminProduct,
  getAdminDashboard,
  importAdminCatalog,
  saveAdminProduct,
  saveAdminSetting,
  updateAdminOrderStatus,
  uploadProductMedia,
} from "@/admin-api";
import type { OrderRecord } from "@/db";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Zupona Admin — Product & Catalog Management System" },
      { name: "description", content: "Manage, add, edit, and monitor the entire Zupona product catalog and orders." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type TabType = "catalog" | "new" | "orders" | "tools";

export function AdminPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    resetToDefaultProducts,
    importCatalog,
    getProductDetail,
  } = useShop();

  const [activeTab, setActiveTab] = useState<TabType>("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState<"all" | "in" | "low" | "out">("all");
  const [selectedBadge, setSelectedBadge] = useState<"all" | "bestSelling" | "topPick">("all");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "stock" | "name">("newest");

  // Editing state for Product Studio
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);

  // Studio Form State
  const [form, setForm] = useState({
    id: "",
    name: "",
    slug: "",
    brand: "",
    category: "mens-fashion",
    price: 990,
    oldPrice: 1290,
    stock: 20,
    rating: 4.8,
    reviews: 24,
    image: "",
    bestSelling: false,
    topPick: false,
    description: "",
    features: ["100% Genuine product", "Direct manufacturer warranty", "Express nationwide shipping"],
    specs: [
      { label: "Brand", value: "" },
      { label: "Material", value: "" },
      { label: "Country of origin", value: "Bangladesh" },
      { label: "Warranty", value: "7 Days Replacement" },
    ],
    variants: ["Standard", "Pack of 2"],
    variantLabel: "Select option",
    galleryImages: [] as string[],
  });

  const [featureInput, setFeatureInput] = useState("");
  const [variantInput, setVariantInput] = useState("");
  const [adminState, setAdminState] = useState<"loading" | "ready" | "denied">("loading");
  const [adminMessage, setAdminMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown>>({});
  const [settingsDraft, setSettingsDraft] = useState({
    store_name: "Zupona",
    announcement: "Free shipping on orders over Tk 1,500.",
    home_title: "Better essentials, delivered faster.",
    home_subtitle: "Premium products curated for daily life and smart living.",
  });

  useEffect(() => {
    let mounted = true;
    void getAdminDashboard()
      .then(({ catalog, orders: savedOrders, settings }) => {
        if (!mounted) return;
        importCatalog(
          catalog.map((item) => item.product),
          Object.fromEntries(catalog.map((item) => [item.product.slug, item.detail]))
        );
        setOrders(savedOrders);
        setSiteSettings(settings ?? {});
        setSettingsDraft({
          store_name: typeof settings?.store_name === "string" ? settings.store_name : "Zupona",
          announcement:
            typeof settings?.announcement === "string"
              ? settings.announcement
              : "Free shipping on orders over Tk 1,500.",
          home_title:
            typeof settings?.home_title === "string"
              ? settings.home_title
              : "Better essentials, delivered faster.",
          home_subtitle:
            typeof settings?.home_subtitle === "string"
              ? settings.home_subtitle
              : "Premium products curated for daily life and smart living.",
        });
        setAdminState("ready");
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setAdminMessage(error instanceof Error ? error.message : "You do not have access to the admin dashboard.");
        setAdminState("denied");
      });
    return () => {
      mounted = false;
    };
    // The catalog action is intentionally read only once when this protected page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Metric computations
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * (p.stock ?? 15)), 0);
    const lowStockCount = products.filter((p) => (p.stock ?? 15) > 0 && (p.stock ?? 15) <= 5).length;
    const outOfStockCount = products.filter((p) => (p.stock ?? 15) === 0).length;
    const bestSellerCount = products.filter((p) => p.bestSelling).length;
    return {
      totalProducts,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      bestSellerCount,
      categoriesCount: categories.length,
    };
  }, [products]);

  // Filtered and Sorted Catalog List
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesQuery =
          !searchQuery.trim() ||
          `${p.name} ${p.brand} ${p.category} ${p.slug}`.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCat = selectedCategory === "all" || p.category === selectedCategory;

        const stock = p.stock ?? 15;
        const matchesStock =
          selectedStockStatus === "all" ||
          (selectedStockStatus === "in" && stock > 5) ||
          (selectedStockStatus === "low" && stock > 0 && stock <= 5) ||
          (selectedStockStatus === "out" && stock === 0);

        const matchesBadge =
          selectedBadge === "all" ||
          (selectedBadge === "bestSelling" && p.bestSelling) ||
          (selectedBadge === "topPick" && p.topPick);

        return matchesQuery && matchesCat && matchesStock && matchesBadge;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "stock") return (a.stock ?? 15) - (b.stock ?? 15);
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return Number(b.id) - Number(a.id);
      });
  }, [products, searchQuery, selectedCategory, selectedStockStatus, selectedBadge, sortBy]);

  // Open Studio for adding a new product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      id: String(Date.now()),
      name: "",
      slug: "",
      brand: "Zupona Premium",
      category: categories[0]?.slug || "mens-fashion",
      price: 1200,
      oldPrice: 1600,
      stock: 25,
      rating: 4.8,
      reviews: 18,
      image: imagePresets[0]?.url || "",
      bestSelling: true,
      topPick: false,
      description: "Crafted with premium materials and quality checked for optimal satisfaction.",
      features: [
        "100% Genuine and authentic build",
        "Fast express shipping in 60 mins inside Dhaka",
        "30-day money-back guarantee",
      ],
      specs: [
        { label: "Brand", value: "Zupona Premium" },
        { label: "Material", value: "Premium Grade" },
        { label: "Country of origin", value: "Bangladesh" },
        { label: "Warranty", value: "7 Days Replacement Guarantee" },
      ],
      variants: ["Standard", "Deluxe Edition"],
      variantLabel: "Select option",
      galleryImages: [],
    });
    setStudioOpen(true);
  };

  // Open Studio for editing an existing product
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    const detail = getProductDetail(product);
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      category: product.category,
      price: product.price,
      oldPrice: product.oldPrice,
      stock: product.stock ?? detail.stock ?? 15,
      rating: product.rating,
      reviews: product.reviews,
      image: product.image,
      bestSelling: Boolean(product.bestSelling),
      topPick: Boolean(product.topPick),
      description: detail.description,
      features: detail.features || [],
      specs: detail.specs || [],
      variants: detail.variants || [],
      variantLabel: detail.variantLabel || "Select option",
      galleryImages: detail.images || [product.image],
    });
    setStudioOpen(true);
  };

  const applyPersistedCatalogItem = (item: { product: Product; detail: ProductDetail }) => {
    if (products.some((product) => product.id === item.product.id)) {
      updateProduct(item.product.id, item.product, item.detail);
    } else {
      addProduct(item.product, item.detail);
    }
  };

  // Duplicate a product
  const handleDuplicate = async (p: Product) => {
    const detail = getProductDetail(p);
    const newSlug = `${p.slug}-copy-${Date.now().toString().slice(-4)}`;
    try {
      const saved = await saveAdminProduct({
        data: {
          id: crypto.randomUUID(),
        name: `${p.name} (Copy)`,
        slug: newSlug,
        brand: p.brand,
        category: p.category,
        price: p.price,
        oldPrice: p.oldPrice,
        rating: p.rating,
        reviews: p.reviews,
        image: p.image,
        stock: p.stock ?? 15,
        bestSelling: false,
        topPick: false,
          description: detail.description,
          features: detail.features,
          specs: detail.specs,
          variants: detail.variants,
          variantLabel: detail.variantLabel,
          galleryImages: detail.images,
        },
      });
      applyPersistedCatalogItem(saved);
      toast.success(`Duplicated "${p.name}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not duplicate this product.");
    }
  };

  // Save product from Product Studio
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please provide a product title");
      return;
    }

    const finalSlug = form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const productPayload: Omit<Product, "discount"> = {
      id: editingProduct ? editingProduct.id : form.id || String(Date.now()),
      name: form.name.trim(),
      slug: finalSlug,
      brand: form.brand.trim() || "Zupona",
      category: form.category,
      price: Number(form.price) || 0,
      oldPrice: Number(form.oldPrice) || Number(form.price) || 0,
      rating: Number(form.rating) || 4.8,
      reviews: Number(form.reviews) || 12,
      image: form.image || imagePresets[0]?.url || "",
      stock: Number(form.stock) || 0,
      bestSelling: form.bestSelling,
      topPick: form.topPick,
    };

    const detailPayload: Partial<ProductDetail> = {
      images: form.galleryImages.length > 0 ? form.galleryImages : [productPayload.image],
      description: form.description || `${productPayload.brand} ${productPayload.name}`,
      features: form.features,
      specs: form.specs,
      variants: form.variants,
      variantLabel: form.variantLabel,
      stock: productPayload.stock,
    };

    try {
      const saved = await saveAdminProduct({
        data: {
          ...productPayload,
          description: detailPayload.description,
          features: detailPayload.features,
          specs: detailPayload.specs,
          variants: detailPayload.variants,
          variantLabel: detailPayload.variantLabel,
          galleryImages: detailPayload.images,
        },
      });
      applyPersistedCatalogItem(saved);
      setStudioOpen(false);
      toast.success(editingProduct ? "Product changes saved" : "Product published to the store");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this product.");
    }
  };

  const handleStockChange = async (product: Product, delta: number) => {
    const detail = getProductDetail(product);
    const nextStock = Math.max(0, (product.stock ?? detail.stock ?? 0) + delta);
    try {
      const saved = await saveAdminProduct({
        data: {
          ...product,
          stock: nextStock,
          description: detail.description,
          features: detail.features,
          specs: detail.specs,
          variants: detail.variants,
          variantLabel: detail.variantLabel,
          galleryImages: detail.images,
        },
      });
      updateStock(product.id, nextStock, true);
      applyPersistedCatalogItem(saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update stock.");
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    try {
      await deleteAdminProduct({ data: { id: product.id } });
      deleteProduct(product.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this product.");
    }
  };

  const refreshOrders = async () => {
    try {
      const dashboard = await getAdminDashboard();
      setOrders(dashboard.orders);
      toast.success("Orders refreshed from Cloudflare D1.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not refresh orders.");
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    try {
      const updated = await updateAdminOrderStatus({ data: { orderId, status } });
      if (updated) setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
      toast.success("Order status updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update order status.");
    }
  };

  const handleProductImageUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Images must be smaller than 8 MB.");
      return;
    }
    setUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read this image."));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      const uploaded = await uploadProductMedia({ data: { fileName: file.name, dataUrl } });
      setForm((current) => ({
        ...current,
        image: uploaded.url,
        galleryImages: Array.from(new Set([...current.galleryImages, uploaded.url])),
      }));
      toast.success("Image uploaded to Cloudflare R2.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      await saveAdminSetting({ data: { key, value } });
      setSiteSettings((current) => ({ ...current, [key]: value }));
      setSettingsDraft((current) => ({ ...current, [key]: value }));
      toast.success("Store settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    }
  };

  // Quick export catalog to JSON
  const handleExportJSON = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      products: products.map((product) => ({ product, detail: getProductDetail(product) })),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `zupona_products_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Catalog exported successfully!");
  };

  // Quick import catalog from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const source = Array.isArray(parsed)
          ? parsed
          : parsed && typeof parsed === "object" && Array.isArray((parsed as { products?: unknown }).products)
            ? (parsed as { products: unknown[] }).products
            : null;
        if (!source) throw new Error("Invalid JSON file format");
        void importAdminCatalog({
          data: {
            products: source.map((entry) => {
              const record = entry as { product?: Partial<Product>; detail?: Partial<ProductDetail> } & Partial<Product>;
              const product = record.product ?? record;
              const detail = record.detail;
              if (!product.name || !product.category) throw new Error("Each product needs a name and category.");
              return {
                id: product.id,
                name: product.name,
                slug: product.slug,
                brand: product.brand,
                category: product.category,
                price: product.price ?? 0,
                oldPrice: product.oldPrice,
                stock: product.stock,
                rating: product.rating,
                reviews: product.reviews,
                bestSelling: product.bestSelling,
                topPick: product.topPick,
                image: product.image,
                description: detail?.description,
                features: detail?.features,
                specs: detail?.specs,
                variants: detail?.variants,
                variantLabel: detail?.variantLabel,
                galleryImages: detail?.images,
              };
            }),
          },
        })
          .then(({ saved }) => {
            importCatalog(
              saved.map((item) => item.product),
              Object.fromEntries(saved.map((item) => [item.product.slug, item.detail]))
            );
            toast.success(`Imported ${saved.length} products to Cloudflare D1.`);
          })
          .catch((error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Could not import catalog.");
          });
      } catch {
        toast.error("Could not parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  // Add 5 trending demo products for quick store populating
  const handleAddTrendingDemos = async () => {
    const demos = [
      {
        name: "Wireless ANC Pro Earbuds",
        slug: `wireless-anc-pro-earbuds-${Date.now().toString().slice(-4)}`,
        brand: "SoundWave",
        category: "mens-accessories",
        price: 2450,
        oldPrice: 3500,
        image: imagePresets[0]?.url,
        stock: 30,
        bestSelling: true,
        topPick: true,
      },
      {
        name: "Silk Velvet Premium Saree",
        slug: `silk-velvet-saree-${Date.now().toString().slice(-4)}`,
        brand: "Zupona Heritage",
        category: "womens-fashion",
        price: 4900,
        oldPrice: 6500,
        image: imagePresets[8]?.url,
        stock: 12,
        bestSelling: true,
        topPick: false,
      },
      {
        name: "Hydra Boost Hyaluronic Cream",
        slug: `hydra-boost-cream-${Date.now().toString().slice(-4)}`,
        brand: "Derma Lab",
        category: "health-beauty",
        price: 850,
        oldPrice: 1200,
        image: imagePresets[4]?.url,
        stock: 45,
        bestSelling: false,
        topPick: true,
      },
      {
        name: "Minimalist Scandinavian Clock",
        slug: `minimalist-clock-${Date.now().toString().slice(-4)}`,
        brand: "Nordic Living",
        category: "home-living",
        price: 1650,
        oldPrice: 2200,
        image: imagePresets[12]?.url,
        stock: 8,
        bestSelling: false,
        topPick: true,
      },
      {
        name: "Smart Interactive Educational Pad",
        slug: `smart-edu-pad-${Date.now().toString().slice(-4)}`,
        brand: "PlayLab Kids",
        category: "toys",
        price: 1850,
        oldPrice: 2600,
        image: imagePresets[11]?.url,
        stock: 19,
        bestSelling: true,
        topPick: false,
      },
    ];

    try {
      const { saved } = await importAdminCatalog({
        data: {
          products: demos.map((demo) => ({
            ...demo,
            id: crypto.randomUUID(),
            image: demo.image ?? "",
            rating: 4.8,
            reviews: 0,
            description: `${demo.name} available now on Zupona.`,
            galleryImages: demo.image ? [demo.image] : [],
          })),
        },
      });
      saved.forEach(applyPersistedCatalogItem);
      toast.success("Added 5 trending products to Cloudflare D1.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add trending products.");
    }
  };

  const discountPercent =
    form.oldPrice > form.price ? Math.round(((form.oldPrice - form.price) / form.oldPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,180,0,0.15),_transparent_35%),_#f4f3f0] pb-16 pt-4">
      <div className="mx-auto max-w-[1360px] px-3 sm:px-5">
        <div className="overflow-hidden rounded-[28px] border border-[#e3dfd9] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
          <div className="border-b border-[#eee8df] bg-[#fffaf2] px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffb400] text-[#1e1b18] shadow-[0_10px_20px_rgba(255,180,0,0.25)]">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Zupona Marketplace Admin</h1>
                    <span className="rounded-full border border-[#ffd66a] bg-[#fff4d1] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a5b00]">
                      Live Ops
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Central commerce hub for inventory, catalog updates, merchandising, and fulfillment.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e7dfd5] bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-[#d4b164] hover:text-[#111827]"
                >
                  <Eye className="h-3.5 w-3.5 text-[#ff9f1c]" />
                  View storefront
                </Link>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_25px_rgba(17,24,39,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
                >
                  <Plus className="h-4 w-4 text-[#ffda80]" />
                  Add new product
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#f9f7f3] p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-2xl border border-[#ece5da] bg-white p-3.5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Products</span>
                  <Layers className="h-4 w-4 text-[#ff9f1c]" />
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">{metrics.totalProducts}</p>
                <span className="text-[10px] font-medium text-emerald-600">Live catalog</span>
              </div>

              <div className="rounded-2xl border border-[#ece5da] bg-white p-3.5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Revenue</span>
                  <DollarSign className="h-4 w-4 text-[#ff9f1c]" />
                </div>
                <p className="mt-3 text-xl font-black text-slate-900">{formatTk(metrics.totalInventoryValue)}</p>
                <span className="text-[10px] text-slate-500">Estimated inventory</span>
              </div>

              <div className="rounded-2xl border border-[#ece5da] bg-white p-3.5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Categories</span>
                  <Tag className="h-4 w-4 text-[#ff9f1c]" />
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">{metrics.categoriesCount}</p>
                <span className="text-[10px] text-slate-500">Channels</span>
              </div>

              <div className="rounded-2xl border border-[#ece5da] bg-white p-3.5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Best sellers</span>
                  <TrendingUp className="h-4 w-4 text-[#ff9f1c]" />
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">{metrics.bestSellerCount}</p>
                <span className="text-[10px] font-medium text-[#a16207]">Top picks</span>
              </div>

              <div className="rounded-2xl border border-[#ece5da] bg-white p-3.5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Low stock</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <p className="mt-3 text-2xl font-black text-amber-500">{metrics.lowStockCount}</p>
                <span className="text-[10px] text-amber-600">Need attention</span>
              </div>

              <div className="rounded-2xl border border-[#ece5da] bg-white p-3.5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Out of stock</span>
                  <XCircle className="h-4 w-4 text-rose-500" />
                </div>
                <p className="mt-3 text-2xl font-black text-rose-500">{metrics.outOfStockCount}</p>
                <span className="text-[10px] text-rose-600">Replenish soon</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-b border-[#ece5da] pb-2">
              {[
                { key: "catalog" as const, label: "Product Catalog", count: products.length, icon: Package },
                { key: "orders" as const, label: "Store Orders", count: orders.length, icon: ShoppingBag },
                { key: "settings" as const, label: "Store Settings", icon: SlidersHorizontal },
                { key: "tools" as const, label: "Backup & Data Tools", icon: Download },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[11px] font-bold transition ${
                      active
                        ? "border-[#f2bf52] bg-[#fff4d1] text-[#7a5400] shadow-sm"
                        : "border-[#ece5da] bg-white text-slate-600 hover:border-[#d4c3a8] hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${active ? "bg-[#f7c55e] text-[#5e3c00]" : "bg-slate-100 text-slate-600"}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TAB 1: PRODUCT CATALOG */}
        {activeTab === "catalog" && (
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-4 shadow-sm">
            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products by title, brand, category, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-8 text-xs text-foreground outline-none transition-colors focus:border-gold"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-gold"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStockStatus}
                  onChange={(e) => setSelectedStockStatus(e.target.value as any)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-gold"
                >
                  <option value="all">All Stock Status</option>
                  <option value="in">In Stock (&gt;5)</option>
                  <option value="low">Low Stock (1-5)</option>
                  <option value="out">Out of Stock (0)</option>
                </select>

                <select
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value as any)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-gold"
                >
                  <option value="all">All Badges</option>
                  <option value="bestSelling">Best Selling Only</option>
                  <option value="topPick">Top Picks Only</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-gold"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="price-asc">Sort: Price Low → High</option>
                  <option value="price-desc">Sort: Price High → Low</option>
                  <option value="stock">Sort: Stock Low → High</option>
                  <option value="name">Sort: Name A → Z</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase text-[11px]">
                  <tr>
                    <th className="px-3.5 py-3">Product</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Price &amp; Discount</th>
                    <th className="px-3 py-3">Stock Units</th>
                    <th className="px-3 py-3">Badges</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No products match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const stock = p.stock ?? 15;
                      const isLow = stock > 0 && stock <= 5;
                      const isOut = stock === 0;

                      return (
                        <tr key={p.id} className="transition-colors hover:bg-secondary/20">
                          {/* Product info & thumb */}
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/30">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="h-full w-full object-cover object-center"
                                />
                              </div>
                              <div className="min-w-0 max-w-[260px]">
                                <p className="truncate font-bold text-foreground sm:text-sm">{p.name}</p>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <span>{p.brand}</span>
                                  <span>•</span>
                                  <span className="font-mono text-[10px] text-gold-deep">
                                    SKU: ZUP-{String(p.id).padStart(4, "0")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-3 py-3">
                            <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-foreground">
                              {categories.find((c) => c.slug === p.category)?.name ?? p.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-3 py-3">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-foreground sm:text-sm">
                                {formatTk(p.price)}
                              </span>
                              {p.oldPrice > p.price && (
                                <div className="flex items-center gap-1 text-[11px]">
                                  <span className="text-muted-foreground line-through">
                                    {formatTk(p.oldPrice)}
                                  </span>
                                  <span className="font-bold text-sale">-{p.discount}%</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Stock Quick Adjust */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => void handleStockChange(p, -1)}
                                disabled={stock <= 0}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-xs font-bold hover:bg-secondary disabled:opacity-30"
                              >
                                -
                              </button>
                              <span
                                className={`min-w-8 text-center font-bold ${
                                  isOut ? "text-sale" : isLow ? "text-amber-500" : "text-foreground"
                                }`}
                              >
                                {stock}
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleStockChange(p, 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-xs font-bold hover:bg-secondary"
                              >
                                +
                              </button>
                              {isOut ? (
                                <span className="ml-1 rounded bg-sale/10 px-1.5 py-0.5 text-[9px] font-bold text-sale">
                                  OUT
                                </span>
                              ) : isLow ? (
                                <span className="ml-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                                  LOW
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* Badges */}
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1">
                              {p.bestSelling && (
                                <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold-deep">
                                  Best Seller
                                </span>
                              )}
                              {p.topPick && (
                                <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold text-blue-600">
                                  Top Pick
                                </span>
                              )}
                              {!p.bestSelling && !p.topPick && (
                                <span className="text-[10px] text-muted-foreground">Standard</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to="/product/$slug"
                                params={{ slug: p.slug }}
                                title="View on store"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-secondary hover:text-gold"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(p)}
                                title="Edit Product"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-gold/10 hover:text-gold-deep"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDuplicate(p)}
                                title="Duplicate"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-secondary"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteProduct(p)}
                                title="Delete Product"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-sale/10 hover:text-sale"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {filteredProducts.length} of {products.length} products</span>
              <span>All changes automatically sync to customer pages instantly.</span>
            </div>
          </div>
        )}

        {/* TAB 2: STORE ORDERS */}
        {activeTab === "orders" && (
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Customer Purchases &amp; Orders</h2>
                <p className="text-xs text-muted-foreground">
                  Monitor live orders created through Zupona checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    const rawOrders = localStorage.getItem("zupona.user_orders");
                    setOrders(rawOrders ? JSON.parse(rawOrders) : []);
                    toast.success("Orders refreshed");
                  } catch {
                    //
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Refresh Orders
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <p className="mt-3 text-sm font-semibold text-foreground">No orders recorded yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  When customers complete checkout, their order details will appear right here.
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-flex items-center rounded-lg bg-gold px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-gold-deep"
                >
                  Test Checkout in Store
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {orders.map((order: any, idx: number) => {
                  let items = [];
                  try {
                    items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
                  } catch {
                    items = [];
                  }

                  return (
                    <div
                      key={order.id || idx}
                      className="rounded-xl border border-border bg-background p-4 shadow-sm transition-all"
                    >
                      <div className="flex flex-col justify-between gap-2 border-b border-border/60 pb-3 sm:flex-row sm:items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-gold-deep">#{order.id}</span>
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                              {order.status || "Order confirmed"}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Customer: <strong className="text-foreground">{order.user_email}</strong> • Phone:{" "}
                            <strong className="text-foreground">{order.phone}</strong>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-extrabold text-foreground">
                            {formatTk(order.total_amount || 0)}
                          </span>
                          <p className="text-[11px] text-muted-foreground">
                            {order.payment_method || "Cash on Delivery"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground">Shipping Address:</p>
                          <p className="text-xs text-foreground">{order.shipping_address || "Dhaka, Bangladesh"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground">Ordered Items ({items.length}):</p>
                          <ul className="mt-1 space-y-1">
                            {items.map((it: any, i: number) => (
                              <li key={i} className="flex items-center justify-between text-xs">
                                <span className="truncate text-foreground">
                                  {it.qty}x {it.name || it.slug}
                                </span>
                                <span className="font-bold text-foreground">
                                  {formatTk((it.price || 0) * (it.qty || 1))}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STORE SETTINGS */}
        {activeTab === "settings" && (
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Storefront &amp; Homepage Settings</h2>
                <p className="text-xs text-muted-foreground">
                  Update branded copy and the homepage content that shoppers see before they browse your catalog.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Branding</h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground">Store name</label>
                    <input
                      type="text"
                      value={settingsDraft.store_name}
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, store_name: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveSetting("store_name", settingsDraft.store_name)}
                      className="mt-2 rounded-lg bg-gold px-3 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-gold-deep"
                    >
                      Save store name
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Announcement bar</label>
                    <textarea
                      rows={3}
                      value={settingsDraft.announcement}
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, announcement: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-card p-3 text-xs text-foreground outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveSetting("announcement", settingsDraft.announcement)}
                      className="mt-2 rounded-lg bg-gold px-3 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-gold-deep"
                    >
                      Save announcement
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Homepage hero</h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground">Hero headline</label>
                    <input
                      type="text"
                      value={settingsDraft.home_title}
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, home_title: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveSetting("home_title", settingsDraft.home_title)}
                      className="mt-2 rounded-lg bg-gold px-3 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-gold-deep"
                    >
                      Save headline
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Hero subtitle</label>
                    <textarea
                      rows={3}
                      value={settingsDraft.home_subtitle}
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, home_subtitle: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-card p-3 text-xs text-foreground outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveSetting("home_subtitle", settingsDraft.home_subtitle)}
                      className="mt-2 rounded-lg bg-gold px-3 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-gold-deep"
                    >
                      Save subtitle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BACKUP & TOOLS */}
        {activeTab === "tools" && (
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-bold text-foreground">Store Backup, Import &amp; Presets</h2>
            <p className="text-xs text-muted-foreground">
              Manage your product catalog JSON backups, generate demo inventory, or restore factory defaults.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Export */}
              <div className="flex flex-col justify-between rounded-xl border border-border bg-background p-4">
                <div>
                  <Download className="h-6 w-6 text-gold" />
                  <h3 className="mt-2 text-sm font-bold text-foreground">Export Catalog JSON</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Download a full JSON copy of all {products.length} products including pricing, stock, and descriptions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-gold-deep"
                >
                  <Download className="h-3.5 w-3.5" /> Download Backup
                </button>
              </div>

              {/* Import */}
              <div className="flex flex-col justify-between rounded-xl border border-border bg-background p-4">
                <div>
                  <Upload className="h-6 w-6 text-gold" />
                  <h3 className="mt-2 text-sm font-bold text-foreground">Import Catalog JSON</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Restore products from a previously exported JSON backup file.
                  </p>
                </div>
                <label className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary">
                  <Upload className="h-3.5 w-3.5 text-gold" /> Choose JSON File
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              </div>

              {/* Trending Demos */}
              <div className="flex flex-col justify-between rounded-xl border border-border bg-background p-4">
                <div>
                  <Sparkles className="h-6 w-6 text-gold" />
                  <h3 className="mt-2 text-sm font-bold text-foreground">Add 5 Trending Items</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Instantly inject 5 high-converting mock products with images, badges, and variants.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAddTrendingDemos()}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold bg-gold/10 px-3 py-2 text-xs font-bold text-gold-deep hover:bg-gold hover:text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Trending Demos
                </button>
              </div>

              {/* Factory Reset */}
              <div className="flex flex-col justify-between rounded-xl border border-sale/30 bg-sale/5 p-4">
                <div>
                  <RotateCcw className="h-6 w-6 text-sale" />
                  <h3 className="mt-2 text-sm font-bold text-sale">Factory Reset Catalog</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Resets the whole product catalog back to the original 16 starter items.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to reset the catalog back to factory defaults?")) {
                      resetToDefaultProducts();
                    }
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-sale px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-sale/90"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRODUCT STUDIO MODAL (ADD & EDIT) */}
      {studioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : "Create New Product"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure pricing, stock, high-res photos, features, specs, and variants.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudioOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                {/* Left Column: Form Fields */}
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="rounded-xl border border-border bg-background p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      1. General Details
                    </h3>

                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-foreground">Product Title *</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((prev) => ({
                              ...prev,
                              name: val,
                              slug: editingProduct ? prev.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                            }));
                          }}
                          placeholder="e.g. Luxury Rose Gold Chronograph Watch"
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-foreground">Brand Name</label>
                          <input
                            type="text"
                            value={form.brand}
                            onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                            placeholder="e.g. Zupona Signature"
                            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foreground">Category *</label>
                          <select
                            value={form.category}
                            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                          >
                            {categories.map((c) => (
                              <option key={c.slug} value={c.slug}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground">URL Slug (identifier)</label>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                          placeholder="e.g. rose-gold-chronograph"
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-mono text-muted-foreground outline-none focus:border-gold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Stock */}
                  <div className="rounded-xl border border-border bg-background p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      2. Pricing &amp; Inventory
                    </h3>

                    <div className="mt-3 grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-foreground">Sale Price (Tk) *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={form.price}
                          onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground">Regular Price (Tk)</label>
                        <input
                          type="number"
                          min={1}
                          value={form.oldPrice}
                          onChange={(e) => setForm((prev) => ({ ...prev, oldPrice: Number(e.target.value) }))}
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground outline-none focus:border-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground">Stock Quantity *</label>
                        <input
                          type="number"
                          min={0}
                          value={form.stock}
                          onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-gold"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={form.bestSelling}
                          onChange={(e) => setForm((prev) => ({ ...prev, bestSelling: e.target.checked }))}
                          className="h-4 w-4 rounded accent-gold"
                        />
                        <span>Feature in "Best Selling"</span>
                      </label>

                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={form.topPick}
                          onChange={(e) => setForm((prev) => ({ ...prev, topPick: e.target.checked }))}
                          className="h-4 w-4 rounded accent-gold"
                        />
                        <span>Feature in "Top Picks"</span>
                      </label>
                    </div>
                  </div>

                  {/* Photo & Presets Picker */}
                  <div className="rounded-xl border border-border bg-background p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      3. Media &amp; Product Image
                    </h3>

                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="block text-xs font-semibold text-foreground">Image URL / Path</label>
                        <input
                          type="text"
                          value={form.image}
                          onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                          placeholder="Paste image URL or pick a preset below"
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                        />
                      </div>

                      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-gold/50 bg-gold/5 px-3 py-2 text-xs font-semibold text-gold-deep hover:bg-gold/10">
                        <span>{uploadingImage ? "Uploading image to R2…" : "Upload a product image from your computer"}</span>
                        <span className="rounded bg-gold px-2 py-1 text-[10px] font-bold text-primary-foreground">Choose image</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          disabled={uploadingImage}
                          onChange={(event) => void handleProductImageUpload(event.target.files?.[0])}
                          className="sr-only"
                        />
                      </label>

                      {form.galleryImages.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground">Product gallery</p>
                          <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
                            {form.galleryImages.map((image, index) => (
                              <div key={`${image}-${index}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                                <img src={image} alt={`Product gallery image ${index + 1}`} className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setForm((current) => ({
                                    ...current,
                                    galleryImages: current.galleryImages.filter((_, imageIndex) => imageIndex !== index),
                                    image: current.image === image ? (current.galleryImages.filter((_, imageIndex) => imageIndex !== index)[0] ?? "") : current.image,
                                  }))}
                                  className="absolute right-0 top-0 rounded-bl bg-foreground/75 p-0.5 text-primary-foreground hover:bg-sale"
                                  aria-label={`Remove image ${index + 1}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          Quick Presets Library (Click to select photo):
                        </p>
                        <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
                          {imagePresets.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, image: preset.url }))}
                              className={`group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition-all ${
                                form.image === preset.url
                                  ? "border-gold ring-2 ring-gold/40"
                                  : "border-border opacity-70 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="h-full w-full object-cover"
                              />
                              {form.image === preset.url && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gold/40 text-primary-foreground">
                                  <Check className="h-4 w-4 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description & Features */}
                  <div className="rounded-xl border border-border bg-background p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      4. Description &amp; Highlights
                    </h3>

                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-foreground">Overview Description</label>
                        <textarea
                          rows={3}
                          value={form.description}
                          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the quality, materials, and benefits..."
                          className="mt-1 w-full rounded-lg border border-border bg-card p-3 text-xs text-foreground outline-none focus:border-gold"
                        />
                      </div>

                      {/* Features */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground">Bullet Highlights</label>
                        <div className="mt-1.5 flex gap-1.5">
                          <input
                            type="text"
                            value={featureInput}
                            onChange={(e) => setFeatureInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (featureInput.trim()) {
                                  setForm((prev) => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
                                  setFeatureInput("");
                                }
                              }
                            }}
                            placeholder="Add key bullet point and press Enter..."
                            className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-gold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (featureInput.trim()) {
                                setForm((prev) => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
                                setFeatureInput("");
                              }
                            }}
                            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-foreground hover:bg-gold hover:text-primary-foreground"
                          >
                            Add
                          </button>
                        </div>

                        <ul className="mt-2 space-y-1">
                          {form.features.map((feat, i) => (
                            <li
                              key={i}
                              className="flex items-center justify-between rounded-md bg-secondary/50 px-2.5 py-1 text-xs text-foreground"
                            >
                              <span>• {feat}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    features: prev.features.filter((_, idx) => idx !== i),
                                  }))
                                }
                                className="text-muted-foreground hover:text-sale"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Selectable Variants */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground">
                          Options &amp; Selectable Variants
                        </label>
                        <div className="mt-1.5 flex gap-1.5">
                          <input
                            type="text"
                            value={variantInput}
                            onChange={(e) => setVariantInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (variantInput.trim()) {
                                  setForm((prev) => ({ ...prev, variants: [...prev.variants, variantInput.trim()] }));
                                  setVariantInput("");
                                }
                              }
                            }}
                            placeholder="e.g. S, M, L, XL or 50ml, 100ml"
                            className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-gold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (variantInput.trim()) {
                                setForm((prev) => ({ ...prev, variants: [...prev.variants, variantInput.trim()] }));
                                setVariantInput("");
                              }
                            }}
                            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-foreground hover:bg-gold hover:text-primary-foreground"
                          >
                            Add
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {form.variants.map((v, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground"
                            >
                              {v}
                              <button
                                type="button"
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    variants: prev.variants.filter((_, idx) => idx !== i),
                                  }))
                                }
                                className="text-muted-foreground hover:text-sale"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Storefront Card Preview */}
                <div>
                  <div className="sticky top-2 rounded-xl border border-border bg-background p-4 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Live Store Preview
                    </h3>

                    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                      <div className="relative aspect-square w-full overflow-hidden bg-secondary/30">
                        {form.image ? (
                          <img
                            src={form.image}
                            alt={form.name || "Preview"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-10 w-10 opacity-40" />
                          </div>
                        )}

                        {discountPercent > 0 && (
                          <span className="absolute left-2.5 top-2.5 rounded-md bg-sale px-2 py-0.5 text-[11px] font-extrabold text-primary-foreground shadow">
                            {discountPercent}% OFF
                          </span>
                        )}

                        {form.bestSelling && (
                          <span className="absolute right-2.5 top-2.5 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
                            Best Seller
                          </span>
                        )}
                      </div>

                      <div className="p-3">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                          {form.brand || "Brand"}
                        </p>
                        <h4 className="mt-0.5 truncate text-sm font-bold text-foreground">
                          {form.name || "Product Title"}
                        </h4>

                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-foreground">
                            {formatTk(form.price)}
                          </span>
                          {form.oldPrice > form.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatTk(form.oldPrice)}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-semibold text-gold-deep">
                            <Star className="h-3 w-3 fill-gold text-gold" /> {form.rating} ({form.reviews})
                          </span>
                          <span
                            className={
                              form.stock <= 0
                                ? "font-bold text-sale"
                                : form.stock <= 5
                                ? "font-bold text-amber-500"
                                : "text-emerald-600 font-semibold"
                            }
                          >
                            {form.stock <= 0 ? "Out of Stock" : `${form.stock} in stock`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-[11px] text-muted-foreground">
                      <p className="font-semibold text-foreground">Real-Time Synchronization:</p>
                      <p className="mt-0.5">
                        Once saved, this product is immediately discoverable via search, categories, flash deals, and its own unique product link.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setStudioOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-5 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-gold-deep"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {editingProduct ? "Save Product Changes" : "Publish to Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
