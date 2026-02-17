import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Shield, RefreshCw } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/products?featured=true&limit=8`),
          axios.get(`${API}/categories`),
        ]);
        setFeaturedProducts(productsRes.data.products);
        setCategories(categoriesRes.data.categories);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: { staggerChildren: 0.1 }
    }
  };

  // Category images from design guidelines
  const categoryImages = {
    dresses: "https://images.unsplash.com/photo-1596484552993-aec4311d3381?w=600&h=800&fit=crop",
    skirts: "https://images.unsplash.com/photo-1728507523256-47e4caeed925?w=600&h=800&fit=crop",
    coats: "https://images.unsplash.com/photo-1673105793839-6c2811a4e1e7?w=600&h=800&fit=crop",
    "2_piece": "https://images.unsplash.com/photo-1768221677363-55e754eb6021?w=600&h=800&fit=crop",
    sunglasses: "https://images.unsplash.com/photo-1620743364130-8a1669f00b64?w=600&h=800&fit=crop",
  };

  return (
    <div className="min-h-screen bg-[#FFFCFA]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center hero-pattern pt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Text Content */}
            <motion.div 
              className="md:col-span-6 lg:col-span-5"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-sm tracking-widest uppercase text-[#BC9F8B] mb-4">
                New Collection 2025
              </p>
              <h1 className="font-serif text-4xl md:text-6xl font-semibold text-[#4A4A4A] tracking-tight leading-tight mb-6">
                Elegance <br />with <span className="text-[#BC9F8B]">Edge</span>
              </h1>
              <p className="text-lg text-[#7D7D7D] leading-relaxed mb-8 max-w-md">
                Discover curated fashion pieces that blend sophistication with modern Kenyan style. 
                Every piece tells a story of elegance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/shop" 
                  className="btn-primary inline-flex items-center justify-center gap-2"
                  data-testid="shop-now-btn"
                >
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  to="/shop/dresses" 
                  className="btn-outline inline-flex items-center justify-center"
                  data-testid="view-dresses-btn"
                >
                  View Dresses
                </Link>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div 
              className="md:col-span-6 lg:col-span-7"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-[#FDF6F0] rounded-3xl -z-10"></div>
                <img
                  src="https://images.unsplash.com/photo-1763551229890-64e97d845251?w=800&h=1000&fit=crop"
                  alt="Elegant African woman in dress"
                  className="w-full h-[500px] md:h-[600px] object-cover rounded-2xl shadow-xl"
                />
                {/* Floating Badge */}
                <motion.div 
                  className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <p className="text-sm text-[#7D7D7D]">Trusted by</p>
                  <p className="text-2xl font-serif font-semibold text-[#4A4A4A]">500+</p>
                  <p className="text-sm text-[#BC9F8B]">Happy Customers</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-[#FDF6F0] py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Truck className="w-5 h-5 text-[#BC9F8B]" />
              </div>
              <div>
                <p className="font-medium text-[#4A4A4A]">Pick Up Mtaani</p>
                <p className="text-sm text-[#7D7D7D]">Convenient delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#BC9F8B]" />
              </div>
              <div>
                <p className="font-medium text-[#4A4A4A]">Secure Payments</p>
                <p className="text-sm text-[#7D7D7D]">M-Pesa & Card</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-end">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-[#BC9F8B]" />
              </div>
              <div>
                <p className="font-medium text-[#4A4A4A]">Easy Returns</p>
                <p className="text-sm text-[#7D7D7D]">7-day policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <motion.div 
            className="text-center mb-12"
            {...fadeInUp}
          >
            <p className="text-sm tracking-widest uppercase text-[#BC9F8B] mb-3">Browse</p>
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#4A4A4A] tracking-tight">
              Shop by Category
            </h2>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                variants={fadeInUp}
              >
                <Link
                  to={`/shop/${category.id}`}
                  className="group relative block overflow-hidden rounded-xl aspect-[3/4]"
                  data-testid={`category-${category.id}`}
                >
                  <img
                    src={categoryImages[category.id] || category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 category-overlay"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-serif text-lg text-white font-medium">{category.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 md:py-32 bg-[#FDF6F0]/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <motion.div 
            className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4"
            {...fadeInUp}
          >
            <div>
              <p className="text-sm tracking-widest uppercase text-[#BC9F8B] mb-3">Curated</p>
              <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#4A4A4A] tracking-tight">
                Featured Pieces
              </h2>
            </div>
            <Link 
              to="/shop" 
              className="text-[#BC9F8B] hover:text-[#A88B77] inline-flex items-center gap-2 transition-colors"
              data-testid="view-all-link"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-[#FDF6F0] rounded-xl mb-4"></div>
                  <div className="h-4 bg-[#FDF6F0] rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-[#FDF6F0] rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {featuredProducts.map((product) => (
                <motion.div key={product.product_id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#7D7D7D]">No featured products yet. Check back soon!</p>
              <Link to="/shop" className="btn-primary mt-4 inline-block">
                Browse All Products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Delivery Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src="https://images.unsplash.com/photo-1758874089961-e52549c294c3?w=600&h=500&fit=crop"
                alt="Happy woman receiving package"
                className="w-full h-[400px] object-cover rounded-2xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 bg-[#FCDA45]/20 px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-[#FCDA45]"></span>
                <span className="text-sm font-medium">Pick Up Mtaani Partner</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#4A4A4A] tracking-tight mb-6">
                Convenient Delivery Across Kenya
              </h2>
              <p className="text-lg text-[#7D7D7D] leading-relaxed mb-6">
                We've partnered with Pick Up Mtaani to bring you convenient, affordable delivery 
                to pickup points across Kenya. Track your package in real-time and collect at your convenience.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-[#4A4A4A]">
                  <span className="w-6 h-6 rounded-full bg-[#8DA399] flex items-center justify-center text-white text-xs">✓</span>
                  Affordable rates starting from KES 200
                </li>
                <li className="flex items-center gap-3 text-[#4A4A4A]">
                  <span className="w-6 h-6 rounded-full bg-[#8DA399] flex items-center justify-center text-white text-xs">✓</span>
                  100+ pickup locations in Nairobi
                </li>
                <li className="flex items-center gap-3 text-[#4A4A4A]">
                  <span className="w-6 h-6 rounded-full bg-[#8DA399] flex items-center justify-center text-white text-xs">✓</span>
                  Real-time tracking updates
                </li>
              </ul>
              <Link to="/track" className="btn-primary inline-flex items-center gap-2" data-testid="track-order-btn">
                Track Your Order
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#4A4A4A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">
              Ready to Elevate Your Style?
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
              Join hundreds of fashion-forward women who trust Jojos Boutick for their wardrobe essentials.
            </p>
            <Link to="/shop" className="btn-primary bg-[#BC9F8B] inline-block" data-testid="start-shopping-btn">
              Start Shopping
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
