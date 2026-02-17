import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Package, Truck, MapPin, CheckCircle, Clock } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get("number") || "");
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setLoading(true);
    setError("");
    setTrackingResult(null);

    try {
      const response = await axios.get(`${API}/delivery/track/${trackingNumber}`);
      setTrackingResult(response.data);
    } catch (err) {
      setError("Unable to find tracking information. Please check the tracking number.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = {
      pending: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
    };
    return steps[status] || 1;
  };

  return (
    <div className="min-h-screen bg-[#FFFCFA]">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6 md:px-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#FDF6F0] flex items-center justify-center">
              <Package className="w-8 h-8 text-[#BC9F8B]" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#4A4A4A] mb-3">
              Track Your Order
            </h1>
            <p className="text-[#7D7D7D]">
              Enter your tracking number to see your order status
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleTrack} className="mb-12">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7D7D7D]" />
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number or order ID"
                  className="input-base pl-12 h-14"
                  data-testid="tracking-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary h-14"
                data-testid="track-btn"
              >
                {loading ? "Tracking..." : "Track"}
              </button>
            </div>
            {error && (
              <p className="text-[#E57373] text-sm mt-2">{error}</p>
            )}
          </form>

          {/* Tracking Result */}
          {trackingResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-[#E5E0DC]"
            >
              {/* Order Info */}
              <div className="mb-8 pb-6 border-b border-[#E5E0DC]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#7D7D7D]">Tracking Number</p>
                    <p className="font-medium text-[#4A4A4A]">{trackingResult.tracking_number || trackingResult.order_id}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    trackingResult.status === "delivered" 
                      ? "bg-[#8DA399]/20 text-[#8DA399]"
                      : trackingResult.status === "shipped"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-[#FDF6F0] text-[#BC9F8B]"
                  }`}>
                    {trackingResult.status?.charAt(0).toUpperCase() + trackingResult.status?.slice(1)}
                  </span>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-0">
                {[
                  { step: 1, label: "Order Placed", icon: Package, desc: "Your order has been confirmed" },
                  { step: 2, label: "Processing", icon: Clock, desc: "Your order is being prepared" },
                  { step: 3, label: "Shipped", icon: Truck, desc: "Your order is on the way" },
                  { step: 4, label: "Delivered", icon: CheckCircle, desc: "Order delivered successfully" },
                ].map((item, index) => {
                  const currentStep = getStatusStep(trackingResult.status);
                  const isCompleted = item.step <= currentStep;
                  const isCurrent = item.step === currentStep;

                  return (
                    <div key={item.step} className="checkout-step">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-[#BC9F8B] text-white"
                            : "bg-[#FDF6F0] text-[#7D7D7D]"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 pb-8">
                        <p className={`font-medium ${isCompleted ? "text-[#4A4A4A]" : "text-[#7D7D7D]"}`}>
                          {item.label}
                        </p>
                        <p className="text-sm text-[#7D7D7D]">{item.desc}</p>
                        {isCurrent && trackingResult.updated_at && (
                          <p className="text-xs text-[#BC9F8B] mt-1">
                            {new Date(trackingResult.updated_at).toLocaleDateString("en-KE", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Method */}
              {trackingResult.delivery_method && (
                <div className="mt-6 pt-6 border-t border-[#E5E0DC]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FCDA45]/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#4A4A4A]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#4A4A4A]">
                        {trackingResult.delivery_method === "pickup_mtaani"
                          ? "Pick Up Mtaani"
                          : "Doorstep Delivery"}
                      </p>
                      <p className="text-sm text-[#7D7D7D]">
                        {trackingResult.delivery_method === "pickup_mtaani"
                          ? "Collect from your selected pickup point"
                          : "Will be delivered to your address"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Help Section */}
          {!trackingResult && !loading && (
            <div className="bg-[#FDF6F0] rounded-2xl p-6 text-center">
              <h3 className="font-medium text-[#4A4A4A] mb-2">Need Help?</h3>
              <p className="text-sm text-[#7D7D7D] mb-4">
                Can't find your tracking number? Check your order confirmation email or contact our support.
              </p>
              <p className="text-sm text-[#BC9F8B]">
                Email: hello@jojosboutick.com
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TrackOrderPage;
