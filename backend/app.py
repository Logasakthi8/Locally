from flask import Flask, jsonify, request, session
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv
from models import User, Shop, Product, Wishlist, Order

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'fallback-secret-key-for-development')

# Configure for production
mongo_uri = os.getenv('MONGO_URI')
if not mongo_uri:
    raise ValueError("No MONGO_URI set for MongoDB connection")

app.config["MONGO_URI"] = mongo_uri

# Configure CORS for production
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
CORS(app, resources={r"/api/*": {"origins": frontend_url}}, supports_credentials=True)

mongo = PyMongo(app)

# Add this to handle both development and production
@app.route('/')
def home():
    return jsonify({"message": "Shopping App API is running!"})

# Helper function to serialize ObjectId
def serialize_doc(doc):
    if doc is None:
        return None
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

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

@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    wishlist_items = list(mongo.db.wishlist.find({'user_id': ObjectId(user_id)}))
    
    product_ids = [ObjectId(item['product_id']) for item in wishlist_items]
    products = list(mongo.db.products.find({'_id': {'$in': product_ids}}))
    
    return jsonify([serialize_doc(product) for product in products])

@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    product_id = data.get('product_id')
    
    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400
    
    user_id = session['user_id']
    
    # Check if already in wishlist
    existing = mongo.db.wishlist.find_one({
        'user_id': ObjectId(user_id),
        'product_id': ObjectId(product_id)
    })
    
    if existing:
        return jsonify({'message': 'Product already in wishlist'})
    
    wishlist_item = Wishlist(ObjectId(user_id), ObjectId(product_id))
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
        # Convert product_ids to ObjectId
        product_object_ids = []
        for pid in product_ids:
            try:
                product_object_ids.append(ObjectId(pid))
            except:
                return jsonify({'error': f'Invalid product ID format: {pid}'}), 400
        
        # Get products
        products = list(mongo.db.products.find({'_id': {'$in': product_object_ids}}))
        
        if not products:
            return jsonify({'error': 'No products found with the provided IDs'}), 404
        
        # Find shop owner mobile numbers
        shop_ids = []
        for product in products:
            try:
                # Try to convert shop_id to ObjectId if it's a string
                if isinstance(product['shop_id'], str):
                    shop_ids.append(ObjectId(product['shop_id']))
                else:
                    shop_ids.append(product['shop_id'])
            except Exception as e:
                print(f"Error processing shop_id: {e}")
                # If conversion fails, try using as string
                shop_ids.append(product['shop_id'])
        
        # Remove duplicates
        shop_ids = list(set(shop_ids))
        
        # Find shops
        shops = []
        for shop_id in shop_ids:
            try:
                if isinstance(shop_id, ObjectId):
                    shop = mongo.db.shops.find_one({'_id': shop_id})
                else:
                    # Try both ObjectId and string formats
                    try:
                        shop = mongo.db.shops.find_one({'_id': ObjectId(shop_id)})
                    except:
                        shop = mongo.db.shops.find_one({'_id': shop_id})
                
                if shop:
                    shops.append(shop)
            except Exception as e:
                print(f"Error finding shop {shop_id}: {e}")
        
        if not shops:
            return jsonify({'error': 'No shops found for these products'}), 404
        
        shop_owner_mobiles = [shop.get('owner_mobile') for shop in shops if shop.get('owner_mobile')]
        
        if not shop_owner_mobiles:
            return jsonify({'error': 'No shop owner mobile numbers found'}), 404
        
        # Create order
        order_items = [{'product_id': pid} for pid in product_object_ids]
        order = {
            'user_id': ObjectId(user_id),
            'items': order_items,
            'status': 'pending',
            'created_at': datetime.utcnow()
        }
        
        order_result = mongo.db.orders.insert_one(order)
        
        return jsonify({
            'message': 'Order placed successfully',
            'shop_owner_mobiles': shop_owner_mobiles,
            'order_id': str(order_result.inserted_id)
        })
    except Exception as e:
        print(f"Checkout error: {e}")
        return jsonify({'error': str(e)}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear-cart', methods=['POST'])
def clear_cart():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    
    try:
        result = mongo.db.wishlist.delete_many({'user_id': ObjectId(user_id)})
        return jsonify({
            'message': f'Cart cleared successfully',
            'deleted_count': result.deleted_count
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
    
@app.route('/api/debug/checkout', methods=['POST'])
def debug_checkout():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    product_ids = data.get('product_ids', [])
    
    debug_info = {
        'user_id': session['user_id'],
        'product_ids_received': product_ids,
        'product_count': len(product_ids),
        'step_1': 'Converting product IDs to ObjectId'
    }
    
    try:
        # Convert product_ids to ObjectId
        product_object_ids = []
        for pid in product_ids:
            try:
                product_object_ids.append(ObjectId(pid))
                debug_info[f'product_{pid}'] = 'Converted successfully'
            except Exception as e:
                debug_info[f'product_{pid}'] = f'Conversion failed: {str(e)}'
        
        debug_info['step_2'] = 'Finding products in database'
        
        # Get products
        products = list(mongo.db.products.find({'_id': {'$in': product_object_ids}}))
        debug_info['products_found'] = len(products)
        debug_info['product_details'] = [serialize_doc(p) for p in products]
        
        debug_info['step_3'] = 'Extracting shop IDs'
        
        # Find shop owner mobile numbers
        shop_ids = []
        for product in products:
            shop_id = product.get('shop_id')
            shop_ids.append(shop_id)
            debug_info[f'shop_id_{str(product["_id"])}'] = {
                'value': str(shop_id),
                'type': type(shop_id).__name__
            }
        
        # Remove duplicates
        shop_ids = list(set(shop_ids))
        debug_info['unique_shop_ids'] = [str(sid) for sid in shop_ids]
        
        debug_info['step_4'] = 'Finding shops'
        
        # Find shops
        shops = []
        for shop_id in shop_ids:
            try:
                if isinstance(shop_id, ObjectId):
                    shop = mongo.db.shops.find_one({'_id': shop_id})
                else:
                    # Try both ObjectId and string formats
                    try:
                        shop = mongo.db.shops.find_one({'_id': ObjectId(shop_id)})
                    except:
                        shop = mongo.db.shops.find_one({'_id': shop_id})
                
                if shop:
                    shops.append(shop)
                    debug_info[f'shop_{str(shop_id)}'] = 'Found'
                else:
                    debug_info[f'shop_{str(shop_id)}'] = 'Not found'
            except Exception as e:
                debug_info[f'shop_{str(shop_id)}'] = f'Error: {str(e)}'
        
        debug_info['shops_found'] = len(shops)
        debug_info['shop_details'] = [serialize_doc(s) for s in shops]
        
        shop_owner_mobiles = [shop.get('owner_mobile') for shop in shops if shop.get('owner_mobile')]
        debug_info['shop_owner_mobiles'] = shop_owner_mobiles
        
        return jsonify(debug_info)
    except Exception as e:
        debug_info['error'] = str(e)
        return jsonify(debug_info), 500

if __name__ == '__main__':
    app.run(debug=True)
