import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart, useAuth } from "@/App";

const CartPage = () => {
  const { cart, updateCartItem, removeFromCart, cartTotal, cartItemCount } = useCart();
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleQuantityChange = async (item, delta) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      await updateCartItem(item.product_id, newQuantity, item.size, item.color);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      login();
    } else {
      navigate("/checkout");
    }
  };

  if (cartItemCount === 0) {
    return (
      <div className="min-h-screen bg-[#FFFCFA]">
        <Navbar />
        <div className="pt-24 pb-20 min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#FDF6F0] flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-[#BC9F8B]" />
            </div>
            <h1 className="font-serif text-2xl text-[#4A4A4A] mb-3">Your Cart is Empty</h1>
            <p className="text-[#7D7D7D] mb-6">Looks like you haven't added anything yet.</p>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2" data-testid="continue-shopping-btn">
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCFA]">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#4A4A4A] mb-8">
            Shopping Cart
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {cart.items?.map((item, index) => (
                  <motion.div
                    key={`${item.product_id}-${item.size}-${item.color}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6 bg-white p-4 rounded-xl border border-[#E5E0DC]"
                    data-testid={`cart-item-${item.product_id}`}
                  >
                    {/* Image */}
                    <Link to={`/product/${item.product_id}`} className="flex-shrink-0">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1596484552993-aec4311d3381?w=200"}
                        alt={item.name}
                        className="w-24 h-32 object-cover rounded-lg"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1">
                      <Link to={`/product/${item.product_id}`}>
                        <h3 className="font-medium text-[#4A4A4A] hover:text-[#BC9F8B] transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-[#7D7D7D]">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>• Color: {item.color}</span>}
                      </div>
                      <p className="font-semibold text-[#4A4A4A] mt-2 price-tag">
                        {formatPrice(item.price)}
                      </p>

                      {/* Quantity & Remove */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item, -1)}
                            className="quantity-btn"
                            data-testid={`decrease-${item.product_id}`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item, 1)}
                            className="quantity-btn"
                            data-testid={`increase-${item.product_id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product_id, item.size, item.color)}
                          className="text-[#7D7D7D] hover:text-[#E57373] transition-colors"
                          data-testid={`remove-${item.product_id}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Link
                to="/shop"
                className="mt-6 inline-flex items-center gap-2 text-[#BC9F8B] hover:text-[#A88B77] transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-[#FDF6F0] rounded-2xl p-6 sticky top-28">
                <h2 className="font-serif text-xl text-[#4A4A4A] mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-[#7D7D7D]">
                    <span>Subtotal ({cartItemCount} items)</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#7D7D7D]">
                    <span>Delivery</span>
                    <span className="text-[#8DA399]">Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t border-[#E5E0DC] pt-4 mb-6">
                  <div className="flex justify-between text-lg font-semibold text-[#4A4A4A]">
                    <span>Total</span>
                    <span className="price-tag">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full btn-primary"
                  data-testid="checkout-btn"
                >
                  {user ? "Proceed to Checkout" : "Sign in to Checkout"}
                </button>

                {/* Payment Methods */}
                <div className="mt-6 pt-6 border-t border-[#E5E0DC]">
                  <p className="text-xs text-[#7D7D7D] text-center mb-3">We Accept</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xs bg-white px-3 py-1 rounded border border-[#E5E0DC]">
                      M-Pesa
                    </span>
                    <span className="text-xs bg-white px-3 py-1 rounded border border-[#E5E0DC]">
                      Visa
                    </span>
                    <span className="text-xs bg-white px-3 py-1 rounded border border-[#E5E0DC]">
                      Mastercard
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;
