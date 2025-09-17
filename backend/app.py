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


# ---------------- Wishlist Routes (fixed) ---------------- #

@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    wishlist_items = mongo.db.wishlist.find({"user_id": str(user_id)})
    result = []

    for item in wishlist_items:
        product = mongo.db.products.find_one({"_id": ObjectId(item["product_id"])})
        if product:
            merged = {
                "_id": str(item["_id"]),
                "product_id": str(item["product_id"]),
                "shop_id": str(item["shop_id"]),
                "quantity": item.get("quantity", 1),
                "selected_variant": item.get("selected_variant", ""),
                "name": product["name"],
                "description": product["description"],
                "image_url": product["image_url"],
                "price": product["price"],
                "variants": product.get("variants", [])
            }
            result.append(merged)

    return jsonify(result)


@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    product_id = data.get('product_id')
    selected_variant = data.get('selected_variant')

    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400

    user_id = str(session['user_id'])

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
        str(user_id),
        str(product_id),
        str(shop_id),
        quantity=1,
        selected_variant=selected_variant
    )
    mongo.db.wishlist.insert_one(wishlist_item.to_dict())
    return jsonify({'message': 'Product added to wishlist'})


@app.route('/api/wishlist/<product_id>', methods=['DELETE'])
def remove_from_wishlist(product_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = str(session['user_id'])

    result = mongo.db.wishlist.delete_one({
        'user_id': user_id,
        'product_id': str(product_id)
    })

    if result.deleted_count > 0:
        return jsonify({'message': 'Product removed from wishlist'})
    else:
        return jsonify({'error': 'Product not found in wishlist'}), 404


@app.route('/api/wishlist/<product_id>/quantity', methods=['PUT'])
def update_wishlist_quantity(product_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = str(session['user_id'])
    data = request.json
    quantity = data.get('quantity', 1)
    selected_variant = data.get("selected_variant")

    result = mongo.db.wishlist.update_one(
        {
            'user_id': user_id,
            'product_id': str(product_id),
            'selected_variant': selected_variant
        },
        {'$set': {'quantity': max(1, quantity)}}
    )

    if result.modified_count > 0:
        return jsonify({'message': 'Quantity updated successfully'})
    else:
        return jsonify({'error': 'Product not found in wishlist'}), 404
