import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Truck, CreditCard, Phone, ChevronRight, CheckCircle } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart, useAuth } from "@/App";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, cartTotal, fetchCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pickupAgents, setPickupAgents] = useState([]);
  const [orderId, setOrderId] = useState(searchParams.get("order_id") || null);
  
  // Form State
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("pickup_mtaani");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");

  const deliveryFee = deliveryMethod === "pickup_mtaani" ? 200 : 350;
  const total = cartTotal + deliveryFee;

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get(`${API}/delivery/pickup-mtaani/agents`);
        setPickupAgents(response.data.agents);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };
    fetchAgents();
  }, []);

  useEffect(() => {
    if (user?.name && !customerName) {
      setCustomerName(user.name);
    }
  }, [user]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const validateStep1 = () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!customerPhone.match(/^254\d{9}$/)) {
      toast.error("Phone number must be in format 254XXXXXXXXX");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (deliveryMethod === "pickup_mtaani" && !selectedAgent) {
      toast.error("Please select a pickup location");
      return false;
    }
    if (deliveryMethod === "doorstep" && !address.trim()) {
      toast.error("Please enter your delivery address");
      return false;
    }
    return true;
  };

  const handleCreateOrder = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/orders`,
        {
          delivery_method: deliveryMethod,
          delivery_address: deliveryMethod === "doorstep" ? { address } : null,
          pickup_agent_id: selectedAgent?.agent_id,
          customer_phone: customerPhone,
          customer_name: customerName,
          notes,
        },
        { withCredentials: true }
      );
      setOrderId(response.data.order_id);
      setStep(3);
    } catch (error) {
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(
        `${API}/payments/stripe/checkout?order_id=${orderId}&origin_url=${encodeURIComponent(originUrl)}`,
        {},
        { withCredentials: true }
      );
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error("Failed to initiate payment");
      setLoading(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!mpesaPhone.match(/^254\d{9}$/)) {
      toast.error("M-Pesa phone must be in format 254XXXXXXXXX");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/payments/mpesa/stk-push?order_id=${orderId}&phone_number=${mpesaPhone}`,
        {},
        { withCredentials: true }
      );
      toast.success(response.data.message || "Check your phone for M-Pesa prompt");
      
      // Poll for payment status
      let attempts = 0;
      const checkInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await axios.get(
            `${API}/payments/mpesa/status/${response.data.checkout_request_id}`,
            { withCredentials: true }
          );
          if (statusRes.data.status === "paid") {
            clearInterval(checkInterval);
            fetchCart();
            navigate(`/order-confirmation?order_id=${orderId}`);
          } else if (statusRes.data.status === "failed" || attempts > 30) {
            clearInterval(checkInterval);
            toast.error("Payment not completed. Please try again.");
            setLoading(false);
          }
        } catch (e) {
          // Continue polling
        }
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to initiate M-Pesa payment");
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === "stripe") {
      handleStripePayment();
    } else {
      handleMpesaPayment();
    }
  };

  if (cart.items?.length === 0 && !orderId) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFFCFA]">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#4A4A4A] mb-8">
            Checkout
          </h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-12">
            {[
              { num: 1, label: "Details" },
              { num: 2, label: "Delivery" },
              { num: 3, label: "Payment" },
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      step >= s.num
                        ? "bg-[#BC9F8B] text-white"
                        : "bg-[#FDF6F0] text-[#7D7D7D]"
                    }`}
                  >
                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`hidden sm:block ${step >= s.num ? "text-[#4A4A4A]" : "text-[#7D7D7D]"}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${step > s.num ? "bg-[#BC9F8B]" : "bg-[#E5E0DC]"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              {/* Step 1: Contact Details */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-6 border border-[#E5E0DC]"
                >
                  <h2 className="font-serif text-xl text-[#4A4A4A] mb-6 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-[#BC9F8B]" />
                    Contact Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="input-base mt-1"
                        placeholder="Enter your full name"
                        data-testid="checkout-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="input-base mt-1"
                        placeholder="254XXXXXXXXX"
                        data-testid="checkout-phone"
                      />
                      <p className="text-xs text-[#7D7D7D] mt-1">Format: 254XXXXXXXXX (e.g., 254712345678)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => validateStep1() && setStep(2)}
                    className="btn-primary mt-6 w-full flex items-center justify-center gap-2"
                    data-testid="continue-to-delivery"
                  >
                    Continue to Delivery
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Delivery */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Delivery Method Selection */}
                  <div className="bg-white rounded-2xl p-6 border border-[#E5E0DC]">
                    <h2 className="font-serif text-xl text-[#4A4A4A] mb-6 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#BC9F8B]" />
                      Delivery Method
                    </h2>
                    <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                      <div
                        className={`delivery-card p-4 rounded-xl cursor-pointer ${
                          deliveryMethod === "pickup_mtaani" ? "selected" : ""
                        }`}
                        onClick={() => setDeliveryMethod("pickup_mtaani")}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="pickup_mtaani" id="pickup" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="pickup" className="font-medium cursor-pointer">
                                Pick Up Mtaani
                              </Label>
                              <span className="w-2 h-2 rounded-full bg-[#FCDA45]"></span>
                            </div>
                            <p className="text-sm text-[#7D7D7D] mt-1">
                              Collect from a pickup point near you
                            </p>
                            <p className="text-sm font-medium text-[#BC9F8B] mt-1">
                              {formatPrice(200)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`delivery-card p-4 rounded-xl cursor-pointer mt-3 ${
                          deliveryMethod === "doorstep" ? "selected" : ""
                        }`}
                        onClick={() => setDeliveryMethod("doorstep")}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="doorstep" id="doorstep" />
                          <div className="flex-1">
                            <Label htmlFor="doorstep" className="font-medium cursor-pointer">
                              Doorstep Delivery
                            </Label>
                            <p className="text-sm text-[#7D7D7D] mt-1">
                              Delivered to your address
                            </p>
                            <p className="text-sm font-medium text-[#BC9F8B] mt-1">
                              {formatPrice(350)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Pickup Location or Address */}
                  {deliveryMethod === "pickup_mtaani" ? (
                    <div className="bg-white rounded-2xl p-6 border border-[#E5E0DC]">
                      <h3 className="font-medium text-[#4A4A4A] mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#BC9F8B]" />
                        Select Pickup Location
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {pickupAgents.map((agent) => (
                          <div
                            key={agent.agent_id}
                            onClick={() => setSelectedAgent(agent)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              selectedAgent?.agent_id === agent.agent_id
                                ? "border-[#BC9F8B] bg-[#FDF6F0]"
                                : "border-[#E5E0DC] hover:border-[#BC9F8B]"
                            }`}
                            data-testid={`agent-${agent.agent_id}`}
                          >
                            <p className="font-medium text-[#4A4A4A]">{agent.name}</p>
                            <p className="text-sm text-[#7D7D7D]">{agent.location}</p>
                            <p className="text-xs text-[#BC9F8B]">{agent.area}, {agent.zone}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 border border-[#E5E0DC]">
                      <h3 className="font-medium text-[#4A4A4A] mb-4">Delivery Address</h3>
                      <Textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your full address..."
                        className="input-base"
                        rows={3}
                        data-testid="delivery-address"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div className="bg-white rounded-2xl p-6 border border-[#E5E0DC]">
                    <h3 className="font-medium text-[#4A4A4A] mb-4">Order Notes (Optional)</h3>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special instructions..."
                      className="input-base"
                      rows={2}
                      data-testid="order-notes"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="btn-outline"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateOrder}
                      disabled={loading}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                      data-testid="continue-to-payment"
                    >
                      {loading ? "Processing..." : "Continue to Payment"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-6 border border-[#E5E0DC]"
                >
                  <h2 className="font-serif text-xl text-[#4A4A4A] mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#BC9F8B]" />
                    Payment Method
                  </h2>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div
                      className={`delivery-card p-4 rounded-xl cursor-pointer ${
                        paymentMethod === "mpesa" ? "selected" : ""
                      }`}
                      onClick={() => setPaymentMethod("mpesa")}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="mpesa" id="mpesa" />
                        <div>
                          <Label htmlFor="mpesa" className="font-medium cursor-pointer mpesa-green">
                            M-Pesa
                          </Label>
                          <p className="text-sm text-[#7D7D7D]">Pay with M-Pesa mobile money</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`delivery-card p-4 rounded-xl cursor-pointer mt-3 ${
                        paymentMethod === "stripe" ? "selected" : ""
                      }`}
                      onClick={() => setPaymentMethod("stripe")}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="stripe" id="stripe" />
                        <div>
                          <Label htmlFor="stripe" className="font-medium cursor-pointer">
                            Credit/Debit Card
                          </Label>
                          <p className="text-sm text-[#7D7D7D]">Visa, Mastercard, AMEX</p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "mpesa" && (
                    <div className="mt-6">
                      <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
                      <Input
                        id="mpesa-phone"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="input-base mt-1"
                        placeholder="254XXXXXXXXX"
                        data-testid="mpesa-phone"
                      />
                      <p className="text-xs text-[#7D7D7D] mt-1">
                        You'll receive an STK push on this number
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="btn-primary mt-6 w-full"
                    data-testid="pay-now-btn"
                  >
                    {loading ? "Processing..." : `Pay ${formatPrice(total)}`}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-[#FDF6F0] rounded-2xl p-6 sticky top-28">
                <h2 className="font-serif text-xl text-[#4A4A4A] mb-6">Order Summary</h2>

                {/* Items */}
                <div className="space-y-4 mb-6 max-h-48 overflow-y-auto">
                  {cart.items?.map((item) => (
                    <div key={`${item.product_id}-${item.size}`} className="flex gap-3">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1596484552993-aec4311d3381?w=100"}
                        alt={item.name}
                        className="w-16 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#4A4A4A] line-clamp-1">{item.name}</p>
                        <p className="text-xs text-[#7D7D7D]">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-[#4A4A4A]">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-[#E5E0DC] pt-4 mb-4">
                  <div className="flex justify-between text-sm text-[#7D7D7D]">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#7D7D7D]">
                    <span>Delivery</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                </div>

                <div className="border-t border-[#E5E0DC] pt-4">
                  <div className="flex justify-between font-semibold text-[#4A4A4A]">
                    <span>Total</span>
                    <span className="price-tag">{formatPrice(total)}</span>
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

export default CheckoutPage;
