import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/App";
import { toast } from "sonner";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await addToCart(product.product_id, 1);
    if (success) {
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error("Failed to add to cart");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link
      to={`/product/${product.product_id}`}
      className="group block card-product"
      data-testid={`product-card-${product.product_id}`}
    >
      {/* Image Container */}
      <div className="relative product-image-container aspect-[3/4] bg-[#FDF6F0] rounded-xl overflow-hidden">
        <img
          src={product.images?.[0] || "https://images.unsplash.com/photo-1596484552993-aec4311d3381?w=400&h=500&fit=crop"}
          alt={product.name}
          className="product-image w-full h-full object-cover"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_featured && (
            <span className="bg-[#8DA399] text-white text-xs px-3 py-1 rounded-full">
              Featured
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="bg-[#E57373] text-white text-xs px-3 py-1 rounded-full">
              Low Stock
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-[#7D7D7D] text-white text-xs px-3 py-1 rounded-full">
              Sold Out
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="add-to-cart-btn absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm text-[#4A4A4A] py-3 rounded-full flex items-center justify-center gap-2 hover:bg-[#BC9F8B] hover:text-white transition-all shadow-lg"
          disabled={product.stock === 0}
          data-testid={`add-to-cart-${product.product_id}`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-sm font-medium tracking-wide">
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </span>
        </button>
      </div>

      {/* Product Info */}
      <div className="pt-4 px-1">
        <p className="text-xs text-[#BC9F8B] uppercase tracking-wider mb-1">
          {product.category?.replace("_", " ")}
        </p>
        <h3 className="font-medium text-[#4A4A4A] group-hover:text-[#BC9F8B] transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-[#4A4A4A] font-semibold mt-1 price-tag">
          {formatPrice(product.price)}
        </p>
        
        {/* Colors */}
        {product.colors?.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {product.colors.slice(0, 4).map((color, index) => (
              <span
                key={index}
                className="w-4 h-4 rounded-full border border-[#E5E0DC]"
                style={{ backgroundColor: color.toLowerCase() }}
                title={color}
              ></span>
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-[#7D7D7D]">+{product.colors.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
