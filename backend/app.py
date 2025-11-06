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

# Update session configuration
# Replace your current session config with this:
app.config.update(
    SESSION_COOKIE_NAME='locally_session',  # Use consistent name
    SESSION_COOKIE_DOMAIN='.locallys.in',   # Include subdomains
    SESSION_COOKIE_PATH='/',
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=timedelta(days=30)
)

CORS(app, 
     supports_credentials=True, 
     origins=[
         "https://locallys.in",
         "https://www.locallys.in", 
     ],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Helper function to serialize ObjectId
def serialize_doc(doc):
    if doc is None:
        return None
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# ======================
# IMPROVED AUTH ENDPOINTS
# ======================

@app.route('/api/check-session', methods=['GET'])
def check_session():
    """Check if user has an active session with cookie conflict handling"""
    try:
        # Log cookie information for debugging
        cookies = request.headers.get('Cookie', '')
        session_count = cookies.count('session=')
        locally_session_count = cookies.count('locally_session=')
        
        print(f"🔍 Cookie debug - Sessions: {session_count}, Locally_Sessions: {locally_session_count}")
        
        if 'user_id' in session:
            # Verify user still exists in database
            user = mongo.db.users.find_one({'_id': ObjectId(session['user_id'])})
            if user:
                return jsonify({
                    'user': serialize_doc(user),
                    'message': 'Session active',
                    'cookie_debug': {
                        'session_count': session_count,
                        'locally_session_count': locally_session_count
                    }
                })

        # Clear invalid session
        session.clear()
        return jsonify({
            'user': None, 
            'message': 'No active session',
            'cookie_debug': {
                'session_count': session_count,
                'locally_session_count': locally_session_count
            }
        })

    except Exception as e:
        print(f"Session check error: {e}")
        session.clear()
        return jsonify({'user': None, 'error': 'Session check failed'}), 500
        
@app.route('/api/check-user', methods=['POST'])
def check_user():
    """Quick check if user exists before login"""
    try:
        data = request.json
        mobile = data.get('mobile')

        if not mobile:
            return jsonify({'error': 'Mobile number is required'}), 400

        user = mongo.db.users.find_one({'mobile': mobile})

        return jsonify({
            'userExists': bool(user),
            'message': 'Customer verified' if user else 'New customer'
        })

    except Exception as e:
        print(f"User check error: {e}")
        return jsonify({'error': 'User check failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Improved login with session persistence"""
    try:
        data = request.json
        mobile = data.get('mobile')
        remember_me = data.get('rememberMe', True)  # Default to True for long sessions

        if not mobile:
            return jsonify({'error': 'Mobile number is required'}), 400

        # Find existing user
        user = mongo.db.users.find_one({'mobile': mobile})

        if not user:
            # Create new user
            user_obj = User(mobile)
            result = mongo.db.users.insert_one(user_obj.to_dict())
            user = mongo.db.users.find_one({'_id': result.inserted_id})
            user_message = 'New account created'
        else:
            user_message = 'Welcome back'

        # Set session data
        session['user_id'] = str(user['_id'])
        session['user_mobile'] = user['mobile']

        # Set longer session if remember_me is True
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

        # Check if user already exists
        existing_user = mongo.db.users.find_one({'mobile': mobile})
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400

        # Create new user
        user_obj = User(mobile)
        result = mongo.db.users.insert_one(user_obj.to_dict())
        user = mongo.db.users.find_one({'_id': result.inserted_id})

        # Set session
        session['user_id'] = str(user['_id'])
        session['user_mobile'] = user['mobile']
        session.permanent = True  # Long session for new users

        return jsonify({
            'message': 'Registration successful',
            'user': serialize_doc(user)
        }), 201

    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Clear session on logout"""
    try:
        session.clear()
        return jsonify({'message': 'Logged out successfully'})
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'error': 'Logout failed'}), 500

# ALL YOUR EXISTING ROUTES BELOW (UNCHANGED)
@app.route('/')
def home():
    return jsonify({"message": "Shopping App API is running!"})

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
@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    print(f"🔍 Session check - user_id in session: {'user_id' in session}")
    print(f"🔍 Session contents: {dict(session)}")
    
    if 'user_id' not in session:
        return jsonify({
            'error': 'Not authenticated', 
            'session_data': dict(session),
            'has_user_id': False
        }), 401


    try:
        data = request.json
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)  # Get quantity from request, default to 1
        variant = data.get('variant')  # This might be None

        if not product_id:
            return jsonify({'error': 'Product ID is required'}), 400

        user_id = session['user_id']

        # Find product
        product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        shop_id = product['shop_id']

        # Check if product already exists in wishlist (with or without variant)
        query = {
            'user_id': ObjectId(user_id),
            'product_id': ObjectId(product_id)
        }

        # If variant exists, include it in the query
        if variant and variant.get('size'):
            query['variant.size'] = variant.get('size')

        existing = mongo.db.wishlist.find_one(query)

        if existing:
            # Update quantity if product already exists
            mongo.db.wishlist.update_one(
                {'_id': existing['_id']},
                {'$set': {'quantity': quantity}}  # Set to the new quantity
            )
            return jsonify({'message': 'Product quantity updated in wishlist'})

        # Add new wishlist entry with specified quantity
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
            product_data['variant'] = item.get('variant')  # include variant details
            product_data['shop_id'] = str(item.get('shop_id', product.get('shop_id', '')))
            wishlist_with_details.append(product_data)

    return jsonify(wishlist_with_details)


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

        # Create order
        order_items = []
        for item in wishlist_items:
            product = next((p for p in products if p['_id'] == item['product_id']), None)
            if product:
                order_items.append({
                    'product_id': item['product_id'],
                    'quantity': item.get('quantity', 1),
                    'price': product['price'],
                    'name': product['name']
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

# ======================
# Delivery Count API (NEW ENDPOINTS)
# ======================

@app.route('/api/user/delivery-count', methods=['GET'])
def get_user_delivery_count():
    """Get user's delivery count for free delivery calculation"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        # Count ALL orders for this user (not just completed)
        delivery_count = mongo.db.orders.count_documents({
            'user_id': ObjectId(user_id)
            # Remove status filter to count all orders
        })

        return jsonify({
            'deliveryCount': delivery_count
        })
    except Exception as e:
        print(f"Error fetching delivery count: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/user/increment-delivery', methods=['POST'])
def increment_delivery_count():
    """Increment user's delivery count"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        # Increment the delivery_count field in user document
        result = mongo.db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$inc': {'delivery_count': 1}},
            upsert=True  # Create the field if it doesn't exist
        )

        if result.modified_count > 0 or result.upserted_id is not None:
            return jsonify({'message': 'Delivery count incremented'})
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        print(f"Error updating delivery count: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/user/orders', methods=['GET'])
def get_user_orders():
    """Get user's order history"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        orders = list(mongo.db.orders.find({
            'user_id': ObjectId(user_id)
        }).sort('created_at', -1))  # Most recent first

        # Get user's delivery count from orders (fallback)
        delivery_count = mongo.db.orders.count_documents({
            'user_id': ObjectId(user_id)
        })

        return jsonify({
            'orders': [serialize_doc(order) for order in orders],
            'deliveryCount': delivery_count,
            'freeDeliveriesLeft': max(0, 2 - delivery_count)
        })
    except Exception as e:
        print(f"Error fetching user orders: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# ======================
# FEEDBACK API ENDPOINTS - STORE IN DB ONLY
# ======================

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """Submit user feedback - Store in DB with user mobile, no follow-up"""
    try:
        data = request.json
        message = data.get('message', '').strip()

        if not message:
            return jsonify({'error': 'Feedback message is required'}), 400

        # Identify user if logged in
        user_id = session.get('user_id')
        user_mobile = session.get('user_mobile', 'Anonymous')

        feedback_entry = {
            'user_id': ObjectId(user_id) if user_id else None,
            'user_mobile': user_mobile,
            'message': message,
            'created_at': datetime.utcnow()
        }

        result = mongo.db.feedback.insert_one(feedback_entry)
        return jsonify({
            'message': 'Thank you for your feedback!',
            'feedback_id': str(result.inserted_id)
        }), 201

    except Exception as e:
        print(f"Error saving feedback: {e}")
        return jsonify({'error': 'Internal server error'}), 500
        
@app.before_request
def make_session_permanent():
    session.permanent = True

@app.before_request
def fix_session_cookies():
    """Fix duplicate session cookies issue"""
    # Debug cookie information
    cookie_count = request.headers.get('Cookie', '').count('session=')
    if cookie_count > 1:
        print(f"⚠️ Multiple session cookies detected: {cookie_count}")
        
    # Ensure session consistency
    if 'user_id' in session:
        # Verify the user_id is valid
        try:
            user = mongo.db.users.find_one({'_id': ObjectId(session['user_id'])})
            if not user:
                session.clear()
        except:
            session.clear()

@app.route('/api/cleanup-cookies', methods=['POST'])
def cleanup_cookies():
    """Clear duplicate cookies and establish clean session"""
    try:
        # Clear all sessions
        session.clear()
        
        response = jsonify({'message': 'Cookies cleaned up'})
        
        # Explicitly clear duplicate cookies
        response.set_cookie('session', '', expires=0, domain='.locallys.in')
        response.set_cookie('locally_session', '', expires=0, domain='.locallys.in')
        response.set_cookie('session', '', expires=0, domain='api.locallys.in')
        response.set_cookie('locally_session', '', expires=0, domain='api.locallys.in')
        
        return response
    except Exception as e:
        print(f"Cookie cleanup error: {e}")
        return jsonify({'error': 'Cleanup failed'}), 500

if __name__ == '__main__':
    app.run(debug=True)
