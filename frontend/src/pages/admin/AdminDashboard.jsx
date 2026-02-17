import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle,
  Menu,
  X,
  LogOut,
  Home,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "@/App";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/admin/stats`, { withCredentials: true });
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: stats ? formatPrice(stats.total_revenue) : "-",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Total Orders",
      value: stats?.total_orders || 0,
      icon: ShoppingBag,
      color: "bg-blue-500",
    },
    {
      title: "Products",
      value: stats?.total_products || 0,
      icon: Package,
      color: "bg-purple-500",
    },
    {
      title: "Customers",
      value: stats?.total_users || 0,
      icon: Users,
      color: "bg-orange-500",
    },
  ];

  const orderStats = [
    { label: "Pending", value: stats?.pending_orders || 0, icon: Clock, color: "text-yellow-600" },
    { label: "Processing", value: stats?.processing_orders || 0, icon: Package, color: "text-blue-600" },
    { label: "Shipped", value: stats?.shipped_orders || 0, icon: Truck, color: "text-purple-600" },
    { label: "Delivered", value: stats?.delivered_orders || 0, icon: CheckCircle, color: "text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 admin-sidebar transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <h1 className="font-serif text-xl font-semibold text-white">
              Jojos <span className="text-[#BC9F8B]">Admin</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white"
              data-testid="admin-dashboard-link"
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/admin/products"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              data-testid="admin-products-link"
            >
              <Package className="w-5 h-5" />
              Products
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              data-testid="admin-orders-link"
            >
              <ShoppingBag className="w-5 h-5" />
              Orders
            </Link>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Store
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              data-testid="admin-logout-btn"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="font-serif text-xl font-semibold text-gray-900">Dashboard</h2>
            </div>
            <div className="flex items-center gap-3">
              {user?.picture && (
                <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
              )}
              <span className="text-sm text-gray-600">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{card.title}</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{card.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Stats */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                <h3 className="font-medium text-gray-900 mb-6">Order Status Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {orderStats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <p className="text-2xl font-semibold text-gray-900 mt-2">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  to="/admin/products"
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Manage Products</h3>
                      <p className="text-sm text-gray-500 mt-1">Add, edit, or remove products</p>
                    </div>
                    <Package className="w-8 h-8 text-[#BC9F8B] group-hover:scale-110 transition-transform" />
                  </div>
                </Link>
                <Link
                  to="/admin/orders"
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">View Orders</h3>
                      <p className="text-sm text-gray-500 mt-1">Track and manage customer orders</p>
                    </div>
                    <ShoppingBag className="w-8 h-8 text-[#BC9F8B] group-hover:scale-110 transition-transform" />
                  </div>
                </Link>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
