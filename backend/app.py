from flask import Flask, jsonify, request, session
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

# Import models
from models import User, Shop, Product, Wishlist, Order, Review

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'default_secret_key')
app.config["MONGO_URI"] = os.getenv('MONGO_URI')
mongo = PyMongo(app)

# Secure session cookies
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,  # True if HTTPS
    SESSION_COOKIE_HTTPONLY=True
)

# Allow CORS
CORS(app, supports_credentials=True, origins=[
    "https://locallys.in",
    "https://www.locallys.in"
])

# -------------------------
# Helper function
# -------------------------
def serialize_doc(doc):
    """Convert MongoDB ObjectId to string for JSON responses"""
    if not doc:
        return None
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# -------------------------
# ROUTES
# -------------------------

@app.route('/')
def home():
    return jsonify({"message": "Shopping App API is running!"})

# -------------------------
# Authentication
# -------------------------
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

    return jsonify(serialize_doc(user)) if user else jsonify({'error': 'User not found'}), 404

# -------------------------
# Shops
# -------------------------
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
            products = list(mongo.db.products.find({'shop_id': shop_id}))

        if not products:
            products = list(mongo.db.products.find({'shop_id': str(shop['_id'])}))

        return jsonify([serialize_doc(product) for product in products])
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# -------------------------
# Wishlist
# -------------------------
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

    product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    shop_id = product['shop_id']

    existing = mongo.db.wishlist.find_one({
        'user_id': ObjectId(user_id),
        'product_id': ObjectId(product_id)
    })

    if existing:
        mongo.db.wishlist.update_one(
            {'user_id': ObjectId(user_id), 'product_id': ObjectId(product_id)},
            {'$inc': {'quantity': 1}}
        )
        return jsonify({'message': 'Product quantity updated in wishlist'})

    wishlist_item = Wishlist(ObjectId(user_id), ObjectId(product_id), shop_id)
    mongo.db.wishlist.insert_one(wishlist_item.to_dict())
    return jsonify({'message': 'Product added to wishlist'})

@app.route('/api/wishlist/<product_id>', methods=['DELETE'])
def remove_from_wishlist(product_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']
    result = mongo.db.wishlist.delete_one({
        'user_id': ObjectId(user_id),
        'product_id': ObjectId(product_id)
    })

    return jsonify({'message': 'Product removed from wishlist'}) if result.deleted_count else jsonify({'error': 'Product not found in wishlist'}), 404

# -------------------------
# Orders
# -------------------------
@app.route('/api/checkout', methods=['POST'])
def checkout():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    product_ids = data.get('product_ids', [])

    if not product_ids:
        return jsonify({'error': 'No products selected'}), 400

    user_id = session['user_id']
    products = list(mongo.db.products.find({'_id': {'$in': [ObjectId(pid) for pid in product_ids]}}))

    shop_ids = []
    for product in products:
        try:
            shop_ids.append(ObjectId(product['shop_id']))
        except:
            shop_ids.append(product['shop_id'])

    shop_ids = list(set(shop_ids))
    shops = list(mongo.db.shops.find({'_id': {'$in': shop_ids}}))
    shop_owner_mobiles = [shop['owner_mobile'] for shop in shops]

    order_items = [{'product_id': ObjectId(pid)} for pid in product_ids]
    order = Order(ObjectId(user_id), order_items)
    mongo.db.orders.insert_one(order.to_dict())

    mongo.db.wishlist.delete_many({'user_id': ObjectId(user_id)})

    return jsonify({'message': 'Order placed successfully', 'shop_owner_mobiles': shop_owner_mobiles})

# -------------------------
# Reviews
# -------------------------
@app.route('/api/reviews/<shop_id>', methods=['GET'])
def get_reviews(shop_id):
    reviews = list(mongo.db.reviews.find({"shop_id": shop_id}))
    return jsonify([serialize_doc(r) for r in reviews])

@app.route('/api/reviews/<shop_id>', methods=['POST'])
def add_review(shop_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    rating = data.get('rating')
    comment = data.get('comment', "")

    if not rating or not (1 <= int(rating) <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400

    review = Review(shop_id, session['user_id'], rating, comment)
    result = mongo.db.reviews.insert_one(review.to_dict())
    review._id = str(result.inserted_id)
    return jsonify(review.to_dict()), 201

@app.route('/api/reviews/<shop_id>/average', methods=['GET'])
def get_average_rating(shop_id):
    pipeline = [
        {"$match": {"shop_id": shop_id}},
        {"$group": {"_id": "$shop_id", "avg_rating": {"$avg": "$rating"}}}
    ]
    result = list(mongo.db.reviews.aggregate(pipeline))
    avg = result[0]["avg_rating"] if result else 0
    return jsonify({"shop_id": shop_id, "average_rating": round(avg, 2)})

# -------------------------
if __name__ == '__main__':
    app.run(debug=True)
