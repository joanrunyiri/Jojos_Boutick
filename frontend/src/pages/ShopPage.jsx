import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ShopPage = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const selectedCategory = category || searchParams.get("category") || "";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API}/categories`);
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append("category", selectedCategory);
        if (search) params.append("search", search);
        if (priceRange[0] > 0) params.append("min_price", priceRange[0]);
        if (priceRange[1] < 50000) params.append("max_price", priceRange[1]);

        const response = await axios.get(`${API}/products?${params.toString()}`);
        let sortedProducts = [...response.data.products];

        // Client-side sorting
        switch (sortBy) {
          case "price_low":
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
          case "price_high":
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
          case "name":
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
          default:
            // newest - keep original order
            break;
        }

        setProducts(sortedProducts);
        setTotal(response.data.total);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, search, priceRange, sortBy]);

  const handleCategoryChange = (cat) => {
    if (cat === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  const clearFilters = () => {
    setSearchParams({});
    setPriceRange([0, 50000]);
    setSortBy("newest");
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.name || id?.replace("_", " ");
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-medium text-[#4A4A4A] mb-4">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryChange("all")}
            className={`block w-full text-left py-2 px-3 rounded-lg transition-colors ${
              !selectedCategory
                ? "bg-[#BC9F8B] text-white"
                : "text-[#4A4A4A] hover:bg-[#FDF6F0]"
            }`}
            data-testid="filter-all"
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`block w-full text-left py-2 px-3 rounded-lg transition-colors ${
                selectedCategory === cat.id
                  ? "bg-[#BC9F8B] text-white"
                  : "text-[#4A4A4A] hover:bg-[#FDF6F0]"
              }`}
              data-testid={`filter-${cat.id}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-medium text-[#4A4A4A] mb-4">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={50000}
          step={500}
          className="mb-4"
        />
        <div className="flex items-center justify-between text-sm text-[#7D7D7D]">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={clearFilters}
        className="w-full btn-outline text-sm"
        data-testid="clear-filters-btn"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFCFA]">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm tracking-widest uppercase text-[#BC9F8B] mb-2">Shop</p>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#4A4A4A] tracking-tight">
              {selectedCategory ? getCategoryName(selectedCategory) : "All Products"}
            </h1>
            <p className="text-[#7D7D7D] mt-2">{total} products</p>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28">
                <FilterContent />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E5E0DC]">
                {/* Mobile Filter Button */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <button className="lg:hidden flex items-center gap-2 text-[#4A4A4A]" data-testid="mobile-filters-btn">
                      <SlidersHorizontal className="w-5 h-5" />
                      Filters
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Active Filters */}
                <div className="hidden lg:flex items-center gap-2">
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1 bg-[#FDF6F0] px-3 py-1 rounded-full text-sm">
                      {getCategoryName(selectedCategory)}
                      <button onClick={() => handleCategoryChange("all")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]" data-testid="sort-select">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name: A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] bg-[#FDF6F0] rounded-xl mb-4"></div>
                      <div className="h-4 bg-[#FDF6F0] rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-[#FDF6F0] rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {products.map((product) => (
                    <ProductCard key={product.product_id} product={product} />
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-[#7D7D7D] mb-4">No products found matching your criteria.</p>
                  <button onClick={clearFilters} className="btn-primary">
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ShopPage;
