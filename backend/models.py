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
    def __init__(self, name, owner_mobile, category, opening_time, closing_time, image_url,address):
        self.name = name
        self.owner_mobile = owner_mobile
        self.category = category
        self.opening_time = opening_time
        self.closing_time = closing_time
        self.image_url = image_url
        self.address=address
    
    def to_dict(self):
        return {
            "name": self.name,
            "owner_mobile": self.owner_mobile,
            "category": self.category,
            "opening_time": self.opening_time,
            "closing_time": self.closing_time,
            "image_url": self.image_url,
            "address":self.address
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
    def __init__(self, user_id, product_id):
        self.user_id = user_id
        self.product_id = product_id
        self.added_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "product_id": self.product_id,
            "added_at": self.added_at
        }

class Order:
    def __init__(self, user_id, items, status="pending"):
        self.user_id = user_id
        self.items = items
        self.status = status
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "items": self.items,
            "status": self.status,
            "created_at": self.created_at
        }
