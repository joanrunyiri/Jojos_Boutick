import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, User, Menu, X, Search, ChevronDown } from "lucide-react";
import { useAuth, useCart } from "@/App";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, login, logout } = useAuth();
  const { cartItemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Track Order", path: "/track" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "glass shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setMobileMenuOpen(true)}
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-6 h-6 text-[#4A4A4A]" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0" data-testid="logo-link">
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#4A4A4A] tracking-tight">
                Jojos <span className="text-[#BC9F8B]">Boutick</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm tracking-wide uppercase transition-colors ${
                    isActive(link.path)
                      ? "text-[#BC9F8B] font-medium"
                      : "text-[#4A4A4A] hover:text-[#BC9F8B]"
                  }`}
                  data-testid={`nav-${link.name.toLowerCase().replace(" ", "-")}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-4">
              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2"
                data-testid="cart-link"
              >
                <ShoppingBag className="w-6 h-6 text-[#4A4A4A]" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#BC9F8B] text-white text-xs rounded-full flex items-center justify-center cart-badge">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-2" data-testid="user-menu-btn">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-[#4A4A4A]" />
                      )}
                      <ChevronDown className="w-4 h-4 text-[#7D7D7D] hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-[#7D7D7D] truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer" data-testid="my-orders-link">
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    {user.is_admin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer" data-testid="admin-link">
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600" data-testid="logout-btn">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={login}
                  className="hidden md:flex items-center gap-2 text-sm text-[#4A4A4A] hover:text-[#BC9F8B] transition-colors"
                  data-testid="sign-in-nav-btn"
                >
                  <User className="w-5 h-5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-[#FFFCFA] z-50 md:hidden shadow-xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="font-serif text-2xl font-semibold text-[#4A4A4A]">
                    Jojos <span className="text-[#BC9F8B]">Boutick</span>
                  </h1>
                  <button onClick={() => setMobileMenuOpen(false)} data-testid="close-menu-btn">
                    <X className="w-6 h-6 text-[#4A4A4A]" />
                  </button>
                </div>

                <div className="space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`block py-3 text-lg border-b border-[#E5E0DC] ${
                        isActive(link.path)
                          ? "text-[#BC9F8B] font-medium"
                          : "text-[#4A4A4A]"
                      }`}
                      data-testid={`mobile-nav-${link.name.toLowerCase().replace(" ", "-")}`}
                    >
                      {link.name}
                    </Link>
                  ))}

                  {user ? (
                    <>
                      <Link to="/orders" className="block py-3 text-lg border-b border-[#E5E0DC] text-[#4A4A4A]">
                        My Orders
                      </Link>
                      {user.is_admin && (
                        <Link to="/admin" className="block py-3 text-lg border-b border-[#E5E0DC] text-[#4A4A4A]">
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="block w-full text-left py-3 text-lg text-red-600"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={login}
                      className="w-full btn-primary mt-6"
                      data-testid="mobile-sign-in-btn"
                    >
                      Sign In with Google
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
