import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, Share2, ChevronLeft, Star, Truck, Shield } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart, useAuth } from "@/App";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductPage = () => {
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { user, login } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/products/${productId}`);
        setProduct(response.data);
        if (response.data.sizes?.length > 0) {
          setSelectedSize(response.data.sizes[0]);
        }
        if (response.data.colors?.length > 0) {
          setSelectedColor(response.data.colors[0]);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    const success = await addToCart(product.product_id, quantity, selectedSize, selectedColor);
    if (success) {
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error("Failed to add to cart");
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      login();
      return;
    }
    if (!reviewText.trim()) {
      toast.error("Please write a review");
      return;
    }

    setSubmittingReview(true);
    try {
      await axios.post(
        `${API}/reviews`,
        {
          product_id: productId,
          rating: reviewRating,
          comment: reviewText,
        },
        { withCredentials: true }
      );
      toast.success("Review submitted successfully");
      setReviewText("");
      // Refresh product to get new review
      const response = await axios.get(`${API}/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const averageRating = product?.reviews?.length
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCFA]">
        <Navbar />
        <div className="pt-24 pb-20 max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-[3/4] bg-[#FDF6F0] rounded-xl animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-8 bg-[#FDF6F0] rounded w-3/4"></div>
              <div className="h-6 bg-[#FDF6F0] rounded w-1/4"></div>
              <div className="h-32 bg-[#FDF6F0] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FFFCFA]">
        <Navbar />
        <div className="pt-24 pb-20 text-center">
          <h1 className="text-2xl font-serif text-[#4A4A4A]">Product not found</h1>
          <Link to="/shop" className="btn-primary mt-4 inline-block">
            Back to Shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length > 0 
    ? product.images 
    : ["https://images.unsplash.com/photo-1596484552993-aec4311d3381?w=800"];

  return (
    <div className="min-h-screen bg-[#FFFCFA]">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-[#7D7D7D] hover:text-[#BC9F8B] transition-colors"
              data-testid="back-to-shop"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Shop
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images */}
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-[3/4] bg-[#FDF6F0] rounded-2xl overflow-hidden mb-4"
              >
                <img
                  src={images[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              {images.length > 1 && (
                <div className="flex gap-3">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIndex === index
                          ? "border-[#BC9F8B]"
                          : "border-transparent hover:border-[#E5E0DC]"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <p className="text-sm tracking-widest uppercase text-[#BC9F8B] mb-2">
                {product.category?.replace("_", " ")}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#4A4A4A] mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(averageRating)
                          ? "fill-[#FCDA45] text-[#FCDA45]"
                          : "text-[#E5E0DC]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#7D7D7D]">
                  {averageRating} ({product.reviews?.length || 0} reviews)
                </span>
              </div>

              <p className="text-3xl font-semibold text-[#4A4A4A] mb-6 price-tag">
                {formatPrice(product.price)}
              </p>

              <p className="text-[#7D7D7D] leading-relaxed mb-8">{product.description}</p>

              {/* Size Selector */}
              {product.sizes?.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-[#4A4A4A] mb-3">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`size-btn ${selectedSize === size ? "selected" : ""}`}
                        data-testid={`size-${size}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors?.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-[#4A4A4A] mb-3">
                    Color: <span className="text-[#7D7D7D]">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`color-swatch ${selectedColor === color ? "selected" : ""}`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                        data-testid={`color-${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <p className="text-sm font-medium text-[#4A4A4A] mb-3">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn"
                    data-testid="decrease-qty"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="quantity-btn"
                    data-testid="increase-qty"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                  data-testid="add-to-cart-btn"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
                <button className="w-12 h-12 rounded-full border border-[#E5E0DC] flex items-center justify-center hover:border-[#BC9F8B] transition-colors">
                  <Heart className="w-5 h-5 text-[#7D7D7D]" />
                </button>
              </div>

              {/* Stock Info */}
              {product.stock > 0 && product.stock <= 10 && (
                <p className="text-[#E57373] text-sm mb-4">
                  Only {product.stock} left in stock!
                </p>
              )}

              {/* Features */}
              <div className="border-t border-[#E5E0DC] pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-[#7D7D7D]">
                  <Truck className="w-5 h-5 text-[#BC9F8B]" />
                  <span>Free delivery via Pick Up Mtaani</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#7D7D7D]">
                  <Shield className="w-5 h-5 text-[#BC9F8B]" />
                  <span>Secure checkout with M-Pesa & Card</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-16">
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList className="w-full justify-start border-b border-[#E5E0DC] bg-transparent">
                <TabsTrigger value="reviews" className="data-[state=active]:text-[#BC9F8B] data-[state=active]:border-b-2 data-[state=active]:border-[#BC9F8B]">
                  Reviews ({product.reviews?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="mt-6">
                {/* Write Review */}
                <div className="bg-[#FDF6F0] rounded-xl p-6 mb-8">
                  <h3 className="font-medium text-[#4A4A4A] mb-4">Write a Review</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-[#7D7D7D]">Rating:</span>
                    {[...Array(5)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setReviewRating(i + 1)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            i < reviewRating
                              ? "fill-[#FCDA45] text-[#FCDA45]"
                              : "text-[#E5E0DC]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="mb-4 input-base"
                    rows={4}
                    data-testid="review-textarea"
                  />
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="btn-primary"
                    data-testid="submit-review-btn"
                  >
                    {submittingReview ? "Submitting..." : user ? "Submit Review" : "Sign in to Review"}
                  </Button>
                </div>

                {/* Reviews List */}
                {product.reviews?.length > 0 ? (
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review.review_id} className="border-b border-[#E5E0DC] pb-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-[#4A4A4A]">{review.user_name}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-[#FCDA45] text-[#FCDA45]"
                                    : "text-[#E5E0DC]"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-[#7D7D7D]">{review.comment}</p>
                        <p className="text-xs text-[#7D7D7D] mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#7D7D7D] text-center py-8">
                    No reviews yet. Be the first to review this product!
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductPage;
