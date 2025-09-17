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

# Update the wishlist endpoint to include quantity
@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    wishlist_items = mongo.db.wishlist.find({"user_id": user_id})
    result = []

    for item in wishlist_items:
        product = mongo.db.products.find_one({"_id": ObjectId(item["product_id"])})
        if product:
            # merge product + wishlist
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



# app.py - Update the add_to_wishlist endpoint
@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    product_id = data.get('product_id')
    selected_variant = data.get('selected_variant')  # 👈 NEW
    
    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400
    
    user_id = session['user_id']
    
    try:
        product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        shop_id = product['shop_id']
    except Exception as e:
        print(f"Error finding product: {e}")
        return jsonify({'error': 'Invalid product ID'}), 400
    
    # Check if already in wishlist (same product + same variant)
    existing = mongo.db.wishlist.find_one({
        'user_id': ObjectId(user_id),
        'product_id': ObjectId(product_id),
        'selected_variant': selected_variant  # 👈 prevent mixing variants
    })
    
    if existing:
        result = mongo.db.wishlist.update_one(
            {
                'user_id': ObjectId(user_id),
                'product_id': ObjectId(product_id),
                'selected_variant': selected_variant
            },
            {'$inc': {'quantity': 1}}
        )
        
        if result.modified_count > 0:
            return jsonify({'message': 'Product quantity updated in wishlist'})
        else:
            return jsonify({'message': 'Product already in wishlist'})
    
    # Create new wishlist item
    wishlist_item = Wishlist(
        ObjectId(user_id),
        ObjectId(product_id),
        shop_id,
        quantity=1,
        selected_variant=selected_variant  # 👈 store it
    )
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
        products = list(mongo.db.products.find({'_id': {'$in': [ObjectId(pid) for pid in product_ids]}}))
        
        # Find shop owner mobile numbers
        shop_ids = []
        for product in products:
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
        order_items = [{'product_id': ObjectId(pid)} for pid in product_ids]
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


@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('user_mobile', None)
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/shops/batch', methods=['POST'])
def get_shops_batch():
    try:
        data = request.json
        shop_ids = data.get('shop_ids', [])
        
        print(f"Fetching shops for IDs: {shop_ids}")
        
        # Convert string IDs to ObjectId
        object_ids = []
        for shop_id in shop_ids:
            try:
                object_ids.append(ObjectId(shop_id))
            except:
                # Keep as string if conversion fails
                object_ids.append(shop_id)
                print(f"Could not convert to ObjectId: {shop_id}")
        
        # Try to find shops with both ObjectId and string formats
        shops = []
        for shop_id in object_ids:
            try:
                # Try ObjectId first
                if isinstance(shop_id, ObjectId):
                    shop = mongo.db.shops.find_one({'_id': shop_id})
                else:
                    shop = mongo.db.shops.find_one({'_id': ObjectId(shop_id)})
                
                if not shop:
                    # Try string format
                    shop = mongo.db.shops.find_one({'_id': shop_id})
                
                if shop:
                    shops.append(shop)
                    print(f"Found shop: {shop['name']} (ID: {shop_id})")
                else:
                    print(f"Shop not found for ID: {shop_id}")
            except Exception as e:
                print(f"Error finding shop {shop_id}: {e}")
                # Try one more time with string
                try:
                    shop = mongo.db.shops.find_one({'_id': str(shop_id)})
                    if shop:
                        shops.append(shop)
                except:
                    pass
        
        return jsonify([serialize_doc(shop) for shop in shops])
    except Exception as e:
        print(f"Error fetching shops batch: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/fix-shop-ids', methods=['POST'])
def fix_shop_ids():
    try:
        # Get all products with string shop_id
        products_with_string_ids = list(mongo.db.products.find({
            'shop_id': {'$type': 'string'}
        }))
        
        updated_count = 0
        for product in products_with_string_ids:
            try:
                # Convert string shop_id to ObjectId
                new_shop_id = ObjectId(product['shop_id'])
                
                # Update the product
                result = mongo.db.products.update_one(
                    {'_id': product['_id']},
                    {'$set': {'shop_id': new_shop_id}}
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    
            except Exception as e:
                print(f"Error converting shop_id for product {product['_id']}: {e}")
                continue
        
        return jsonify({
            'message': f'Successfully converted {updated_count} product shop_ids to ObjectId format'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/products', methods=['GET'])
def debug_products():
    try:
        # Get all products with their shop information
        all_products = list(mongo.db.products.find())
        
        # Get all shops
        all_shops = list(mongo.db.shops.find())
        
        # Check for mismatches
        product_details = []
        for product in all_products:
            product_detail = serialize_doc(product)
            
            # Check if shop_id exists in shops collection
            try:
                shop = mongo.db.shops.find_one({'_id': ObjectId(product['shop_id'])})
                product_detail['shop_exists'] = bool(shop)
            except:
                # Try string comparison
                shop = mongo.db.shops.find_one({'_id': product['shop_id']})
                product_detail['shop_exists'] = bool(shop)
                
            product_details.append(product_detail)
        
        return jsonify({
            'products_count': len(all_products),
            'shops_count': len(all_shops),
            'products': product_details,
            'shops': [serialize_doc(shop) for shop in all_shops]
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add these endpoints to your Flask app

@app.route('/api/wishlist/<product_id>/quantity', methods=['PUT'])
def update_wishlist_quantity(product_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    data = request.json
    quantity = data.get('quantity', 1)
    
    try:
        # Update the quantity in wishlist
        result = mongo.db.wishlist.update_one(
            {
                'user_id': ObjectId(user_id),
                'product_id': ObjectId(product_id)
            },
            {'$set': {'quantity': max(1, quantity)}}  # Ensure quantity is at least 1
        )
        
        if result.modified_count > 0:
            return jsonify({'message': 'Quantity updated successfully'})
        else:
            return jsonify({'error': 'Product not found in wishlist'}), 404
    except Exception as e:
        print(f"Error updating quantity: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Add this endpoint to get wishlist count by shop
@app.route('/api/wishlist/shop-counts', methods=['GET'])
def get_wishlist_shop_counts():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    
    try:
        # Aggregate wishlist items by shop
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
        
        # Convert ObjectId to string for JSON serialization
        result = {}
        for count in shop_counts:
            result[str(count['_id'])] = count['count']
        
        return jsonify(result)
    except Exception as e:
        print(f"Error getting shop counts: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Add this endpoint to get wishlist items by shop
@app.route('/api/wishlist/shop/<shop_id>', methods=['GET'])
def get_wishlist_by_shop(shop_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    
    try:
        wishlist_items = list(mongo.db.wishlist.find({
            'user_id': ObjectId(user_id),
            'shop_id': ObjectId(shop_id)
        }))
        
        product_ids = [ObjectId(item['product_id']) for item in wishlist_items]
        products = list(mongo.db.products.find({'_id': {'$in': product_ids}}))
        
        # Combine product details with wishlist quantities
        wishlist_with_quantities = []
        for item in wishlist_items:
            product = next((p for p in products if str(p['_id']) == str(item['product_id'])), None)
            if product:
                product_data = serialize_doc(product)
                product_data['quantity'] = item.get('quantity', 1)
                wishlist_with_quantities.append(product_data)
        
        return jsonify(wishlist_with_quantities)
    except Exception as e:
        print(f"Error getting wishlist by shop: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Update the checkout_shop endpoint to handle selected products only
@app.route('/api/checkout/shop/<shop_id>', methods=['POST'])
def checkout_shop(shop_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    data = request.json
    product_ids = data.get('product_ids', [])
    
    try:
        # Get selected wishlist items for this user and shop
        query = {
            'user_id': ObjectId(user_id),
            'shop_id': ObjectId(shop_id)
        }
        
        # If specific product IDs are provided, filter by them
        if product_ids:
            query['product_id'] = {'$in': [ObjectId(pid) for pid in product_ids]}
        
        wishlist_items = list(mongo.db.wishlist.find(query))
        
        if not wishlist_items:
            return jsonify({'error': 'No items found for this shop'}), 404
        
        # Get product details
        product_ids = [item['product_id'] for item in wishlist_items]
        products = list(mongo.db.products.find({'_id': {'$in': product_ids}}))
        
        # Build order items
        order_items = []
        for item in wishlist_items:
            product = next((p for p in products if p['_id'] == item['product_id']), None)
            if product:
                # Handle variant price if available
                variant_label = item.get('selected_variant')
                variant_price = None

                if variant_label and 'variants' in product:
                    for v in product['variants']:
                        if v['label'] == variant_label:
                            variant_price = v['price']
                            break

                price_to_use = variant_price if variant_price is not None else product['price']

                order_items.append({
                    'product_id': item['product_id'],
                    'quantity': item.get('quantity', 1),
                    'price': price_to_use,
                    'name': product['name'],
                    'variant': variant_label if variant_label else None
                })
        
        # Get shop details
        shop = mongo.db.shops.find_one({'_id': ObjectId(shop_id)})
        if not shop:
            return jsonify({'error': 'Shop not found'}), 404
        
        # Create order document
        order = {
            'user_id': ObjectId(user_id),
            'shop_id': ObjectId(shop_id),
            'items': order_items,
            'total_amount': sum(item['price'] * item['quantity'] for item in order_items),
            'status': 'pending',
            'created_at': datetime.utcnow()
        }
        
        order_result = mongo.db.orders.insert_one(order)
        
        # Remove checked out items from wishlist
        mongo.db.wishlist.delete_many(query)
        
        return jsonify({
            'message': 'Order placed successfully',
            'shop_owner_mobile': shop['owner_mobile'],
            'shop_name': shop['name'],
            'order_id': str(order_result.inserted_id),
            'total_amount': order['total_amount']
        })
        
    except Exception as e:
        print(f"Error during checkout: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Add this endpoint to update multiple quantities at once
@app.route('/api/wishlist/quantities', methods=['PUT'])
def update_wishlist_quantities():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    data = request.json
    
    if not data or not isinstance(data, list):
        return jsonify({'error': 'Invalid data format'}), 400
    
    try:
        for item in data:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            
            if not product_id:
                continue
            
            # Update the quantity in wishlist
            result = mongo.db.wishlist.update_one(
                {
                    'user_id': ObjectId(user_id),
                    'product_id': ObjectId(product_id)
                },
                {'$set': {'quantity': max(1, quantity)}}  # Ensure quantity is at least 1
            )
        
        return jsonify({'message': 'Quantities updated successfully'})
    except Exception as e:
        print(f"Error updating quantities: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# ======================
# Reviews API
# ======================

@app.route('/api/reviews/<shop_id>', methods=['GET'])
def get_reviews(shop_id):
    """Get all reviews for a shop"""
    try:
        reviews = list(mongo.db.reviews.find({"shop_id": shop_id}))
        return jsonify([serialize_doc(r) for r in reviews])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reviews/<shop_id>', methods=['POST'])
def add_review(shop_id):
    """Add a review for a shop"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    rating = data.get('rating')
    comment = data.get('comment', "")

    if not rating or not (1 <= int(rating) <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400

    try:
        review = {
            "shop_id": shop_id,
            "user_id": session['user_id'],
            "rating": int(rating),
            "comment": comment,
            "created_at": datetime.utcnow()
        }
        result = mongo.db.reviews.insert_one(review)
        review["_id"] = str(result.inserted_id)
        return jsonify(review), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reviews/<shop_id>/average', methods=['GET'])
def get_average_rating(shop_id):
    """Get average rating for a shop"""
    try:
        pipeline = [
            {"$match": {"shop_id": shop_id}},
            {"$group": {"_id": "$shop_id", "avg_rating": {"$avg": "$rating"}}}
        ]
        result = list(mongo.db.reviews.aggregate(pipeline))
        avg = result[0]["avg_rating"] if result else 0
        return jsonify({"shop_id": shop_id, "average_rating": round(avg, 2)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
