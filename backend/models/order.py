from . import db, BaseModel
from datetime import datetime

class Order(BaseModel):
    """订单模型"""
    __tablename__ = 'orders'
    
    # 基本信息
    order_number = db.Column(db.String(50), unique=True, nullable=False, comment='订单号')
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, comment='客户ID')
    sales_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, comment='销售员ID')
    contract_id = db.Column(db.Integer, db.ForeignKey('contracts.id'), nullable=True, comment='关联合同ID')
    
    # 订单信息
    order_date = db.Column(db.Date, default=datetime.utcnow().date, nullable=False, comment='订单日期')
    required_date = db.Column(db.Date, nullable=True, comment='要求交付日期')
    shipped_date = db.Column(db.Date, nullable=True, comment='发货日期')
    delivery_date = db.Column(db.Date, nullable=True, comment='实际交付日期')
    currency = db.Column(db.String(10), default='CNY', nullable=False, comment='币种')
    exchange_rate = db.Column(db.DECIMAL(10, 4), default=1.0000, comment='汇率')

    # 金额信息
    subtotal = db.Column(db.DECIMAL(15, 2), default=0.00, comment='小计金额')
    discount_rate = db.Column(db.DECIMAL(5, 2), default=0.00, comment='折扣率')
    discount_amount = db.Column(db.DECIMAL(15, 2), default=0.00, comment='折扣金额')
    tax_rate = db.Column(db.DECIMAL(5, 2), default=0.00, comment='税率')
    tax_amount = db.Column(db.DECIMAL(15, 2), default=0.00, comment='税额')
    shipping_cost = db.Column(db.DECIMAL(15, 2), default=0.00, comment='运费')
    total_amount = db.Column(db.DECIMAL(15, 2), default=0.00, comment='总金额')
    
    # 状态信息
    status = db.Column(db.Enum('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', name='order_status'), 
                      default='pending', nullable=False, comment='订单状态')
    priority = db.Column(db.Enum('low', 'normal', 'high', 'urgent', name='order_priority'), 
                        default='normal', nullable=False, comment='优先级')
    
    # 配送信息
    shipping_method = db.Column(db.String(50), nullable=True, comment='配送方式')
    tracking_number = db.Column(db.String(100), nullable=True, comment='快递单号')
    shipping_address = db.Column(db.Text, nullable=True, comment='配送地址')
    shipping_contact = db.Column(db.String(100), nullable=True, comment='收货联系人')
    shipping_phone = db.Column(db.String(20), nullable=True, comment='收货电话')
    
    # 其他信息
    description = db.Column(db.Text, nullable=True, comment='订单描述')
    notes = db.Column(db.Text, nullable=True, comment='备注')
    internal_notes = db.Column(db.Text, nullable=True, comment='内部备注')
    
    # 关联关系
    sales_user = db.relationship('User', backref='orders', lazy=True)
    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, customer_id, sales_user_id, **kwargs):
        self.customer_id = customer_id
        self.sales_user_id = sales_user_id
        self.order_number = self.generate_order_number()
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def generate_order_number(self):
        """生成订单号"""
        today = datetime.utcnow().strftime('%Y%m%d')
        # 查询今天已有的订单数量
        count = Order.query.filter(
            Order.order_number.like(f'OD{today}%')
        ).count()
        return f'OD{today}{count + 1:04d}'
    
    def calculate_totals(self):
        """计算总金额"""
        # 计算小计
        self.subtotal = sum(item.total_price for item in self.order_items)
        
        # 计算折扣金额
        if self.discount_rate > 0:
            self.discount_amount = self.subtotal * (self.discount_rate / 100)
        
        # 计算税前金额
        amount_before_tax = self.subtotal - self.discount_amount
        
        # 计算税额
        if self.tax_rate > 0:
            self.tax_amount = amount_before_tax * (self.tax_rate / 100)
        
        # 计算总金额
        self.total_amount = amount_before_tax + self.tax_amount + self.shipping_cost
        
        db.session.commit()
    
    def confirm_order(self):
        """确认订单"""
        if self.status == 'pending':
            self.status = 'confirmed'
            db.session.commit()
    
    def start_processing(self):
        """开始处理订单"""
        if self.status == 'confirmed':
            self.status = 'processing'
            db.session.commit()
    
    def ship_order(self, tracking_number=None, shipping_method=None):
        """发货"""
        if self.status == 'processing':
            self.status = 'shipped'
            self.shipped_date = datetime.utcnow().date()
            if tracking_number:
                self.tracking_number = tracking_number
            if shipping_method:
                self.shipping_method = shipping_method
            db.session.commit()
    
    def deliver_order(self):
        """确认交付"""
        if self.status == 'shipped':
            self.status = 'delivered'
            self.delivery_date = datetime.utcnow().date()
            db.session.commit()
    
    def complete_order(self):
        """完成订单"""
        if self.status == 'delivered':
            self.status = 'completed'
            db.session.commit()
    
    def cancel_order(self):
        """取消订单"""
        if self.status in ['pending', 'confirmed', 'processing']:
            self.status = 'cancelled'
            db.session.commit()
    
    def is_overdue(self):
        """检查是否逾期"""
        if self.required_date and self.status not in ['delivered', 'completed', 'cancelled']:
            return datetime.utcnow().date() > self.required_date
        return False
    
    def get_delivery_progress(self):
        """获取交付进度"""
        status_progress = {
            'pending': 0,
            'confirmed': 20,
            'processing': 40,
            'shipped': 70,
            'delivered': 90,
            'completed': 100,
            'cancelled': 0
        }
        return status_progress.get(self.status, 0)
    
    def to_dict(self):
        """转换为字典"""
        result = super().to_dict()
        result['is_overdue'] = self.is_overdue()
        result['delivery_progress'] = self.get_delivery_progress()
        result['order_items'] = [item.to_dict() for item in self.order_items]
        if self.customer:
            result['customer_name'] = self.customer.name
        if self.sales_user:
            result['sales_user_name'] = self.sales_user.real_name or self.sales_user.username
        if self.contract:
            result['contract_number'] = self.contract.contract_number
        return result
    
    def __repr__(self):
        return f'<Order {self.order_number}>'

class OrderItem(BaseModel):
    """订单项目模型"""
    __tablename__ = 'order_items'
    
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, comment='订单ID')
    product_name = db.Column(db.String(200), nullable=False, comment='产品名称')
    product_code = db.Column(db.String(50), nullable=True, comment='产品编码')
    description = db.Column(db.Text, nullable=True, comment='产品描述')
    specification = db.Column(db.String(500), nullable=True, comment='规格')
    unit = db.Column(db.String(20), nullable=True, comment='单位')
    quantity = db.Column(db.DECIMAL(10, 2), nullable=False, comment='数量')
    unit_price = db.Column(db.DECIMAL(15, 2), nullable=False, comment='单价')
    total_price = db.Column(db.DECIMAL(15, 2), nullable=False, comment='总价')
    delivered_quantity = db.Column(db.DECIMAL(10, 2), default=0.00, comment='已交付数量')
    sort_order = db.Column(db.Integer, default=0, comment='排序')
    notes = db.Column(db.Text, nullable=True, comment='备注')
    
    def __init__(self, order_id, product_name, quantity, unit_price, **kwargs):
        self.order_id = order_id
        self.product_name = product_name
        self.quantity = quantity
        self.unit_price = unit_price
        self.total_price = quantity * unit_price
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def update_total_price(self):
        """更新总价"""
        self.total_price = self.quantity * self.unit_price
        db.session.commit()
    
    def deliver_quantity(self, delivered_qty):
        """交付数量"""
        if delivered_qty <= (self.quantity - self.delivered_quantity):
            self.delivered_quantity += delivered_qty
            db.session.commit()
            return True
        return False
    
    def get_remaining_quantity(self):
        """获取剩余未交付数量"""
        return self.quantity - self.delivered_quantity
    
    def is_fully_delivered(self):
        """检查是否完全交付"""
        return self.delivered_quantity >= self.quantity
    
    def to_dict(self):
        """转换为字典"""
        result = super().to_dict()
        result['remaining_quantity'] = self.get_remaining_quantity()
        result['is_fully_delivered'] = self.is_fully_delivered()
        return result
    
    def __repr__(self):
        return f'<OrderItem {self.product_name}>'