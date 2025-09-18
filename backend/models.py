from flask_pymongo import PyMongo
from datetime import datetime
from bson import ObjectId


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
    def __init__(self, name, owner_mobile, address=None):
        self.name = name
        self.owner_mobile = owner_mobile
        self.address = address
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "name": self.name,
            "owner_mobile": self.owner_mobile,
            "address": self.address,
            "created_at": self.created_at
        }


class Product:
    def __init__(self, shop_id, name, price, description=None, image=None):
        self.shop_id = shop_id if isinstance(shop_id, ObjectId) else ObjectId(shop_id)
        self.name = name
        self.price = price
        self.description = description
        self.image = image
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "shop_id": self.shop_id,
            "name": self.name,
            "price": self.price,
            "description": self.description,
            "image": self.image,
            "created_at": self.created_at
        }


class Wishlist:
    def __init__(self, user_id, product_id, shop_id, quantity=1):
        self.user_id = user_id if isinstance(user_id, ObjectId) else ObjectId(user_id)
        self.product_id = product_id if isinstance(product_id, ObjectId) else ObjectId(product_id)
        # keep shop_id flexible (can be ObjectId or string)
        try:
            self.shop_id = shop_id if isinstance(shop_id, ObjectId) else ObjectId(shop_id)
        except:
            self.shop_id = shop_id
        self.quantity = quantity
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "product_id": self.product_id,
            "shop_id": self.shop_id,
            "quantity": self.quantity,
            "created_at": self.created_at
        }


class Order:
    def __init__(self, user_id, items, shop_id=None, total_amount=0, status="pending"):
        self.user_id = user_id if isinstance(user_id, ObjectId) else ObjectId(user_id)
        # items is a list of dicts: { product_id, quantity?, price? }
        self.items = items
        self.shop_id = shop_id if shop_id else None
        self.total_amount = total_amount
        self.status = status
        self.created_at = datetime.utcnow()

    def to_dict(self):
        order_dict = {
            "user_id": self.user_id,
            "items": self.items,
            "total_amount": self.total_amount,
            "status": self.status,
            "created_at": self.created_at
        }
        if self.shop_id:
            order_dict["shop_id"] = self.shop_id
        return order_dict


class Review:
    def __init__(self, shop_id, user_id, rating, comment=""):
        self.shop_id = shop_id if isinstance(shop_id, ObjectId) else str(shop_id)
        self.user_id = user_id if isinstance(user_id, ObjectId) else ObjectId(user_id)
        self.rating = int(rating)
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
