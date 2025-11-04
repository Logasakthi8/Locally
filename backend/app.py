from flask import Flask, jsonify, request, session
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from models import User, Shop, Product, Wishlist, Order, Feedback

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
app.config["MONGO_URI"] = os.getenv('MONGO_URI')
mongo = PyMongo(app)

# Configure session for longer duration
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    PERMANENT_SESSION_LIFETIME=timedelta(days=30)  # 30-day session
)

CORS(app, supports_credentials=True, origins=[
    "https://locallys.in",
    "https://www.locallys.in", 
])

# Helper function to serialize ObjectId
def serialize_doc(doc):
    if doc is None:
        return None
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# ======================
# FIXED AUTH ENDPOINTS
# ======================

@app.route('/api/check-session', methods=['GET'])
def check_session():
    """Enhanced session check with better debugging"""
    try:
        print(f"🔍 Checking session: {dict(session)}")
        
        if 'user_id' in session:
            # Only fetch essential user data for faster response
            user = mongo.db.users.find_one(
                {'_id': ObjectId(session['user_id'])},
                {'mobile': 1, 'lastLogin': 1}  # Only get needed fields
            )
            if user:
                print(f"✅ Active session found for user: {user['mobile']}")
                return jsonify({
                    'user': serialize_doc(user),
                    'message': 'Session active'
                })
        
        # Clear invalid session
        session.clear()
        print("❌ No active session found")
        return jsonify({'user': None, 'message': 'No active session'})
        
    except Exception as e:
        print(f"Session check error: {e}")
        session.clear()
        return jsonify({'user': None, 'error': 'Session check failed'}), 500

@app.route('/api/check-user', methods=['POST'])
def check_user():
    """Ultra-fast user existence check"""
    try:
        data = request.get_json()
        mobile = data.get('mobile')
        
        if not mobile or len(mobile) != 10 or not mobile.isdigit():
            return jsonify({'error': 'Valid 10-digit mobile number is required'}), 400
        
        # Fast existence check with projection
        user = mongo.db.users.find_one(
            {'mobile': mobile}, 
            {'_id': 1}  # Only get ID for faster response
        )
        
        return jsonify({
            'userExists': bool(user),
            'message': 'Customer verified' if user else 'New customer'
        })
        
    except Exception as e:
        print(f"User check error: {e}")
        return jsonify({'error': 'User check failed'}), 500

# FIXED: Use User model consistently
@app.route('/api/auth/mobile', methods=['POST'])
def auth_mobile():
    """Fixed version using User model consistently"""
    try:
        data = request.get_json()
        mobile = data.get('mobile')
        
        if not mobile or len(mobile) != 10 or not mobile.isdigit():
            return jsonify({'error': 'Valid 10-digit mobile number is required'}), 400
        
        # Check if user exists
        user = mongo.db.users.find_one({'mobile': mobile})
        
        if user:
            # Update last login for existing user
            mongo.db.users.update_one(
                {'_id': user['_id']},
                {'$set': {'lastLogin': datetime.utcnow()}}
            )
            is_new_user = False
            message = 'Welcome back!'
        else:
            # Create new user USING THE USER MODEL (consistent with other endpoints)
            user_obj = User(mobile)
            result = mongo.db.users.insert_one(user_obj.to_dict())
            user = mongo.db.users.find_one({'_id': result.inserted_id})
            is_new_user = True
            message = 'Account created successfully'
        
        # Set session
        session['user_id'] = str(user['_id'])
        session['user_mobile'] = user['mobile']
        session.permanent = True
        
        return jsonify({
            'success': True,
            'user': serialize_doc(user),
            'message': message,
            'isNewUser': is_new_user
        })
        
    except Exception as e:
        print(f"Auth error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Authentication failed'}), 500

# ======================
# FIXED WISHLIST ENDPOINTS
# ======================

@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    """Get user's wishlist with proper authentication"""
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            print("❌ Unauthenticated wishlist access attempt")
            return jsonify({'error': 'Please login to view your wishlist'}), 401

        user_id = session['user_id']
        print(f"🔍 Fetching wishlist for user: {user_id}")
        
        wishlist_items = list(mongo.db.wishlist.find({'user_id': ObjectId(user_id)}))
        print(f"📦 Found {len(wishlist_items)} wishlist items")

        if not wishlist_items:
            return jsonify([])

        product_ids = [ObjectId(item['product_id']) for item in wishlist_items]
        products = list(mongo.db.products.find({'_id': {'$in': product_ids}}))

        wishlist_with_details = []
        for item in wishlist_items:
            product = next((p for p in products if str(p['_id']) == str(item['product_id'])), None)
            if product:
                product_data = serialize_doc(product)
                product_data['quantity'] = item.get('quantity', 1)
                product_data['variant'] = item.get('variant')
                product_data['shop_id'] = str(item.get('shop_id', product.get('shop_id', '')))
                wishlist_with_details.append(product_data)

        print(f"✅ Returning {len(wishlist_with_details)} wishlist items")
        return jsonify(wishlist_with_details)

    except Exception as e:
        print(f"❌ Error in get_wishlist: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch wishlist'}), 500

@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    """Add to wishlist with proper authentication"""
    if 'user_id' not in session:
        return jsonify({'error': 'Please login to add items to wishlist'}), 401

    try:
        data = request.json
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        variant = data.get('variant')
        
        if not product_id:
            return jsonify({'error': 'Product ID is required'}), 400

        user_id = session['user_id']
        
        # Find product
        product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        shop_id = product['shop_id']

        # Check if product already exists in wishlist
        query = {
            'user_id': ObjectId(user_id),
            'product_id': ObjectId(product_id)
        }
        
        if variant and variant.get('size'):
            query['variant.size'] = variant.get('size')
        
        existing = mongo.db.wishlist.find_one(query)

        if existing:
            # Update quantity if product already exists
            mongo.db.wishlist.update_one(
                {'_id': existing['_id']},
                {'$set': {'quantity': quantity}}
            )
            return jsonify({'message': 'Product quantity updated in wishlist'})

        # Add new wishlist entry
        wishlist_item = {
            'user_id': ObjectId(user_id),
            'product_id': ObjectId(product_id),
            'shop_id': shop_id,
            'quantity': quantity,
            'variant': variant,
            'added_at': datetime.utcnow()
        }
        mongo.db.wishlist.insert_one(wishlist_item)
        return jsonify({'message': 'Product added to wishlist'})
        
    except Exception as e:
        print(f"Error in add_to_wishlist: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/wishlist/<product_id>', methods=['DELETE'])
def remove_from_wishlist(product_id):
    """Remove from wishlist with proper authentication"""
    if 'user_id' not in session:
        return jsonify({'error': 'Please login to manage your wishlist'}), 401

    user_id = session['user_id']

    try:
        result = mongo.db.wishlist.delete_one({
            'user_id': ObjectId(user_id),
            'product_id': ObjectId(product_id)
        })
        
        if result.deleted_count > 0:
            return jsonify({'message': 'Product removed from wishlist'})
        else:
            return jsonify({'error': 'Product not found in wishlist'}), 404
    except:
        return jsonify({'error': 'Invalid product ID'}), 400

@app.route('/api/wishlist/<product_id>/quantity', methods=['PUT'])
def update_wishlist_quantity(product_id):
    """Update wishlist quantity with proper authentication"""
    if 'user_id' not in session:
        return jsonify({'error': 'Please login to manage your wishlist'}), 401

    user_id = session['user_id']
    data = request.json
    quantity = data.get('quantity', 1)
    
    try:
        result = mongo.db.wishlist.update_one(
            {
                'user_id': ObjectId(user_id),
                'product_id': ObjectId(product_id)
            },
            {'$set': {'quantity': max(1, quantity)}}
        )

        if result.modified_count > 0:
            return jsonify({'message': 'Quantity updated successfully'})
        else:
            return jsonify({'error': 'Product not found in wishlist'}), 404
    except Exception as e:
        print(f"Error updating quantity: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# KEEP ALL YOUR OTHER EXISTING ENDPOINTS EXACTLY THE SAME
@app.route('/api/login', methods=['POST'])
def login():
    """Improved login with session persistence"""
    try:
        data = request.json
        mobile = data.get('mobile')
        remember_me = data.get('rememberMe', True)
        
        if not mobile:
            return jsonify({'error': 'Mobile number is required'}), 400
        
        user = mongo.db.users.find_one({'mobile': mobile})
        
        if not user:
            user_obj = User(mobile)
            result = mongo.db.users.insert_one(user_obj.to_dict())
            user = mongo.db.users.find_one({'_id': result.inserted_id})
            user_message = 'New account created'
        else:
            user_message = 'Welcome back'
        
        session['user_id'] = str(user['_id'])
        session['user_mobile'] = user['mobile']
        
        if remember_me:
            session.permanent = True
        else:
            session.permanent = False
        
        return jsonify({
            'message': 'Login successful',
            'user': serialize_doc(user),
            'userMessage': user_message
        })
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/register', methods=['POST'])
def register():
    """Separate registration endpoint for new users"""
    try:
        data = request.json
        mobile = data.get('mobile')
        
        if not mobile:
            return jsonify({'error': 'Mobile number is required'}), 400
        
        existing_user = mongo.db.users.find_one({'mobile': mobile})
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400
        
        user_obj = User(mobile)
        result = mongo.db.users.insert_one(user_obj.to_dict())
        user = mongo.db.users.find_one({'_id': result.inserted_id})
        
        session['user_id'] = str(user['_id'])
        session['user_mobile'] = user['mobile']
        session.permanent = True
        
        return jsonify({
            'message': 'Registration successful',
            'user': serialize_doc(user)
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Comprehensive logout that clears session and cookies"""
    try:
        print("🔄 Starting logout process...")
        print(f"📋 Session before logout: {dict(session)}")
        
        user_id = session.get('user_id')
        user_mobile = session.get('user_mobile')
        
        session.clear()
        
        response = jsonify({
            'message': 'Logged out successfully', 
            'success': True
        })
        
        response.set_cookie(
            'session',
            '',
            max_age=0,
            expires=0,
            path='/',
            httponly=True,
            secure=True,
            samesite='None'
        )
        
        response.set_cookie(
            'locally_session',
            '',
            max_age=0,
            expires=0,
            path='/',
            httponly=True,
            secure=True,
            samesite='None'
        )
        
        print(f"✅ Logout successful for user: {user_mobile} (ID: {user_id})")
        return response
        
    except Exception as e:
        print(f"❌ Logout error: {e}")
        return jsonify({'error': 'Logout failed', 'success': False}), 500

# ALL YOUR OTHER EXISTING ROUTES REMAIN EXACTLY THE SAME
@app.route('/')
def home():
    return jsonify({"message": "Shopping App API is running!"})

@app.route('/api/clear-cart', methods=['POST'])
def clear_cart():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        result = mongo.db.wishlist.delete_many({'user_id': ObjectId(user_id)})
        return jsonify({
            'message': 'Cart cleared successfully',
            'deleted_count': result.deleted_count
        })
    except Exception as e:
        print(f"Error clearing cart: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/shops', methods=['GET'])
def get_shops():
    shops = list(mongo.db.shops.find())
    return jsonify([serialize_doc(shop) for shop in shops])

@app.route('/api/shops/<shop_id>/products', methods=['GET'])
def get_shop_products(shop_id):
    try:
        products = []
        
        shop = None
        try:
            shop = mongo.db.shops.find_one({'_id': ObjectId(shop_id)})
        except:
            shop = mongo.db.shops.find_one({'_id': shop_id})
        
        if not shop:
            return jsonify({'error': 'Shop not found'}), 404
        
        try:
            products = list(mongo.db.products.find({'shop_id': ObjectId(shop_id)}))
        except:
            pass
        
        if not products:
            products = list(mongo.db.products.find({'shop_id': shop_id}))
        
        if not products:
            products = list(mongo.db.products.find({'shop_id': str(shop['_id'])}))
        
        if not products and '_id' in shop:
            products = list(mongo.db.products.find({'shop_id': str(shop['_id'])}))
            
        return jsonify([serialize_doc(product) for product in products])
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# ... ALL YOUR OTHER EXISTING ENDPOINTS REMAIN EXACTLY THE SAME ...

if __name__ == '__main__':
    app.run(debug=True)
