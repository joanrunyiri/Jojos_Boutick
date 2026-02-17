from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi import status as http_status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import base64
import httpx
# import (
#     StripeCheckout,
#     CheckoutSessionResponse,
#     CheckoutStatusResponse,
#     CheckoutSessionRequest,
# )

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# Create the main app
app = FastAPI(title="Jojos Boutick API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ============ MODELS ============
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    picture: Optional[str] = None
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex}")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str = Field(default_factory=lambda: f"prod_{uuid.uuid4().hex[:12]}")
    name: str
    description: str
    price: float
    category: str  # dresses, skirts, coats, 2_piece, sunglasses
    images: List[str] = []
    sizes: List[str] = []
    colors: List[str] = []
    stock: int = 0
    is_featured: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    images: List[str] = []
    sizes: List[str] = []
    colors: List[str] = []
    stock: int = 0
    is_featured: bool = False


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str = Field(default_factory=lambda: f"rev_{uuid.uuid4().hex[:12]}")
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str


class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    size: Optional[str] = None
    color: Optional[str] = None
    image: Optional[str] = None


class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cart_id: str = Field(default_factory=lambda: f"cart_{uuid.uuid4().hex[:12]}")
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    items: List[CartItem] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1
    size: Optional[str] = None
    color: Optional[str] = None


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str = Field(default_factory=lambda: f"ord_{uuid.uuid4().hex[:12]}")
    user_id: str
    items: List[CartItem]
    subtotal: float
    delivery_fee: float
    total: float
    status: str = "pending"  # pending, paid, processing, shipped, delivered, cancelled
    payment_method: str  # stripe, mpesa
    payment_status: str = "pending"  # pending, paid, failed
    payment_reference: Optional[str] = None
    delivery_method: str  # pickup_mtaani, doorstep
    delivery_address: Optional[Dict[str, Any]] = None
    pickup_agent_id: Optional[str] = None
    tracking_number: Optional[str] = None
    customer_phone: str
    customer_email: str
    customer_name: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CreateOrderRequest(BaseModel):
    delivery_method: str
    delivery_address: Optional[Dict[str, Any]] = None
    pickup_agent_id: Optional[str] = None
    customer_phone: str
    customer_name: str
    notes: Optional[str] = None


class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str = Field(default_factory=lambda: f"txn_{uuid.uuid4().hex[:12]}")
    order_id: str
    user_id: str
    amount: float
    currency: str = "KES"
    payment_method: str
    session_id: Optional[str] = None
    checkout_request_id: Optional[str] = None
    mpesa_receipt: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PickupMtaaniAgent(BaseModel):
    agent_id: str
    name: str
    location: str
    area: str
    zone: str


# ============ HELPER FUNCTIONS ============
async def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from session token in cookie or header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token}, {"_id": 0}
    )
    if not session_doc:
        return None
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]}, {"_id": 0}
    )
    return user_doc


async def require_user(request: Request) -> dict:
    """Require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_admin(request: Request) -> dict:
    """Require admin user"""
    user = await require_user(request)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ============ AUTH ENDPOINTS ============
@api_router.get("/auth/callback")
async def google_auth_callback(code: str, request: Request):
    """Exchange Google auth code for user data"""
    try:
        redirect_uri = str(request.base_url).rstrip("/").replace("8001", "3000") + "/auth/callback"
        
        # Exchange code for tokens
        async with httpx.AsyncClient() as http_client:
            token_response = await http_client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": os.environ["GOOGLE_CLIENT_ID"],
                    "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                }
            )
            tokens = token_response.json()
            
            # Get user info
            user_response = await http_client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )
            user_data = user_response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"name": user_data["name"], "picture": user_data.get("picture")}}
            )
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "is_admin": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        
        # Create session
        session_token = uuid.uuid4().hex
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.insert_one({
            "session_id": f"sess_{uuid.uuid4().hex}",
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        # Redirect to frontend with session
        frontend_url = str(request.base_url).rstrip("/").replace("8001", "3000")
        response = JSONResponse(content=user_doc)
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=False,  # Set True in production
            samesite="lax",
            path="/",
            max_age=7 * 24 * 60 * 60,
        )
        return response
        
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")
# @api_router.get("/auth/session")
# async def exchange_session(session_id: str, request: Request):
#     """Exchange Emergent Auth session_id for user data and set cookie"""
#     try:
#         async with httpx.AsyncClient() as client:
#             response = await client.get(
#                 "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
#                 headers={"X-Session-ID": session_id},
#             )
#             if response.status_code != 200:
#                 raise HTTPException(status_code=401, detail="Invalid session")
            
#             user_data = response.json()
        
#         # Check if user exists
#         existing_user = await db.users.find_one(
#             {"email": user_data["email"]}, {"_id": 0}
#         )
        
#         if existing_user:
#             user_id = existing_user["user_id"]
#             # Update user data
#             await db.users.update_one(
#                 {"user_id": user_id},
#                 {
#                     "$set": {
#                         "name": user_data["name"],
#                         "picture": user_data.get("picture"),
#                     }
#                 },
#             )
#         else:
#             user_id = f"user_{uuid.uuid4().hex[:12]}"
#             new_user = {
#                 "user_id": user_id,
#                 "email": user_data["email"],
#                 "name": user_data["name"],
#                 "picture": user_data.get("picture"),
#                 "is_admin": False,
#                 "created_at": datetime.now(timezone.utc).isoformat(),
#             }
#             await db.users.insert_one(new_user)
        
#         # Store session
#         session_token = user_data["session_token"]
#         expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
#         await db.user_sessions.insert_one({
#             "session_id": f"sess_{uuid.uuid4().hex}",
#             "user_id": user_id,
#             "session_token": session_token,
#             "expires_at": expires_at.isoformat(),
#             "created_at": datetime.now(timezone.utc).isoformat(),
#         })
        
#         # Get full user
#         user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
#         response = JSONResponse(content=user_doc)
#         response.set_cookie(
#             key="session_token",
#             value=session_token,
#             httponly=True,
#             secure=True,
#             samesite="none",
#             path="/",
#             max_age=7 * 24 * 60 * 60,
#         )
#         return response
        
#     except httpx.RequestError as e:
#         logger.error(f"Auth error: {e}")
#         raise HTTPException(status_code=500, detail="Authentication failed")


@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@api_router.post("/auth/logout")
async def logout(request: Request):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="session_token", path="/")
    return response


@api_router.post("/auth/make-admin")
async def make_admin(email: str, admin: dict = Depends(require_admin)):
    """Make a user an admin (admin only)"""
    result = await db.users.update_one({"email": email}, {"$set": {"is_admin": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"{email} is now an admin"}


# ============ PRODUCT ENDPOINTS ============
@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 50,
    skip: int = 0,
):
    """Get all products with optional filters"""
    query = {"is_active": True}
    
    if category:
        query["category"] = category
    if featured is not None:
        query["is_featured"] = featured
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    
    return {"products": products, "total": total}


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product by ID"""
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get reviews
    reviews = await db.reviews.find(
        {"product_id": product_id}, {"_id": 0}
    ).to_list(100)
    
    return {**product, "reviews": reviews}


@api_router.post("/admin/products")
async def create_product(product: ProductCreate, admin: dict = Depends(require_admin)):
    """Create a new product (admin only)"""
    product_doc = Product(**product.model_dump()).model_dump()
    product_doc["created_at"] = product_doc["created_at"].isoformat()
    await db.products.insert_one(product_doc)
    return {"product_id": product_doc["product_id"], "message": "Product created"}


@api_router.put("/admin/products/{product_id}")
async def update_product(
    product_id: str, update: ProductUpdate, admin: dict = Depends(require_admin)
):
    """Update a product (admin only)"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.products.update_one(
        {"product_id": product_id}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}


@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(require_admin)):
    """Delete a product (admin only)"""
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}


# ============ REVIEW ENDPOINTS ============
@api_router.post("/reviews")
async def create_review(review: ReviewCreate, user: dict = Depends(require_user)):
    """Create a review (authenticated users only)"""
    # Check if product exists
    product = await db.products.find_one({"product_id": review.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    review_doc = Review(
        product_id=review.product_id,
        user_id=user["user_id"],
        user_name=user["name"],
        rating=review.rating,
        comment=review.comment,
    ).model_dump()
    review_doc["created_at"] = review_doc["created_at"].isoformat()
    
    await db.reviews.insert_one(review_doc)
    return {"review_id": review_doc["review_id"], "message": "Review created"}


@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    """Get all reviews for a product"""
    reviews = await db.reviews.find(
        {"product_id": product_id}, {"_id": 0}
    ).to_list(100)
    return {"reviews": reviews}


# ============ CART ENDPOINTS ============
async def get_or_create_cart(user_id: Optional[str], session_id: str) -> dict:
    """Get or create a cart"""
    query = {"user_id": user_id} if user_id else {"session_id": session_id}
    cart = await db.carts.find_one(query, {"_id": 0})
    
    if not cart:
        cart = Cart(user_id=user_id, session_id=session_id if not user_id else None).model_dump()
        cart["updated_at"] = cart["updated_at"].isoformat()
        await db.carts.insert_one(cart)
        # Fetch the cart again to ensure we get clean data without ObjectId
        cart = await db.carts.find_one(query, {"_id": 0})
    
    return cart


@api_router.get("/cart")
async def get_cart(request: Request):
    """Get current cart"""
    user = await get_current_user(request)
    session_id = request.cookies.get("cart_session") or str(uuid.uuid4())
    
    cart = await get_or_create_cart(
        user["user_id"] if user else None,
        session_id
    )
    
    response = JSONResponse(content=cart)
    if not user:
        response.set_cookie(key="cart_session", value=session_id, max_age=30*24*60*60)
    return response


@api_router.post("/cart/add")
async def add_to_cart(item: AddToCartRequest, request: Request):
    """Add item to cart"""
    user = await get_current_user(request)
    session_id = request.cookies.get("cart_session") or str(uuid.uuid4())
    
    # Get product
    product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart = await get_or_create_cart(
        user["user_id"] if user else None,
        session_id
    )
    
    # Check if item already in cart
    cart_items = cart.get("items", [])
    existing_item = next(
        (i for i in cart_items if i["product_id"] == item.product_id 
         and i.get("size") == item.size and i.get("color") == item.color),
        None
    )
    
    if existing_item:
        existing_item["quantity"] += item.quantity
    else:
        cart_items.append(CartItem(
            product_id=product["product_id"],
            name=product["name"],
            price=product["price"],
            quantity=item.quantity,
            size=item.size,
            color=item.color,
            image=product["images"][0] if product.get("images") else None,
        ).model_dump())
    
    query = {"user_id": user["user_id"]} if user else {"session_id": session_id}
    await db.carts.update_one(
        query,
        {"$set": {"items": cart_items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    cart["items"] = cart_items
    response = JSONResponse(content=cart)
    if not user:
        response.set_cookie(key="cart_session", value=session_id, max_age=30*24*60*60)
    return response


@api_router.put("/cart/update")
async def update_cart_item(
    product_id: str, quantity: int, size: Optional[str] = None, 
    color: Optional[str] = None, request: Request = None
):
    """Update cart item quantity"""
    user = await get_current_user(request)
    session_id = request.cookies.get("cart_session")
    
    query = {"user_id": user["user_id"]} if user else {"session_id": session_id}
    cart = await db.carts.find_one(query, {"_id": 0})
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart_items = cart.get("items", [])
    for item in cart_items:
        if (item["product_id"] == product_id 
            and item.get("size") == size 
            and item.get("color") == color):
            if quantity <= 0:
                cart_items.remove(item)
            else:
                item["quantity"] = quantity
            break
    
    await db.carts.update_one(
        query,
        {"$set": {"items": cart_items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    cart["items"] = cart_items
    return cart


@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(
    product_id: str, size: Optional[str] = None, 
    color: Optional[str] = None, request: Request = None
):
    """Remove item from cart"""
    user = await get_current_user(request)
    session_id = request.cookies.get("cart_session")
    
    query = {"user_id": user["user_id"]} if user else {"session_id": session_id}
    cart = await db.carts.find_one(query, {"_id": 0})
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart_items = [
        item for item in cart.get("items", [])
        if not (item["product_id"] == product_id 
                and item.get("size") == size 
                and item.get("color") == color)
    ]
    
    await db.carts.update_one(
        query,
        {"$set": {"items": cart_items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    cart["items"] = cart_items
    return cart


@api_router.delete("/cart/clear")
async def clear_cart(request: Request):
    """Clear cart"""
    user = await get_current_user(request)
    session_id = request.cookies.get("cart_session")
    
    query = {"user_id": user["user_id"]} if user else {"session_id": session_id}
    await db.carts.update_one(
        query,
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Cart cleared"}


# ============ ORDER ENDPOINTS ============
@api_router.post("/orders")
async def create_order(order_req: CreateOrderRequest, request: Request):
    """Create a new order"""
    user = await require_user(request)
    
    # Get cart
    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate totals
    subtotal = sum(item["price"] * item["quantity"] for item in cart["items"])
    delivery_fee = 200.0 if order_req.delivery_method == "pickup_mtaani" else 350.0
    total = subtotal + delivery_fee
    
    # Create order
    order = Order(
        user_id=user["user_id"],
        items=cart["items"],
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        payment_method="pending",
        delivery_method=order_req.delivery_method,
        delivery_address=order_req.delivery_address,
        pickup_agent_id=order_req.pickup_agent_id,
        customer_phone=order_req.customer_phone,
        customer_email=user["email"],
        customer_name=order_req.customer_name,
        notes=order_req.notes,
    ).model_dump()
    
    order["created_at"] = order["created_at"].isoformat()
    order["updated_at"] = order["updated_at"].isoformat()
    
    await db.orders.insert_one(order)
    
    return {"order_id": order["order_id"], "total": total}


@api_router.get("/orders")
async def get_user_orders(request: Request):
    """Get current user's orders"""
    user = await require_user(request)
    orders = await db.orders.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"orders": orders}


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    """Get order by ID"""
    user = await require_user(request)
    order = await db.orders.find_one(
        {"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@api_router.get("/admin/orders")
async def get_all_orders(
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    admin: dict = Depends(require_admin)
):
    """Get all orders (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort(
        "created_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    
    return {"orders": orders, "total": total}


@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    tracking_number: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    """Update order status (admin only)"""
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if tracking_number:
        update_data["tracking_number"] = tracking_number
    
    result = await db.orders.update_one(
        {"order_id": order_id}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}


# ============ PAYMENT ENDPOINTS ============
@api_router.post("/payments/stripe/checkout")
async def create_stripe_checkout(order_id: str, origin_url: str, request: Request):
    """Create Stripe checkout session"""
    user = await require_user(request)
    
    # Get order
    order = await db.orders.find_one(
        {"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")
    
    # Initialize Stripe
    api_key = os.environ.get("STRIPE_API_KEY")
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    # Create checkout session
    success_url = f"{origin_url}/order-confirmation?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/checkout?order_id={order_id}"
    
    # Convert KES to USD (approximate rate)
    amount_usd = round(order["total"] / 130, 2)
    
    checkout_request = CheckoutSessionRequest(
        amount=amount_usd,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "user_id": user["user_id"],
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        order_id=order_id,
        user_id=user["user_id"],
        amount=order["total"],
        currency="KES",
        payment_method="stripe",
        session_id=session.session_id,
        status="pending",
    ).model_dump()
    transaction["created_at"] = transaction["created_at"].isoformat()
    transaction["updated_at"] = transaction["updated_at"].isoformat()
    
    await db.payment_transactions.insert_one(transaction)
    
    # Update order
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"payment_method": "stripe", "payment_reference": session.session_id}}
    )
    
    return {"checkout_url": session.url, "session_id": session.session_id}


@api_router.get("/payments/stripe/status/{session_id}")
async def get_stripe_payment_status(session_id: str, request: Request):
    """Get Stripe payment status"""
    user = await require_user(request)
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction and order if paid
    if status.payment_status == "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Get transaction to find order
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id}, {"_id": 0}
        )
        if transaction:
            await db.orders.update_one(
                {"order_id": transaction["order_id"]},
                {"$set": {
                    "payment_status": "paid",
                    "status": "processing",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            # Clear cart
            await db.carts.update_one(
                {"user_id": user["user_id"]},
                {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {"status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            transaction = await db.payment_transactions.find_one(
                {"session_id": event.session_id}, {"_id": 0}
            )
            if transaction:
                await db.orders.update_one(
                    {"order_id": transaction["order_id"]},
                    {"$set": {
                        "payment_status": "paid",
                        "status": "processing",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
        return {"status": "error"}


# ============ M-PESA ENDPOINTS ============
async def get_mpesa_access_token() -> str:
    """Get M-Pesa OAuth access token"""
    consumer_key = os.environ.get("MPESA_CONSUMER_KEY")
    consumer_secret = os.environ.get("MPESA_CONSUMER_SECRET")
    environment = os.environ.get("MPESA_ENVIRONMENT", "sandbox")
    
    if not consumer_key or not consumer_secret:
        raise HTTPException(status_code=500, detail="M-Pesa not configured")
    
    auth_url = (
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        if environment == "sandbox"
        else "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    )
    
    credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            auth_url,
            headers={"Authorization": f"Basic {credentials}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to get M-Pesa token")
        return response.json()["access_token"]


@api_router.post("/payments/mpesa/stk-push")
async def initiate_mpesa_payment(
    order_id: str,
    phone_number: str,
    request: Request
):
    """Initiate M-Pesa STK Push payment"""
    user = await require_user(request)
    
    # Get order
    order = await db.orders.find_one(
        {"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")
    
    # Validate phone number format
    if not phone_number.startswith("254") or len(phone_number) != 12:
        raise HTTPException(
            status_code=400, 
            detail="Phone number must be in format 254XXXXXXXXX"
        )
    
    environment = os.environ.get("MPESA_ENVIRONMENT", "sandbox")
    shortcode = os.environ.get("MPESA_SHORTCODE")
    passkey = os.environ.get("MPESA_PASSKEY")
    
    # Get access token
    access_token = await get_mpesa_access_token()
    
    # Generate timestamp and password
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()
    
    # Callback URL
    host_url = str(request.base_url).rstrip("/")
    callback_url = f"{host_url}/api/payments/mpesa/callback"
    
    # STK Push URL
    stk_url = (
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        if environment == "sandbox"
        else "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    )
    
    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(order["total"]),
        "PartyA": phone_number,
        "PartyB": shortcode,
        "PhoneNumber": phone_number,
        "CallBackURL": callback_url,
        "AccountReference": order_id,
        "TransactionDesc": f"Payment for order {order_id}",
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            stk_url,
            json=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
        )
        
        if response.status_code != 200:
            logger.error(f"M-Pesa STK Push error: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to initiate payment")
        
        result = response.json()
    
    if result.get("ResponseCode") != "0":
        raise HTTPException(
            status_code=400,
            detail=result.get("ResponseDescription", "Payment initiation failed")
        )
    
    # Create payment transaction
    transaction = PaymentTransaction(
        order_id=order_id,
        user_id=user["user_id"],
        amount=order["total"],
        currency="KES",
        payment_method="mpesa",
        checkout_request_id=result.get("CheckoutRequestID"),
        status="pending",
    ).model_dump()
    transaction["created_at"] = transaction["created_at"].isoformat()
    transaction["updated_at"] = transaction["updated_at"].isoformat()
    
    await db.payment_transactions.insert_one(transaction)
    
    # Update order
    await db.orders.update_one(
        {"order_id": order_id},
        {
            "$set": {
                "payment_method": "mpesa",
                "payment_reference": result.get("CheckoutRequestID")
            }
        }
    )
    
    return {
        "checkout_request_id": result.get("CheckoutRequestID"),
        "merchant_request_id": result.get("MerchantRequestID"),
        "message": result.get("CustomerMessage"),
    }


@api_router.post("/payments/mpesa/callback")
async def mpesa_callback(request: Request):
    """Handle M-Pesa callback"""
    try:
        body = await request.json()
        callback_data = body.get("Body", {}).get("stkCallback", {})
        
        checkout_request_id = callback_data.get("CheckoutRequestID")
        result_code = callback_data.get("ResultCode")
        
        logger.info(f"M-Pesa callback: {checkout_request_id}, ResultCode: {result_code}")
        
        if result_code == 0:
            # Payment successful
            metadata = callback_data.get("CallbackMetadata", {}).get("Item", [])
            mpesa_receipt = next(
                (item["Value"] for item in metadata if item["Name"] == "MpesaReceiptNumber"),
                None
            )
            
            await db.payment_transactions.update_one(
                {"checkout_request_id": checkout_request_id},
                {
                    "$set": {
                        "status": "paid",
                        "mpesa_receipt": mpesa_receipt,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Get transaction to find order
            transaction = await db.payment_transactions.find_one(
                {"checkout_request_id": checkout_request_id}, {"_id": 0}
            )
            if transaction:
                await db.orders.update_one(
                    {"order_id": transaction["order_id"]},
                    {
                        "$set": {
                            "payment_status": "paid",
                            "status": "processing",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                # Clear user's cart
                await db.carts.update_one(
                    {"user_id": transaction["user_id"]},
                    {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
        else:
            # Payment failed
            await db.payment_transactions.update_one(
                {"checkout_request_id": checkout_request_id},
                {
                    "$set": {
                        "status": "failed",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    
    except Exception as e:
        logger.error(f"M-Pesa callback error: {e}")
        return {"ResultCode": 0, "ResultDesc": "Accepted"}


@api_router.get("/payments/mpesa/status/{checkout_request_id}")
async def get_mpesa_payment_status(checkout_request_id: str, request: Request):
    """Get M-Pesa payment status"""
    user = await require_user(request)
    
    transaction = await db.payment_transactions.find_one(
        {"checkout_request_id": checkout_request_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {
        "status": transaction["status"],
        "order_id": transaction["order_id"],
        "mpesa_receipt": transaction.get("mpesa_receipt"),
    }


# ============ PICK UP MTAANI ENDPOINTS ============
@api_router.get("/delivery/pickup-mtaani/agents")
async def get_pickup_agents():
    """Get Pick Up Mtaani agent locations"""
    api_key = os.environ.get("PICKUPMTAANI_API_KEY")
    
    if not api_key:
        # Return mock data if API key not configured
        return {
            "agents": [
                {"agent_id": "agent_1", "name": "Westlands Agent", "location": "Westlands Mall", "area": "Westlands", "zone": "Nairobi"},
                {"agent_id": "agent_2", "name": "CBD Agent", "location": "Kenyatta Avenue", "area": "CBD", "zone": "Nairobi"},
                {"agent_id": "agent_3", "name": "Karen Agent", "location": "Karen Shopping Centre", "area": "Karen", "zone": "Nairobi"},
                {"agent_id": "agent_4", "name": "Mombasa Road Agent", "location": "City Mall", "area": "Mombasa Road", "zone": "Nairobi"},
                {"agent_id": "agent_5", "name": "Thika Road Agent", "location": "Garden City", "area": "Thika Road", "zone": "Nairobi"},
            ],
            "note": "Mock data - Configure PICKUPMTAANI_API_KEY for live data"
        }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.pickupmtaani.com/api/v1/locations",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            if response.status_code == 200:
                return {"agents": response.json()}
            else:
                logger.error(f"Pick Up Mtaani API error: {response.status_code}")
                return {"agents": [], "error": "Failed to fetch agents"}
    except Exception as e:
        logger.error(f"Pick Up Mtaani error: {e}")
        return {"agents": [], "error": str(e)}


@api_router.get("/delivery/pickup-mtaani/charge")
async def get_delivery_charge(destination_agent_id: str):
    """Get delivery charge for Pick Up Mtaani"""
    api_key = os.environ.get("PICKUPMTAANI_API_KEY")
    
    if not api_key:
        # Return mock charge
        return {"delivery_fee": 200.0, "currency": "KES", "note": "Mock data"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.pickupmtaani.com/api/v1/delivery-charge/agent-package",
                params={"destination_agent_id": destination_agent_id},
                headers={"Authorization": f"Bearer {api_key}"},
            )
            if response.status_code == 200:
                return response.json()
            else:
                return {"delivery_fee": 200.0, "currency": "KES"}
    except Exception as e:
        logger.error(f"Pick Up Mtaani charge error: {e}")
        return {"delivery_fee": 200.0, "currency": "KES"}


@api_router.get("/delivery/track/{tracking_number}")
async def track_delivery(tracking_number: str):
    """Track delivery by tracking number"""
    # First check our database
    order = await db.orders.find_one(
        {"tracking_number": tracking_number}, {"_id": 0}
    )
    
    if order:
        return {
            "order_id": order["order_id"],
            "status": order["status"],
            "delivery_method": order["delivery_method"],
            "tracking_number": tracking_number,
            "updated_at": order["updated_at"],
        }
    
    # If not found in our DB, this could be a Pick Up Mtaani tracking number
    api_key = os.environ.get("PICKUPMTAANI_API_KEY")
    
    if api_key:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.pickupmtaani.com/api/v1/packages/agent-agent",
                    params={"tracking_number": tracking_number},
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            logger.error(f"Tracking error: {e}")
    
    return {
        "tracking_number": tracking_number,
        "status": "unknown",
        "message": "Unable to fetch tracking info. Please check the tracking number."
    }


# ============ ADMIN STATS ============
@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    """Get admin dashboard statistics"""
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    processing_orders = await db.orders.count_documents({"status": "processing"})
    shipped_orders = await db.orders.count_documents({"status": "shipped"})
    delivered_orders = await db.orders.count_documents({"status": "delivered"})
    
    total_products = await db.products.count_documents({"is_active": True})
    total_users = await db.users.count_documents({})
    
    # Calculate revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "processing_orders": processing_orders,
        "shipped_orders": shipped_orders,
        "delivered_orders": delivered_orders,
        "total_products": total_products,
        "total_users": total_users,
        "total_revenue": total_revenue,
    }


# ============ CATEGORIES ============
@api_router.get("/categories")
async def get_categories():
    """Get all product categories"""
    return {
        "categories": [
            {"id": "dresses", "name": "Dresses", "image": "https://images.unsplash.com/photo-1596484552993-aec4311d3381?w=400"},
            {"id": "skirts", "name": "Skirts", "image": "https://images.unsplash.com/photo-1728507523256-47e4caeed925?w=400"},
            {"id": "coats", "name": "Coats", "image": "https://images.unsplash.com/photo-1673105793839-6c2811a4e1e7?w=400"},
            {"id": "2_piece", "name": "2 Piece", "image": "https://images.unsplash.com/photo-1768221677363-55e754eb6021?w=400"},
            {"id": "sunglasses", "name": "Sun Glasses", "image": "https://images.unsplash.com/photo-1620743364130-8a1669f00b64?w=400"},
        ]
    }


# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Jojos Boutick API"}


# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
