from flask import Flask, jsonify, request, session
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

from models import User, Shop, Product, Wishlist, Order, Review

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'default_secret_key')
app.config["MONGO_URI"] = os.getenv('MONGO_URI')
mongo = PyMongo(app)

CORS(app, supports_credentials=True)


# ========================
# Helper Functions
# ========================

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable dict"""
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc


# ========================
# Authentication
# ========================

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
    session.clear()
    return jsonify({'message': 'Logged out successfully'})


# ========================
# Shops
# ========================

@app.route('/api/shops', methods=['GET'])
def get_shops():
    shops = list(mongo.db.shops.find())
    return jsonify([serialize_doc(shop) for shop in shops])


@app.route('/api/shops', methods=['POST'])
def add_shop():
    data = request.json
    shop_obj = Shop(
        name=data['name'],
        owner_mobile=data['owner_mobile'],
        category=data['category'],
        opening_time=data['opening_time'],
        closing_time=data['closing_time'],
        image_url=data['image_url'],
        address=data['address']
    )
    result = mongo.db.shops.insert_one(shop_obj.to_dict())
    return jsonify({'message': 'Shop added successfully', 'id': str(result.inserted_id)})


# ========================
# Products
# ========================

@app.route('/api/products/<shop_id>', methods=['GET'])
def get_products(shop_id):
    products = list(mongo.db.products.find({'shop_id': shop_id}))
    return jsonify([serialize_doc(product) for product in products])


@app.route('/api/products', methods=['GET'])
def get_all_products():
    products = list(mongo.db.products.find())
    return jsonify([serialize_doc(product) for product in products])


@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.json
    product_obj = Product(
        shop_id=data['shop_id'],
        name=data['name'],
        description=data['description'],
        price=data['price'],
        quantity=data['quantity'],
        image_url=data['image_url'],
        variants=data.get('variants', [])
    )
    result = mongo.db.products.insert_one(product_obj.to_dict())
    return jsonify({'message': 'Product added successfully', 'id': str(result.inserted_id)})


# ========================
# Wishlist (with variants)
# ========================

@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']
    wishlist_items = list(mongo.db.wishlist.find({'user_id': user_id}))

    product_ids = [ObjectId(item['product_id']) for item in wishlist_items]
    products = list(mongo.db.products.find({'_id': {'$in': product_ids}}))

    wishlist_with_details = []
    for item in wishlist_items:
        product = next((p for p in products if str(p['_id']) == str(item['product_id'])), None)
        if product:
            product_data = serialize_doc(product)

            # Apply variant-specific details if selected
            variant_label = item.get("selected_variant")
            if variant_label and "variants" in product:
                variant = next((v for v in product["variants"] if v["label"] == variant_label), None)
                if variant:
                    product_data["price"] = variant.get("price", product["price"])
                    product_data["image_url"] = variant.get("image_url", product["image_url"])
                    product_data["description"] = variant.get("description", product["description"])
                    product_data["variant_label"] = variant_label

            product_data["quantity"] = item.get("quantity", 1)
            product_data["shop_id"] = str(item.get("shop_id", product.get("shop_id", "")))
            product_data["selected_variant"] = item.get("selected_variant", "")

            wishlist_with_details.append(product_data)

    return jsonify(wishlist_with_details)


@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    product_id = data.get('product_id')
    selected_variant = data.get('selected_variant', "")

    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400

    user_id = session['user_id']
    product = mongo.db.products.find_one({'_id': ObjectId(product_id)})

    if not product:
        return jsonify({'error': 'Product not found'}), 404

    shop_id = str(product['shop_id'])

    existing = mongo.db.wishlist.find_one({
        'user_id': user_id,
        'product_id': str(product_id),
        'selected_variant': selected_variant
    })

    if existing:
        mongo.db.wishlist.update_one(
            {
                'user_id': user_id,
                'product_id': str(product_id),
                'selected_variant': selected_variant
            },
            {'$inc': {'quantity': 1}}
        )
        return jsonify({'message': 'Product quantity updated in wishlist'})

    wishlist_item = Wishlist(
        user_id=user_id,
        product_id=str(product_id),
        shop_id=shop_id,
        quantity=1,
        selected_variant=selected_variant
    )

    mongo.db.wishlist.insert_one(wishlist_item.to_dict())
    return jsonify({'message': 'Product added to wishlist'})


# ========================
# Orders
# ========================

@app.route('/api/orders', methods=['POST'])
def create_order():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    order_obj = Order(
        user_id=session['user_id'],
        items=data['items'],
        total_amount=data['total_amount'],
        status='pending'
    )
    result = mongo.db.orders.insert_one(order_obj.to_dict())
    return jsonify({'message': 'Order created successfully', 'id': str(result.inserted_id)})


@app.route('/api/orders', methods=['GET'])
def get_orders():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    orders = list(mongo.db.orders.find({'user_id': session['user_id']}))
    return jsonify([serialize_doc(order) for order in orders])


# ========================
# Reviews
# ========================

@app.route('/api/reviews/<shop_id>', methods=['GET'])
def get_reviews(shop_id):
    reviews = list(mongo.db.reviews.find({'shop_id': shop_id}))
    return jsonify([serialize_doc(r) for r in reviews])


@app.route('/api/reviews', methods=['POST'])
def add_review():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    review_obj = Review(
        shop_id=data['shop_id'],
        user_id=session['user_id'],
        rating=data['rating'],
        comment=data.get('comment', "")
    )
    result = mongo.db.reviews.insert_one(review_obj.to_dict())
    return jsonify({'message': 'Review added successfully', 'id': str(result.inserted_id)})


# ========================
# Run
# ========================

if __name__ == '__main__':
    app.run(debug=True)
