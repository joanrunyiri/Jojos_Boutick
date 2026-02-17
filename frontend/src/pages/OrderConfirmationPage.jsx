import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Package, Truck, ArrowRight } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/App";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrderConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderIdParam = searchParams.get("order_id");
  const { fetchCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentChecked, setPaymentChecked] = useState(false);

  useEffect(() => {
    const checkPaymentAndFetchOrder = async () => {
      try {
        // If coming from Stripe, check payment status first
        if (sessionId && !paymentChecked) {
          let attempts = 0;
          while (attempts < 5) {
            try {
              const statusRes = await axios.get(
                `${API}/payments/stripe/status/${sessionId}`,
                { withCredentials: true }
              );
              if (statusRes.data.payment_status === "paid") {
                setPaymentChecked(true);
                fetchCart(); // Clear cart
                break;
              }
            } catch (e) {
              // Continue
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
            attempts++;
          }
        }

        // Fetch user's orders and get the latest one
        const ordersRes = await axios.get(`${API}/orders`, { withCredentials: true });
        if (ordersRes.data.orders?.length > 0) {
          const latestOrder = ordersRes.data.orders[0];
          setOrder(latestOrder);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentAndFetchOrder();
  }, [sessionId]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCFA]">
        <Navbar />
        <div className="pt-24 pb-20 min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-[#7D7D7D]">Confirming your order...</p>
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
        <div className="max-w-2xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#8DA399]/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[#8DA399]" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#4A4A4A] mb-3">
              Order Confirmed!
            </h1>
            <p className="text-[#7D7D7D]">
              Thank you for shopping with Jojos Boutick
            </p>
          </motion.div>

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-[#E5E0DC] mb-8"
            >
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E5E0DC]">
                <div>
                  <p className="text-sm text-[#7D7D7D]">Order Number</p>
                  <p className="font-medium text-[#4A4A4A]">{order.order_id}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  order.payment_status === "paid" 
                    ? "bg-[#8DA399]/20 text-[#8DA399]" 
                    : "bg-[#FCDA45]/20 text-[#4A4A4A]"
                }`}>
                  {order.payment_status === "paid" ? "Paid" : "Payment Pending"}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1596484552993-aec4311d3381?w=100"}
                      alt={item.name}
                      className="w-16 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#4A4A4A]">{item.name}</p>
                      <p className="text-sm text-[#7D7D7D]">
                        Qty: {item.quantity}
                        {item.size && ` • Size: ${item.size}`}
                        {item.color && ` • ${item.color}`}
                      </p>
                      <p className="font-medium text-[#4A4A4A] mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="space-y-2 pt-4 border-t border-[#E5E0DC]">
                <div className="flex justify-between text-sm text-[#7D7D7D]">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#7D7D7D]">
                  <span>Delivery</span>
                  <span>{formatPrice(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#4A4A4A] pt-2">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Delivery Info */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#FDF6F0] rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  {order.delivery_method === "pickup_mtaani" ? (
                    <Package className="w-5 h-5 text-[#BC9F8B]" />
                  ) : (
                    <Truck className="w-5 h-5 text-[#BC9F8B]" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[#4A4A4A]">
                    {order.delivery_method === "pickup_mtaani" 
                      ? "Pick Up Mtaani Delivery" 
                      : "Doorstep Delivery"}
                  </p>
                  <p className="text-sm text-[#7D7D7D] mt-1">
                    {order.delivery_method === "pickup_mtaani"
                      ? "You'll receive SMS updates when your package is ready for pickup."
                      : "Your order will be delivered to your address."}
                  </p>
                  {order.tracking_number && (
                    <p className="text-sm text-[#BC9F8B] mt-2">
                      Tracking: {order.tracking_number}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/orders"
              className="btn-primary inline-flex items-center justify-center gap-2"
              data-testid="view-orders-btn"
            >
              View My Orders
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/shop"
              className="btn-outline inline-flex items-center justify-center"
              data-testid="continue-shopping-btn"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderConfirmationPage;
