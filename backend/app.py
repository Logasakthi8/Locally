from flask import Flask, jsonify, request, session
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv
from models import User, Shop, Product, ProductVariant, Wishlist, Order

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
app.config["MONGO_URI"] = os.getenv('MONGO_URI')
mongo = PyMongo(app)

app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,  # True if using HTTPS
    SESSION_COOKIE_HTTPONLY=True
)
CORS(app, supports_credentials=True, origins=["https://locallys.in",
    "https://www.locallys.in"])

# Helper function to serialize ObjectId
def serialize_doc(doc):
    if doc is None:
        return None
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Add the clear-cart endpoint here (before other routes)
@app.route('/api/clear-cart', methods=['POST'])
def clear_cart():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    
    try:
        # Delete all wishlist items for this user
        result = mongo.db.wishlist.delete_many({'user_id': ObjectId(user_id)})
        
        return jsonify({
            'message': 'Cart cleared successfully',
            'deleted_count': result.deleted_count
        })
    except Exception as e:
        print(f"Error clearing cart: {e}")
        return jsonify({'error': str(e)}), 500

# ALL YOUR EXISTING ROUTES BELOW (DO NOT MODIFY)
@app.route('/')
def home():
    return jsonify({"message": "Shopping App API is running!"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    mobile = data.get('mobile')
    
    if not mobile:
        return jsonify({'error': 'Mobile number is required'}), 400
    
    user = mongo.db.users.find_one({'mobile': mobile})
    
    if not user:
        user_obj = User(mobile)
        result = mongo.db.users.insert_one(user_obj.to_dict())
        user = mongo.db.users.find_one({'_id': result.inserted_id})
    
    session['user_id'] = str(user['_id'])
    session['user_mobile'] = user['mobile']
    return jsonify({'message': 'Login successful', 'user': serialize_doc(user)})

@app.route('/api/shops', methods=['GET'])
def get_shops():
    shops = list(mongo.db.shops.find())
    return jsonify([serialize_doc(shop) for shop in shops])

@app.route('/api/shops/<shop_id>/products', methods=['GET'])
def get_shop_products(shop_id):
    try:
        products = []
        
        # First, try to find the shop to determine its ID format
        shop = None
        try:
            shop = mongo.db.shops.find_one({'_id': ObjectId(shop_id)})
        except:
            # If ObjectId conversion fails, try finding by string
            shop = mongo.db.shops.find_one({'_id': shop_id})
        
        if not shop:
            return jsonify({'error': 'Shop not found'}), 404
        
        # Now try to find products with different shop_id formats
        # Try ObjectId format first
        try:
            products = list(mongo.db.products.find({'shop_id': ObjectId(shop_id)}))
        except:
            pass  # Continue to try other formats
        
        # If no products found, try string format
        if not products:
            products = list(mongo.db.products.find({'shop_id': shop_id}))
        
        # If still no products, try using the shop's actual _id format
        if not products:
            products = list(mongo.db.products.find({'shop_id': str(shop['_id'])}))
        
        # One more try: if shop was found by ObjectId, try string version of that ObjectId
        if not products and '_id' in shop:
            products = list(mongo.db.products.find({'shop_id': str(shop['_id'])}))
            
        return jsonify([serialize_doc(product) for product in products])
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Update the wishlist endpoint to include variant information
@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    wishlist_items = list(mongo.db.wishlist.find({'user_id': ObjectId(user_id)}))
    
    product_ids = [ObjectId(item['product_id']) for item in wishlist_items]
    products = list(mongo.db.products.find({'_id': {'$in': product_ids}}))
    
    # Combine product details with wishlist quantities, variant info, and shop_id
    wishlist_with_details = []
    for item in wishlist_items:
        product = next((p for p in products if str(p['_id']) == str(item['product_id'])), None)
        if product:
            product_data = serialize_doc(product)
            product_data['quantity'] = item.get('quantity', 1)
            product_data['variant_id'] = item.get('variant_id')
            # Ensure we have the correct shop_id (from wishlist, not product)
            product_data['shop_id'] = str(item.get('shop_id', product.get('shop_id', '')))
            
            # If variant_id exists, find and include variant details
            if item.get('variant_id') and product.get('variants'):
                variant = next((v for v in product['variants'] if v.get('id') == item['variant_id']), None)
                if variant:
                    product_data['selected_variant'] = variant
                    # Override product details with variant details
                    product_data['price'] = variant.get('price', product_data['price'])
                    product_data['name'] = variant.get('name', product_data['name'])
                    product_data['description'] = variant.get('description', product_data['description'])
                    if variant.get('image_url'):
                        product_data['image_url'] = variant.get('image_url')
            
            wishlist_with_details.append(product_data)
    
    return jsonify(wishlist_with_details)

# Update the add_to_wishlist endpoint to support variants
@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    product_id = data.get('product_id')
    variant_id = data.get('variant_id')  # New parameter for variant selection
    
    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400
    
    user_id = session['user_id']
    
    # First get the product to know its shop_id and validate variant
    try:
        product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        shop_id = product['shop_id']
        
        # Validate variant if provided
        if variant_id and product.get('variants'):
            variant_exists = any(v.get('id') == variant_id for v in product['variants'])
            if not variant_exists:
                return jsonify({'error': 'Invalid variant ID'}), 400
                
    except Exception as e:
        print(f"Error finding product: {e}")
        return jsonify({'error': 'Invalid product ID'}), 400
    
    # Check if already in wishlist (with same variant if applicable)
    query = {
        'user_id': ObjectId(user_id),
        'product_id': ObjectId(product_id)
    }
    
    # Include variant_id in query if provided
    if variant_id:
        query['variant_id'] = variant_id
    
    existing = mongo.db.wishlist.find_one(query)
    
    if existing:
        # Update quantity if already exists
        result = mongo.db.wishlist.update_one(
            query,
            {'$inc': {'quantity': 1}}
        )
        
        if result.modified_count > 0:
            return jsonify({'message': 'Product quantity updated in wishlist'})
        else:
            return jsonify({'message': 'Product already in wishlist'})
    
    # Create new wishlist item with shop_id and variant_id
    wishlist_item = Wishlist(ObjectId(user_id), ObjectId(product_id), shop_id, variant_id)
    mongo.db.wishlist.insert_one(wishlist_item.to_dict())
    return jsonify({'message': 'Product added to wishlist'})

@app.route('/api/wishlist/<product_id>', methods=['DELETE'])
def remove_from_wishlist(product_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    data = request.json
    variant_id = data.get('variant_id')  # Optional variant_id parameter
    
    try:
        query = {
            'user_id': ObjectId(user_id),
            'product_id': ObjectId(product_id)
        }
        
        # Include variant_id in query if provided
        if variant_id:
            query['variant_id'] = variant_id
        
        result = mongo.db.wishlist.delete_one(query)
        
        if result.deleted_count > 0:
            return jsonify({'message': 'Product removed from wishlist'})
        else:
            return jsonify({'error': 'Product not found in wishlist'}), 404
    except:
        return jsonify({'error': 'Invalid product ID'}), 400

# Update the quantity endpoint to support variants
@app.route('/api/wishlist/<product_id>/quantity', methods=['PUT'])
def update_wishlist_quantity(product_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    data = request.json
    quantity = data.get('quantity', 1)
    variant_id = data.get('variant_id')  # Optional variant_id parameter
    
    try:
        query = {
            'user_id': ObjectId(user_id),
            'product_id': ObjectId(product_id)
        }
        
        # Include variant_id in query if provided
        if variant_id:
            query['variant_id'] = variant_id
        
        # If quantity is 0, remove the item from wishlist
        if quantity <= 0:
            result = mongo.db.wishlist.delete_one(query)
            if result.deleted_count > 0:
                return jsonify({'message': 'Product removed from wishlist'})
            else:
                return jsonify({'error': 'Product not found in wishlist'}), 404
        else:
            # Update the quantity in wishlist
            result = mongo.db.wishlist.update_one(
                query,
                {'$set': {'quantity': quantity}}
            )
            
            if result.modified_count > 0:
                return jsonify({'message': 'Quantity updated successfully'})
            else:
                return jsonify({'error': 'Product not found in wishlist'}), 404
    except Exception as e:
        print(f"Error updating quantity: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Update the checkout endpoint to handle variants
@app.route('/api/checkout', methods=['POST'])
def checkout():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    product_ids = data.get('product_ids', [])
    
    if not product_ids:
        return jsonify({'error': 'No products selected'}), 400
    
    user_id = session['user_id']
    
    try:
        # Get wishlist items for checkout
        wishlist_items = list(mongo.db.wishlist.find({
            'user_id': ObjectId(user_id),
            'product_id': {'$in': [ObjectId(pid) for pid in product_ids]}
        }))
        
        if not wishlist_items:
            return jsonify({'error': 'No items found for checkout'}), 404
        
        # Get product details
        product_ids = [item['product_id'] for item in wishlist_items]
        products = list(mongo.db.products.find({'_id': {'$in': product_ids}}))
        
        # Find shop owner mobile numbers
        shop_ids = []
        order_items = []
        
        for item in wishlist_items:
            product = next((p for p in products if p['_id'] == item['product_id']), None)
            if product:
                # Determine price based on variant if available
                price = product['price']
                if item.get('variant_id') and product.get('variants'):
                    variant = next((v for v in product['variants'] if v.get('id') == item['variant_id']), None)
                    if variant:
                        price = variant.get('price', price)
                
                order_items.append({
                    'product_id': item['product_id'],
                    'variant_id': item.get('variant_id'),
                    'quantity': item.get('quantity', 1),
                    'price': price
                })
                
                try:
                    # Try to convert to ObjectId first
                    shop_ids.append(ObjectId(product['shop_id']))
                except:
                    # If it's already a string, use it directly
                    shop_ids.append(product['shop_id'])
        
        # Remove duplicates
        shop_ids = list(set(shop_ids))
        
        # Find shops with both ObjectId and string formats
        shops = list(mongo.db.shops.find({'_id': {'$in': shop_ids}}))
        
        shop_owner_mobiles = [shop['owner_mobile'] for shop in shops]
        
        # Create order
        order = Order(ObjectId(user_id), order_items)
        mongo.db.orders.insert_one(order.to_dict())
        
        # Clear wishlist after checkout
        mongo.db.wishlist.delete_many({'user_id': ObjectId(user_id)})
        
        return jsonify({
            'message': 'Order placed successfully',
            'shop_owner_mobiles': shop_owner_mobiles
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ALL OTHER EXISTING ENDPOINTS REMAIN UNCHANGED
# [Include all the other endpoints from your original code here without modification]
# These include: get_user, logout, get_shops_batch, fix_shop_ids, debug_products,
# get_wishlist_shop_counts, get_wishlist_by_shop, checkout_shop, 
# update_wishlist_quantities, and all review endpoints

if __name__ == '__main__':
    app.run(debug=True)
