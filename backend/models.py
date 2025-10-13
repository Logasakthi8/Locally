from flask_pymongo import PyMongo
from bson import ObjectId
from datetime import datetime

class User:
    def __init__(self, mobile):
        self.mobile = mobile
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            "mobile": self.mobile,
            "created_at": self.created_at
        }

class Shop:
    def __init__(self, name, owner_mobile, category, opening_time, closing_time, image_url, address):
        self.name = name
        self.owner_mobile = owner_mobile
        self.category = category
        self.opening_time = opening_time
        self.closing_time = closing_time
        self.image_url = image_url
        self.address = address
    
    def to_dict(self):
        return {
            "name": self.name,
            "owner_mobile": self.owner_mobile,
            "category": self.category,
            "opening_time": self.opening_time,
            "closing_time": self.closing_time,
            "image_url": self.image_url,
            "address": self.address
        }

class Product:
    def __init__(self, shop_id, name, description, price, quantity, image_url):
        self.shop_id = shop_id
        self.name = name
        self.description = description
        self.price = price
        self.quantity = quantity
        self.image_url = image_url
    
    def to_dict(self):
        return {
            "shop_id": self.shop_id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "quantity": self.quantity,
            "image_url": self.image_url
        }

class Wishlist:
    def __init__(self, user_id, product_id, shop_id, quantity=1):
        self.user_id = user_id
        self.product_id = product_id
        self.shop_id = shop_id
        self.quantity = quantity
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'product_id': self.product_id,
            'shop_id': self.shop_id,
            'quantity': self.quantity,
            'created_at': self.created_at
        }

class Order:
    def __init__(self, user_id, items, total_amount=0, status='pending'):
        self.user_id = user_id
        self.items = items
        self.total_amount = total_amount
        self.status = status
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'items': self.items,
            'total_amount': self.total_amount,
            'status': self.status,
            'created_at': self.created_at
        }

class Review:
    def __init__(self, shop_id, user_id, rating, comment=""):
        self.shop_id = shop_id
        self.user_id = user_id
        self.rating = rating
        self.comment = comment
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "shop_id": self.shop_id,
            "user_id": self.user_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at
        }

# UPDATED FEEDBACK MODEL - With shop_name and shop_address
class Feedback:
    def __init__(self, shop_type, products=None, name=None, shop_name=None, shop_address=None, notify_me=False, 
                 contact=None, preference=None):
        self.shop_type = shop_type
        self.products = products
        self.name = name
        self.shop_name = shop_name  # Add this field
        self.shop_address = shop_address  # Add this field
        self.notify_me = notify_me
        self.contact = contact
        self.preference = preference
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'shop_type': self.shop_type,
            'products': self.products,
            'name': self.name,
            'shop_name': self.shop_name,  # Add this field
            'shop_address': self.shop_address,  # Add this field
            'notify_me': self.notify_me,
            'contact': self.contact,
            'preference': self.preference,
            'created_at': self.created_at
        }
