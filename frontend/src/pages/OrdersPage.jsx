import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API}/orders`, { withCredentials: true });
        setOrders(response.data.orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "processing":
        return <Package className="w-5 h-5" />;
      case "shipped":
        return <Truck className="w-5 h-5" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5" />;
      case "cancelled":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "processing":
        return "status-processing";
      case "shipped":
        return "status-shipped";
      case "delivered":
        return "status-delivered";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCFA]">
        <Navbar />
        <div className="pt-24 pb-20 min-h-[70vh] flex items-center justify-center">
          <div className="spinner"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCFA]">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#4A4A4A] mb-8">
            My Orders
          </h1>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FDF6F0] flex items-center justify-center">
                <Package className="w-10 h-10 text-[#BC9F8B]" />
              </div>
              <h2 className="font-serif text-xl text-[#4A4A4A] mb-3">No orders yet</h2>
              <p className="text-[#7D7D7D] mb-6">Start shopping to see your orders here.</p>
              <Link to="/shop" className="btn-primary inline-block" data-testid="start-shopping-link">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order, index) => (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-[#E5E0DC]"
                  data-testid={`order-${order.order_id}`}
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#E5E0DC]">
                    <div>
                      <p className="text-sm text-[#7D7D7D]">Order ID</p>
                      <p className="font-medium text-[#4A4A4A]">{order.order_id}</p>
                      <p className="text-xs text-[#7D7D7D] mt-1">
                        {new Date(order.created_at).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusClass(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                    {order.items?.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex-shrink-0">
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1596484552993-aec4311d3381?w=100"}
                          alt={item.name}
                          className="w-16 h-20 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <div className="w-16 h-20 rounded-lg bg-[#FDF6F0] flex items-center justify-center text-[#7D7D7D] text-sm flex-shrink-0">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xs text-[#7D7D7D]">Items</p>
                        <p className="font-medium text-[#4A4A4A]">
                          {order.items?.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#7D7D7D]">Total</p>
                        <p className="font-medium text-[#4A4A4A] price-tag">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#7D7D7D]">Payment</p>
                        <p className={`font-medium ${
                          order.payment_status === "paid" ? "text-[#8DA399]" : "text-[#FCDA45]"
                        }`}>
                          {order.payment_status === "paid" ? "Paid" : "Pending"}
                        </p>
                      </div>
                    </div>

                    {order.tracking_number && (
                      <Link
                        to={`/track?number=${order.tracking_number}`}
                        className="inline-flex items-center gap-2 text-[#BC9F8B] hover:text-[#A88B77] transition-colors text-sm"
                      >
                        Track Order
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrdersPage;
