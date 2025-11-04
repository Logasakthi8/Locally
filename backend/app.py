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

# Enhanced session configuration
app.config.update(
    SESSION_COOKIE_NAME='locally_session',
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_PATH='/',
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),
    SESSION_REFRESH_EACH_REQUEST=True
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
# FIXED LOGOUT ENDPOINT
# ======================

@app.route('/api/logout', methods=['POST'])
def logout():
    """Comprehensive logout that clears session and cookies"""
    try:
        print("🔄 Starting logout process...")
        print(f"📋 Session before logout: {dict(session)}")
        
        # Get user info before clearing for logging
        user_id = session.get('user_id')
        user_mobile = session.get('user_mobile')
        
        # Clear the session data
        session.clear()
        
        # Create response
        response = jsonify({
            'message': 'Logged out successfully', 
            'success': True
        })
        
        # Expire the session cookie by setting max_age=0
        response.set_cookie(
            'session',  # Flask's default session cookie name
            '',
            max_age=0,
            expires=0,
            path='/',
            httponly=True,
            secure=True,
            samesite='None'
        )
        
        # Also expire the specific session cookie if using custom name
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

# ======================
# ENHANCED SESSION CHECK
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

# ======================
# OPTIMIZED AUTH ENDPOINTS
# ======================
@app.route('/api/auth/mobile', methods=['POST'])
def auth_mobile():
    """Working version without User model dependency"""
    try:
        data = request.get_json()
        mobile = data.get('mobile')
        
        if not mobile or len(mobile) != 10 or not mobile.isdigit():
            return jsonify({'error': 'Valid 10-digit mobile number is required'}), 400
        
        current_time = datetime.utcnow()
        
        # Check if user exists
        user = mongo.db.users.find_one({'mobile': mobile})
        
        if user:
            # Update last login for existing user
            mongo.db.users.update_one(
                {'_id': user['_id']},
                {'$set': {'lastLogin': current_time}}
            )
            is_new_user = False
            message = 'Welcome back!'
        else:
            # Create new user without User model
            user_data = {
                'mobile': mobile,
                'createdAt': current_time,
                'lastLogin': current_time,
                'delivery_count': 0
            }
            result = mongo.db.users.insert_one(user_data)
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
        traceback.print_exc()  # This will show the full error
        return jsonify({'error': 'Authentication failed'}), 500

@app.route('/api/debug-session', methods=['GET'])
def debug_session():
    """Debug endpoint to check session state"""
    return jsonify({
        'session_data': dict(session),
        'cookies_received': dict(request.cookies),
        'user_agent': request.headers.get('User-Agent')
    })

# ALL YOUR EXISTING ENDPOINTS BELOW (UNCHANGED)
@app.route('/')
def home():
    return jsonify({"message": "Shopping App API is running!"})

@app.route('/api/check-user', methods=['POST'])
def check_user():
    """Ultra-fast user existence check"""
    try:
        data = request.get_json()
        mobile = data.get('mobile')
        
        if not mobile or len(mobile) != 10 or not mobile.isdigit():
            return jsonify({'error': 'Valid 10-digit mobile number is required'}), 400
        
        user = mongo.db.users.find_one({'mobile': mobile}, {'_id': 1})
        
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

# ... ALL YOUR OTHER EXISTING ENDPOINTS REMAIN EXACTLY THE SAME ...

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

# ... CONTINUE WITH ALL YOUR OTHER ENDPOINTS EXACTLY AS THEY WERE ...

if __name__ == '__main__':
    app.run(debug=True)
