from flask import Flask, jsonify, request, session
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv
from models import User, Shop, Product, Wishlist, Order

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
app.config["MONGO_URI"] = os.getenv('MONGO_URI')

# ✅ Session cookie config (fix authentication issues across frontend/backend)
app.config.update(
    SESSION_COOKIE_SAMESITE="None",   # Allow cross-site cookies
    SESSION_COOKIE_SECURE=False,      # Use True if deploying on HTTPS
    SESSION_COOKIE_HTTPONLY=True
)

mongo = PyMongo(app)

# ✅ Explicitly allow frontend origin (important for credentials)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# Helper function to serialize ObjectId
def serialize_doc(doc):
    if doc is None:
        return None
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc


# ------------------------- ROUTES -------------------------

@app.route('/')
def home():
    return jsonify({"message": "Shopping App API is running!"})


# ------------------------- AUTH -------------------------
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


@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('user_mobile', None)
    return jsonify({'message': 'Logged out successfully'})


@app.route('/api/user', methods=['GET'])
def get_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    
    if user:
        return jsonify(serialize_doc(user))
    else:
        return jsonify({'error': 'User not found'}), 404


# ------------------------- SHOPS -------------------------
@app.route('/api/shops', methods=['GET'])
def get_shops():
    shops = list(mongo.db.shops.find())
    return jsonify([serialize_doc(shop) for shop in shops])


@app.route('/api/shops/<shop_id>/products', methods=['GET'])
def get_shop_products(shop_id):
    try:
        shop = None
        try:
            shop = mongo.db.shops.find_one({'_id': ObjectId(shop_id)})
        except:
            shop = mongo.db.shops.find_one({'_id': shop_id})
        
        if not shop:
            return jsonify({'error': 'Shop not found'}), 404
        
        products = []
        try:
            products = list(mongo.db.products.find({'shop_id': ObjectId(shop_id)}))
        except:
            pass
        if not products:
            products = list(mongo.db.products.find({'shop_id': shop_id}))
        if not products:
            products = list(mongo.db.products.find({'shop_id': str(shop['_id'])}))
        
        return jsonify([serialize_doc(product) for product in products])
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ------------------------- WISHLIST -------------------------
@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    wishlist_items = list(mongo.db.wishlist.find({'user_id': ObjectId(user_id)}))
    
    product_ids = [ObjectId(item['product_id']) for item in wishlist_items]
    products = list(mongo.db.products.find({'_id': {'$in': product_ids}}))
    
    wishlist_with_details = []
    for item in wishlist_items:
        product = next((p for p in products if str(p['_id']) == str(item['product_id'])), None)
        if product:
            product_data = serialize_doc(product)
            product_data['quantity'] = item.get('quantity', 1)
            product_data['shop_id'] = str(item.get('shop_id', product.get('shop_id', '')))
            wishlist_with_details.append(product_data)
    
    return jsonify(wishlist_with_details)


@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    product_id = data.get('product_id')
    
    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400
    
    user_id = session['user_id']
    
    try:
        product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        shop_id = product['shop_id']
    except Exception:
        return jsonify({'error': 'Invalid product ID'}), 400
    
    existing = mongo.db.wishlist.find_one({
        'user_id': ObjectId(user_id),
        'product_id': ObjectId(product_id)
    })
    
    if existing:
        result = mongo.db.wishlist.update_one(
            {
                'user_id': ObjectId(user_id),
                'product_id': ObjectId(product_id)
            },
            {'$inc': {'quantity': 1}}
        )
        
        if result.modified_count > 0:
            return jsonify({'message': 'Product quantity updated in wishlist'})
        else:
            return jsonify({'message': 'Product already in wishlist'})
    
    wishlist_item = Wishlist(ObjectId(user_id), ObjectId(product_id), shop_id)
    mongo.db.wishlist.insert_one(wishlist_item.to_dict())
    return jsonify({'message': 'Product added to wishlist'})


@app.route('/api/wishlist/<product_id>', methods=['DELETE'])
def remove_from_wishlist(product_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
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


# ------------------------- CLEAR CART -------------------------
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




if __name__ == '__main__':
    app.run(debug=True)
