# Add these delivery count endpoints after your existing routes

@app.route('/api/user/delivery-count', methods=['GET'])
def get_user_delivery_count():
    """Get user's delivery count for free delivery calculation"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    
    try:
        # Count completed orders for this user
        delivery_count = mongo.db.orders.count_documents({
            'user_id': ObjectId(user_id),
            'status': 'completed'  # Only count completed orders
        })
        
        return jsonify({
            'deliveryCount': delivery_count
        })
    except Exception as e:
        print(f"Error fetching delivery count: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/user/increment-delivery-count', methods=['POST'])
def increment_delivery_count():
    """Increment user's delivery count (call this when order is completed)"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    
    try:
        # This endpoint doesn't actually increment a counter field
        # The delivery count is calculated dynamically from completed orders
        # This is just a placeholder for when you want to mark orders as completed
        return jsonify({
            'message': 'Delivery count tracking is handled by order status'
        })
    except Exception as e:
        print(f"Error updating delivery count: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Optional: Add an endpoint to mark orders as completed
@app.route('/api/orders/<order_id>/complete', methods=['PUT'])
def mark_order_completed(order_id):
    """Mark an order as completed to count towards delivery limit"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        # Update order status to completed
        result = mongo.db.orders.update_one(
            {
                '_id': ObjectId(order_id),
                'user_id': ObjectId(session['user_id'])
            },
            {'$set': {'status': 'completed'}}
        )
        
        if result.modified_count > 0:
            return jsonify({'message': 'Order marked as completed'})
        else:
            return jsonify({'error': 'Order not found'}), 404
    except Exception as e:
        print(f"Error marking order as completed: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Optional: Add an endpoint to get user's order history with delivery counts
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
        
        # Count completed orders for delivery tracking
        completed_orders_count = mongo.db.orders.count_documents({
            'user_id': ObjectId(user_id),
            'status': 'completed'
        })
        
        return jsonify({
            'orders': [serialize_doc(order) for order in orders],
            'completedDeliveries': completed_orders_count,
            'freeDeliveriesLeft': max(0, 2 - completed_orders_count)
        })
    except Exception as e:
        print(f"Error fetching user orders: {e}")
        return jsonify({'error': 'Internal server error'}), 500
