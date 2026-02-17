import requests
import sys
from datetime import datetime
import json

class JojosBoutickAPITester:
    def __init__(self, base_url="https://styled-shop.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_health_endpoint(self):
        """Test API health endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data.get('status')}"
            self.log_result("Health Check", success, details)
            return success
        except Exception as e:
            self.log_result("Health Check", False, f"Error: {str(e)}")
            return False

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/categories", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                categories = data.get('categories', [])
                expected_categories = ['dresses', 'skirts', 'coats', '2_piece', 'sunglasses']
                found_categories = [cat.get('id') for cat in categories]
                
                if all(cat in found_categories for cat in expected_categories):
                    details += f", Found {len(categories)} categories"
                else:
                    success = False
                    details += f", Missing categories. Found: {found_categories}"
                    
            self.log_result("Categories Endpoint", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_result("Categories Endpoint", False, f"Error: {str(e)}")
            return False, {}

    def test_products_endpoint(self):
        """Test products endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/products", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                products = data.get('products', [])
                total = data.get('total', 0)
                details += f", Found {len(products)} products (total: {total})"
                
                if len(products) == 0:
                    success = False
                    details += ", No products found in database"
                else:
                    # Check product structure
                    first_product = products[0]
                    required_fields = ['product_id', 'name', 'price', 'category']
                    missing_fields = [field for field in required_fields if field not in first_product]
                    if missing_fields:
                        success = False
                        details += f", Missing fields: {missing_fields}"
                        
            self.log_result("Products Endpoint", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_result("Products Endpoint", False, f"Error: {str(e)}")
            return False, {}

    def test_products_by_category(self):
        """Test products filtering by category"""
        try:
            response = self.session.get(f"{self.api_url}/products?category=dresses", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                products = data.get('products', [])
                details += f", Found {len(products)} dresses"
                
                # Verify all products are dresses
                non_dress_products = [p for p in products if p.get('category') != 'dresses']
                if non_dress_products:
                    success = False
                    details += f", Found {len(non_dress_products)} non-dress products"
                    
            self.log_result("Products by Category Filter", success, details)
            return success
        except Exception as e:
            self.log_result("Products by Category Filter", False, f"Error: {str(e)}")
            return False

    def test_featured_products(self):
        """Test featured products endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/products?featured=true", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                products = data.get('products', [])
                details += f", Found {len(products)} featured products"
                
                # Verify all products are featured
                non_featured = [p for p in products if not p.get('is_featured')]
                if non_featured:
                    success = False
                    details += f", Found {len(non_featured)} non-featured products"
                    
            self.log_result("Featured Products", success, details)
            return success
        except Exception as e:
            self.log_result("Featured Products", False, f"Error: {str(e)}")
            return False

    def test_single_product(self, product_id=None):
        """Test single product endpoint"""
        if not product_id:
            # Get a product ID first
            try:
                response = self.session.get(f"{self.api_url}/products?limit=1")
                if response.status_code == 200:
                    products = response.json().get('products', [])
                    if products:
                        product_id = products[0]['product_id']
                    else:
                        self.log_result("Single Product", False, "No products found to test")
                        return False
                else:
                    self.log_result("Single Product", False, "Could not fetch product list")
                    return False
            except Exception as e:
                self.log_result("Single Product", False, f"Error getting product list: {str(e)}")
                return False
        
        try:
            response = self.session.get(f"{self.api_url}/products/{product_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                product = response.json()
                required_fields = ['product_id', 'name', 'price', 'description', 'category']
                missing_fields = [field for field in required_fields if field not in product]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Product: {product.get('name')}"
                    
            self.log_result("Single Product", success, details)
            return success
        except Exception as e:
            self.log_result("Single Product", False, f"Error: {str(e)}")
            return False

    def test_cart_endpoint(self):
        """Test cart endpoint (should work without authentication)"""
        try:
            response = self.session.get(f"{self.api_url}/cart", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                cart = response.json()
                items = cart.get('items', [])
                details += f", Cart has {len(items)} items"
                
            self.log_result("Cart Endpoint", success, details)
            return success
        except Exception as e:
            self.log_result("Cart Endpoint", False, f"Error: {str(e)}")
            return False

    def test_add_to_cart(self, product_id=None):
        """Test adding item to cart"""
        if not product_id:
            # Get a product ID first
            try:
                response = self.session.get(f"{self.api_url}/products?limit=1")
                if response.status_code == 200:
                    products = response.json().get('products', [])
                    if products:
                        product_id = products[0]['product_id']
                    else:
                        self.log_result("Add to Cart", False, "No products found to test")
                        return False
                else:
                    self.log_result("Add to Cart", False, "Could not fetch product list")
                    return False
            except Exception as e:
                self.log_result("Add to Cart", False, f"Error getting product list: {str(e)}")
                return False
        
        try:
            response = self.session.post(
                f"{self.api_url}/cart/add",
                json={"product_id": product_id, "quantity": 1},
                timeout=10
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                cart = response.json()
                items = cart.get('items', [])
                details += f", Cart now has {len(items)} items"
                
            self.log_result("Add to Cart", success, details)
            return success
        except Exception as e:
            self.log_result("Add to Cart", False, f"Error: {str(e)}")
            return False

    def test_delivery_agents_endpoint(self):
        """Test Pick Up Mtaani delivery agents endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/delivery/pickup-mtaani/agents", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                agents = data.get('agents', [])
                details += f", Found {len(agents)} pickup agents"
                if data.get('note'):
                    details += " (Mock data)"
                    
            self.log_result("Delivery Agents", success, details)
            return success
        except Exception as e:
            self.log_result("Delivery Agents", False, f"Error: {str(e)}")
            return False

    def test_track_delivery(self):
        """Test delivery tracking with mock tracking number"""
        try:
            response = self.session.get(f"{self.api_url}/delivery/track/TEST123456", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", Tracking result: {data.get('status', 'unknown')}"
                    
            self.log_result("Track Delivery", success, details)
            return success
        except Exception as e:
            self.log_result("Track Delivery", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print(f"\n🔍 Testing Jojos Boutick API at {self.base_url}")
        print("=" * 60)
        
        # Test core endpoints
        self.test_health_endpoint()
        categories_success, categories_data = self.test_categories_endpoint()
        products_success, products_data = self.test_products_endpoint()
        
        # Test product filtering
        self.test_products_by_category()
        self.test_featured_products()
        
        # Test single product
        self.test_single_product()
        
        # Test cart functionality
        self.test_cart_endpoint()
        self.test_add_to_cart()
        
        # Test delivery features
        self.test_delivery_agents_endpoint()
        self.test_track_delivery()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 API Tests Summary:")
        print(f"   Passed: {self.tests_passed}/{self.tests_run}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed, self.tests_run, self.test_results

def main():
    """Main function"""
    tester = JojosBoutickAPITester()
    passed, total, results = tester.run_all_tests()
    
    # Return exit code based on success rate
    success_rate = passed / total if total > 0 else 0
    if success_rate < 0.8:  # Less than 80% success
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())