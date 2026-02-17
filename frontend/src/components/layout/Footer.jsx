import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      toast.success("Thank you for subscribing!");
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#4A4A4A] text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h2 className="font-serif text-2xl font-semibold mb-2">
              Jojos <span className="text-[#BC9F8B]">Boutick</span>
            </h2>
            <p className="text-sm text-white/70 italic mb-6">Elegance with Edge</p>
            <p className="text-sm text-white/60 leading-relaxed">
              Curated fashion for the modern Kenyan woman. Style that speaks, elegance that lasts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-medium text-sm tracking-widest uppercase mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/shop" className="text-white/70 hover:text-white transition-colors text-sm">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/shop/dresses" className="text-white/70 hover:text-white transition-colors text-sm">
                  Dresses
                </Link>
              </li>
              <li>
                <Link to="/shop/coats" className="text-white/70 hover:text-white transition-colors text-sm">
                  Coats
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-white/70 hover:text-white transition-colors text-sm">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-medium text-sm tracking-widest uppercase mb-6">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+254 700 000 000</span>
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>hello@jojosboutick.com</span>
              </li>
            </ul>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-medium text-sm tracking-widest uppercase mb-6">Newsletter</h3>
            <p className="text-white/60 text-sm mb-4">
              Subscribe for exclusive offers and style updates.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="newsletter-input w-full"
                data-testid="newsletter-input"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-[#BC9F8B] hover:bg-[#A88B77] text-white py-3 text-sm tracking-widest uppercase transition-all"
                data-testid="newsletter-submit"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Jojos Boutick. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-white/50 text-xs">We Accept:</span>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-white/10 px-3 py-1 rounded">M-Pesa</span>
              <span className="text-xs bg-white/10 px-3 py-1 rounded">Visa</span>
              <span className="text-xs bg-white/10 px-3 py-1 rounded">Mastercard</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
