import uuid
from datetime import datetime
from app.extensions import db

def gen_uuid(): return str(uuid.uuid4())

class Order(db.Model):
    __tablename__ = "orders"
    id               = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id          = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total            = db.Column(db.Float, nullable=False)
    status           = db.Column(db.String(50), default="pending")
    shipping_address = db.Column(db.JSON, nullable=True)
    payment_method   = db.Column(db.String(100), nullable=True)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)

    user        = db.relationship("User",      back_populates="orders")
    order_items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "userId": self.user_id, "total": self.total,
                "status": self.status, "shippingAddress": self.shipping_address,
                "paymentMethod": self.payment_method,
                "createdAt": self.created_at.isoformat(),
                "items": [i.to_dict() for i in self.order_items]}


class OrderItem(db.Model):
    __tablename__ = "order_items"
    id       = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    order_id = db.Column(db.String(36), db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    book_id  = db.Column(db.String(36), db.ForeignKey("books.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price    = db.Column(db.Float, nullable=False)

    order = db.relationship("Order", back_populates="order_items")
    book  = db.relationship("Book",  back_populates="order_items")

    def to_dict(self):
        return {"bookId": self.book_id, "quantity": self.quantity, "price": self.price}