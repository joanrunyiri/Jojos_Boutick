import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  Menu,
  LogOut,
  Home,
  X,
  Upload,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "@/App";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminProducts = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "dresses",
    images: [""],
    sizes: [],
    colors: [],
    stock: "",
    is_featured: false,
  });

  const categories = [
    { id: "dresses", name: "Dresses" },
    { id: "skirts", name: "Skirts" },
    { id: "coats", name: "Coats" },
    { id: "2_piece", name: "2 Piece" },
    { id: "sunglasses", name: "Sun Glasses" },
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = ["Black", "White", "Red", "Blue", "Green", "Pink", "Beige", "Brown", "Navy", "Grey"];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products?limit=100`, { withCredentials: true });
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        images: product.images?.length > 0 ? product.images : [""],
        sizes: product.sizes || [],
        colors: product.colors || [],
        stock: product.stock?.toString() || "0",
        is_featured: product.is_featured || false,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "dresses",
        images: [""],
        sizes: [],
        colors: [],
        stock: "",
        is_featured: false,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Name and price are required");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        images: formData.images.filter((img) => img.trim()),
        sizes: formData.sizes,
        colors: formData.colors,
        stock: parseInt(formData.stock) || 0,
        is_featured: formData.is_featured,
      };

      if (editingProduct) {
        await axios.put(`${API}/admin/products/${editingProduct.product_id}`, data, {
          withCredentials: true,
        });
        toast.success("Product updated");
      } else {
        await axios.post(`${API}/admin/products`, data, { withCredentials: true });
        toast.success("Product created");
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`${API}/admin/products/${productId}`, { withCredentials: true });
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const toggleSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const toggleColor = (color) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 admin-sidebar transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="font-serif text-xl font-semibold text-white">
              Jojos <span className="text-[#BC9F8B]">Admin</span>
            </h1>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/admin/products"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white"
            >
              <Package className="w-5 h-5" />
              Products
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Orders
            </Link>
          </nav>
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
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2">
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="font-serif text-xl font-semibold text-gray-900">Products</h2>
            </div>
            <button
              onClick={() => handleOpenDialog()}
              className="btn-primary flex items-center gap-2"
              data-testid="add-product-btn"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </header>

        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-6">Add your first product to get started.</p>
              <button onClick={() => handleOpenDialog()} className="btn-primary">
                Add Product
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Product</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Category</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Price</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Stock</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Featured</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.product_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.images?.[0] || "https://via.placeholder.com/50"}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-gray-600">{product.category?.replace("_", " ")}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{formatPrice(product.price)}</td>
                      <td className="px-6 py-4">
                        <span className={`${product.stock <= 5 ? "text-red-600" : "text-gray-600"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.is_featured ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDialog(product)}
                            className="p-2 text-gray-500 hover:text-[#BC9F8B] transition-colors"
                            data-testid={`edit-${product.product_id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.product_id)}
                            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                            data-testid={`delete-${product.product_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  data-testid="product-name-input"
                />
              </div>

              <div>
                <Label htmlFor="price">Price (KES) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-1"
                  data-testid="product-price-input"
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="mt-1"
                  data-testid="product-stock-input"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="mt-1" data-testid="product-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                  data-testid="product-description-input"
                />
              </div>

              <div className="col-span-2">
                <Label>Image URL</Label>
                <Input
                  value={formData.images[0]}
                  onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
                  className="mt-1"
                  placeholder="https://..."
                  data-testid="product-image-input"
                />
              </div>

              <div className="col-span-2">
                <Label>Sizes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1 rounded-full border text-sm transition-all ${
                        formData.sizes.includes(size)
                          ? "bg-[#BC9F8B] text-white border-[#BC9F8B]"
                          : "border-gray-300 hover:border-[#BC9F8B]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <Label>Colors</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`px-3 py-1 rounded-full border text-sm transition-all ${
                        formData.colors.includes(color)
                          ? "bg-[#BC9F8B] text-white border-[#BC9F8B]"
                          : "border-gray-300 hover:border-[#BC9F8B]"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-between">
                <Label htmlFor="featured">Featured Product</Label>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="btn-outline">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary" data-testid="save-product-btn">
              {saving ? "Saving..." : "Save Product"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
