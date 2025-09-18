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
# Helper functions
# -------------------------

def serialize_doc(doc):
    """Convert MongoDB ObjectId to string for JSON responses"""
    if not doc:
        return None
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc


def to_objectid_maybe(val):
    """Try to convert to ObjectId; if fails, return original value."""
    try:
        return ObjectId(val)
    except Exception:
        return val


def get_variant_label(v):
    if not v:
        return None
    if isinstance(v, dict):
        return v.get('label') or v.get('size') or v.get('name')
    return v


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
# Wishlist (updated to support variants)
# -------------------------
@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']
    wishlist_items = list(mongo.db.wishlist.find({'user_id': ObjectId(user_id)}))

    # gather product ids robustly
    product_ids = []
    for item in wishlist_items:
        pid = item.get('product_id')
        try:
            product_ids.append(ObjectId(pid))
        except Exception:
            product_ids.append(pid)

    products = list(mongo.db.products.find({'_id': {'$in': product_ids}})) if product_ids else []

    wishlist_with_details = []
    for item in wishlist_items:
        product = next((p for p in products if str(p['_id']) == str(item['product_id'])), None)
        if product:
            product_data = serialize_doc(product)
            product_data['quantity'] = item.get('quantity', 1)
            product_data['shop_id'] = str(item.get('shop_id', product.get('shop_id', '')))
            product_data['selected_variant'] = item.get('selected_variant')
            wishlist_with_details.append(product_data)

    return jsonify(wishlist_with_details)


@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json or {}
    product_id = data.get('product_id')
    variant = data.get('variant')  # may be dict or label string
    quantity = int(data.get('quantity', 1))

    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400

    user_id = session['user_id']

    # find product robustly (ObjectId or string)
    product = None
    try:
        product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
    except Exception:
        product = mongo.db.products.find_one({'_id': product_id})

    if not product:
        return jsonify({'error': 'Product not found'}), 404

    # resolve selected_variant object
    selected_variant = None
    if variant:
        if isinstance(variant, dict):
            selected_variant = variant
        else:
            for v in product.get('variants', []):
                label = v.get('label') or v.get('size') or v.get('name')
                if str(label) == str(variant):
                    selected_variant = v
                    break

    # Build query that distinguishes variants (if provided)
    query = {
        'user_id': ObjectId(user_id),
        'product_id': product['_id']
    }
    if selected_variant:
        s_label = get_variant_label(selected_variant)
        if s_label:
            query['selected_variant.label'] = s_label

    existing = mongo.db.wishlist.find_one(query)
    if existing:
        mongo.db.wishlist.update_one(query, {'$inc': {'quantity': quantity}})
        return jsonify({'message': 'Product quantity updated in wishlist'})

    wishlist_doc = {
        'user_id': ObjectId(user_id),
        'product_id': product['_id'],
        'shop_id': product.get('shop_id'),
        'quantity': quantity,
        'selected_variant': selected_variant,
        'created_at': datetime.utcnow()
    }
    mongo.db.wishlist.insert_one(wishlist_doc)
    return jsonify({'message': 'Product added to wishlist'})


@app.route('/api/wishlist/<product_id>', methods=['DELETE'])
def remove_from_wishlist(product_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']
    variant_label = request.args.get('variant') or None

    try:
        query = {
            'user_id': ObjectId(user_id),
            'product_id': ObjectId(product_id)
        }
        if variant_label:
            query['selected_variant.label'] = variant_label

        result = mongo.db.wishlist.delete_one(query)
        if result.deleted_count > 0:
            return jsonify({'message': 'Product removed from wishlist'})
        else:
            return jsonify({'error': 'Product not found in wishlist'}), 404
    except Exception as e:
        print(f"Error removing wishlist item: {e}")
        return jsonify({'error': 'Invalid product ID'}), 400


@app.route('/api/wishlist/<product_id>/quantity', methods=['PUT'])
def update_wishlist_quantity(product_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']
    data = request.json or {}
    quantity = int(data.get('quantity', 1))
    variant = data.get('variant')

    try:
        query = {
            'user_id': ObjectId(user_id),
            'product_id': ObjectId(product_id)
        }
        if variant:
            vlabel = get_variant_label(variant)
            if vlabel:
                query['selected_variant.label'] = vlabel

        result = mongo.db.wishlist.update_one(query, {'$set': {'quantity': max(1, quantity)}})

        if result.modified_count > 0:
            return jsonify({'message': 'Quantity updated successfully'})
        else:
            return jsonify({'error': 'Product/variant not found in wishlist'}), 404
    except Exception as e:
        print(f"Error updating quantity: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/wishlist/shop-counts', methods=['GET'])
def get_wishlist_shop_counts():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        pipeline = [
            {
                '$match': {
                    'user_id': ObjectId(user_id)
                }
            },
            {
                '$group': {
                    '_id': '$shop_id',
                    'count': {'$sum': 1}
                }
            }
        ]

        shop_counts = list(mongo.db.wishlist.aggregate(pipeline))

        result = {}
        for count in shop_counts:
            result[str(count['_id'])] = count['count']

        return jsonify(result)
    except Exception as e:
        print(f"Error getting shop counts: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/wishlist/shop/<shop_id>', methods=['GET'])
def get_wishlist_by_shop(shop_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        # try both ObjectId and string formats for shop_id
        wishlist_items = []
        try:
            wishlist_items = list(mongo.db.wishlist.find({
                'user_id': ObjectId(user_id),
                'shop_id': ObjectId(shop_id)
            }))
        except Exception:
            wishlist_items = list(mongo.db.wishlist.find({
                'user_id': ObjectId(user_id),
                'shop_id': shop_id
            }))

        product_ids = []
        for item in wishlist_items:
            pid = item.get('product_id')
            try:
                product_ids.append(ObjectId(pid))
            except Exception:
                product_ids.append(pid)

        products = list(mongo.db.products.find({'_id': {'$in': product_ids}})) if product_ids else []

        wishlist_with_quantities = []
        for item in wishlist_items:
            product = next((p for p in products if str(p['_id']) == str(item['product_id'])), None)
            if product:
                product_data = serialize_doc(product)
                product_data['quantity'] = item.get('quantity', 1)
                product_data['selected_variant'] = item.get('selected_variant')
                wishlist_with_quantities.append(product_data)

        return jsonify(wishlist_with_quantities)
    except Exception as e:
        print(f"Error getting wishlist by shop: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/checkout/shop/<shop_id>', methods=['POST'])
def checkout_shop(shop_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']
    data = request.json or {}
    product_ids = data.get('product_ids', [])

    try:
        query = {
            'user_id': ObjectId(user_id),
            'shop_id': ObjectId(shop_id)
        }

        if product_ids:
            query['product_id'] = {'$in': [ObjectId(pid) for pid in product_ids]}

        wishlist_items = list(mongo.db.wishlist.find(query))

        if not wishlist_items:
            return jsonify({'error': 'No items found for this shop'}), 404

        product_ids = [item['product_id'] for item in wishlist_items]
        products = list(mongo.db.products.find({'_id': {'$in': product_ids}}))

        order_items = []
        total_amount = 0
        for item in wishlist_items:
            product = next((p for p in products if str(p['_id']) == str(item['product_id'])), None)
            if product:
                # prefer variant price if present
                sel_variant = item.get('selected_variant') or {}
                price = sel_variant.get('price') if isinstance(sel_variant, dict) and sel_variant.get('price') is not None else product.get('price', 0)
                qty = item.get('quantity', 1)
                total_amount += price * qty
                order_items.append({
                    'product_id': item['product_id'],
                    'quantity': qty,
                    'price': price,
                    'name': product.get('name'),
                    'selected_variant': sel_variant
                })

        shop = None
        try:
            shop = mongo.db.shops.find_one({'_id': ObjectId(shop_id)})
        except Exception:
            shop = mongo.db.shops.find_one({'_id': shop_id})

        if not shop:
            return jsonify({'error': 'Shop not found'}), 404

        order = {
            'user_id': ObjectId(user_id),
            'shop_id': ObjectId(shop_id) if isinstance(to_objectid_maybe(shop_id), ObjectId) else shop_id,
            'items': order_items,
            'total_amount': total_amount,
            'status': 'pending',
            'created_at': datetime.utcnow()
        }

        order_result = mongo.db.orders.insert_one(order)

        # Remove checked out items from wishlist (same query used above)
        mongo.db.wishlist.delete_many(query)

        return jsonify({
            'message': 'Order placed successfully',
            'shop_owner_mobile': shop.get('owner_mobile'),
            'shop_name': shop.get('name'),
            'order_id': str(order_result.inserted_id),
            'total_amount': total_amount
        })

    except Exception as e:
        print(f"Error during checkout: {e}")
        return jsonify({'error': 'Internal server error'}), 500

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
