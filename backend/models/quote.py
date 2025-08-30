from . import db, BaseModel
from datetime import datetime, timedelta

class Quote(BaseModel):
    """报价模型"""
    __tablename__ = 'quotes'
    
    # 基本信息
    quote_number = db.Column(db.String(50), unique=True, nullable=False, comment='报价单号')
    title = db.Column(db.String(200), nullable=False, comment='报价标题')
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, comment='客户ID')
    sales_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, comment='销售员ID')
    
    # 报价信息
    quote_date = db.Column(db.Date, default=datetime.utcnow().date, nullable=False, comment='报价日期')
    valid_until = db.Column(db.Date, nullable=True, comment='有效期至')
    currency = db.Column(db.String(10), default='CNY', nullable=False, comment='币种')
    exchange_rate = db.Column(db.DECIMAL(10, 4), default=1.0000, comment='汇率')

    # 金额信息
    subtotal = db.Column(db.DECIMAL(15, 2), default=0.00, comment='小计金额')
    discount_rate = db.Column(db.DECIMAL(5, 2), default=0.00, comment='折扣率')
    discount_amount = db.Column(db.DECIMAL(15, 2), default=0.00, comment='折扣金额')
    tax_rate = db.Column(db.DECIMAL(5, 2), default=0.00, comment='税率')
    tax_amount = db.Column(db.DECIMAL(15, 2), default=0.00, comment='税额')
    total_amount = db.Column(db.DECIMAL(15, 2), default=0.00, comment='总金额')
    
    # 状态信息
    status = db.Column(db.Enum('draft', 'sent', 'accepted', 'rejected', 'expired', name='quote_status'), 
                      default='draft', nullable=False, comment='报价状态')
    priority = db.Column(db.Enum('low', 'normal', 'high', 'urgent', name='quote_priority'), 
                        default='normal', nullable=False, comment='优先级')
    
    # 其他信息
    description = db.Column(db.Text, nullable=True, comment='报价描述')
    terms_conditions = db.Column(db.Text, nullable=True, comment='条款和条件')
    notes = db.Column(db.Text, nullable=True, comment='备注')
    
    # 时间信息
    sent_date = db.Column(db.DateTime, nullable=True, comment='发送日期')
    response_date = db.Column(db.DateTime, nullable=True, comment='客户回复日期')
    
    # 关联关系
    sales_user = db.relationship('User', backref='quotes', lazy=True)
    quote_items = db.relationship('QuoteItem', backref='quote', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, title, customer_id, sales_user_id, **kwargs):
        self.title = title
        self.customer_id = customer_id
        self.sales_user_id = sales_user_id
        self.quote_number = self.generate_quote_number()
        # 默认有效期30天
        self.valid_until = (datetime.utcnow() + timedelta(days=30)).date()
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def generate_quote_number(self):
        """生成报价单号"""
        today = datetime.utcnow().strftime('%Y%m%d')
        # 查询今天已有的报价数量
        count = Quote.query.filter(
            Quote.quote_number.like(f'QT{today}%')
        ).count()
        return f'QT{today}{count + 1:04d}'
    
    def calculate_totals(self):
        """计算总金额"""
        # 计算小计
        self.subtotal = sum(item.total_price for item in self.quote_items)
        
        # 计算折扣金额
        if self.discount_rate > 0:
            self.discount_amount = self.subtotal * (self.discount_rate / 100)
        
        # 计算税前金额
        amount_before_tax = self.subtotal - self.discount_amount
        
        # 计算税额
        if self.tax_rate > 0:
            self.tax_amount = amount_before_tax * (self.tax_rate / 100)
        
        # 计算总金额
        self.total_amount = amount_before_tax + self.tax_amount
        
        db.session.commit()
    
    def send_quote(self):
        """发送报价"""
        self.status = 'sent'
        self.sent_date = datetime.utcnow()
        db.session.commit()
    
    def accept_quote(self):
        """接受报价"""
        self.status = 'accepted'
        self.response_date = datetime.utcnow()
        db.session.commit()
    
    def reject_quote(self):
        """拒绝报价"""
        self.status = 'rejected'
        self.response_date = datetime.utcnow()
        db.session.commit()
    
    def is_expired(self):
        """检查是否过期"""
        if self.valid_until:
            return datetime.utcnow().date() > self.valid_until
        return False
    
    def to_dict(self):
        """转换为字典"""
        result = super().to_dict()
        result['is_expired'] = self.is_expired()
        result['quote_items'] = [item.to_dict() for item in self.quote_items]
        if self.customer:
            result['customer_name'] = self.customer.name
        if self.sales_user:
            result['sales_user_name'] = self.sales_user.real_name or self.sales_user.username
        return result
    
    def __repr__(self):
        return f'<Quote {self.quote_number}>'

class QuoteItem(BaseModel):
    """报价项目模型"""
    __tablename__ = 'quote_items'
    
    quote_id = db.Column(db.Integer, db.ForeignKey('quotes.id'), nullable=False, comment='报价ID')
    product_name = db.Column(db.String(200), nullable=False, comment='产品名称')
    product_code = db.Column(db.String(50), nullable=True, comment='产品编码')
    description = db.Column(db.Text, nullable=True, comment='产品描述')
    specification = db.Column(db.String(500), nullable=True, comment='规格')
    unit = db.Column(db.String(20), nullable=True, comment='单位')
    quantity = db.Column(db.DECIMAL(10, 2), nullable=False, comment='数量')
    unit_price = db.Column(db.DECIMAL(15, 2), nullable=False, comment='单价')
    total_price = db.Column(db.DECIMAL(15, 2), nullable=False, comment='总价')
    sort_order = db.Column(db.Integer, default=0, comment='排序')
    notes = db.Column(db.Text, nullable=True, comment='备注')
    
    def __init__(self, quote_id, product_name, quantity, unit_price, **kwargs):
        self.quote_id = quote_id
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
    
    def __repr__(self):
        return f'<QuoteItem {self.product_name}>'