from . import db, BaseModel
from datetime import datetime

class Contract(BaseModel):
    """合同模型"""
    __tablename__ = 'contracts'
    
    # 基本信息
    contract_number = db.Column(db.String(50), unique=True, nullable=False, comment='合同编号')
    title = db.Column(db.String(200), nullable=False, comment='合同标题')
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, comment='客户ID')
    sales_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, comment='销售员ID')
    quote_id = db.Column(db.Integer, db.ForeignKey('quotes.id'), nullable=True, comment='关联报价ID')
    
    # 合同信息
    contract_date = db.Column(db.Date, default=datetime.utcnow().date, nullable=False, comment='合同日期')
    start_date = db.Column(db.Date, nullable=True, comment='合同开始日期')
    end_date = db.Column(db.Date, nullable=True, comment='合同结束日期')
    currency = db.Column(db.String(10), default='CNY', nullable=False, comment='币种')
    exchange_rate = db.Column(db.DECIMAL(10, 4), default=1.0000, comment='汇率')

    # 金额信息
    contract_amount = db.Column(db.DECIMAL(15, 2), nullable=False, comment='合同金额')
    paid_amount = db.Column(db.DECIMAL(15, 2), default=0.00, comment='已付金额')
    remaining_amount = db.Column(db.DECIMAL(15, 2), nullable=False, comment='剩余金额')
    
    # 状态信息
    status = db.Column(db.Enum('draft', 'pending', 'signed', 'executing', 'completed', 'terminated', name='contract_status'), 
                      default='draft', nullable=False, comment='合同状态')
    priority = db.Column(db.Enum('low', 'normal', 'high', 'urgent', name='contract_priority'), 
                        default='normal', nullable=False, comment='优先级')
    
    # 合同内容
    content = db.Column(db.Text, nullable=True, comment='合同内容')
    terms_conditions = db.Column(db.Text, nullable=True, comment='条款和条件')
    payment_terms = db.Column(db.Text, nullable=True, comment='付款条件')
    delivery_terms = db.Column(db.Text, nullable=True, comment='交付条件')
    warranty_terms = db.Column(db.Text, nullable=True, comment='保修条款')
    notes = db.Column(db.Text, nullable=True, comment='备注')
    
    # 签署信息
    signed_date = db.Column(db.DateTime, nullable=True, comment='签署日期')
    customer_signer = db.Column(db.String(100), nullable=True, comment='客户签署人')
    company_signer = db.Column(db.String(100), nullable=True, comment='公司签署人')
    
    # 文件信息
    contract_file_path = db.Column(db.String(500), nullable=True, comment='合同文件路径')
    signed_file_path = db.Column(db.String(500), nullable=True, comment='已签署文件路径')
    
    # 关联关系
    sales_user = db.relationship('User', backref='contracts', lazy=True)
    quote = db.relationship('Quote', backref='contracts', lazy=True)
    orders = db.relationship('Order', backref='contract', lazy=True)
    
    def __init__(self, title, customer_id, sales_user_id, contract_amount, **kwargs):
        self.title = title
        self.customer_id = customer_id
        self.sales_user_id = sales_user_id
        self.contract_amount = contract_amount
        self.remaining_amount = contract_amount
        self.contract_number = self.generate_contract_number()
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def generate_contract_number(self):
        """生成合同编号"""
        today = datetime.utcnow().strftime('%Y%m%d')
        # 查询今天已有的合同数量
        count = Contract.query.filter(
            Contract.contract_number.like(f'CT{today}%')
        ).count()
        return f'CT{today}{count + 1:04d}'
    
    def sign_contract(self, customer_signer, company_signer):
        """签署合同"""
        self.status = 'signed'
        self.signed_date = datetime.utcnow()
        self.customer_signer = customer_signer
        self.company_signer = company_signer
        db.session.commit()
    
    def start_execution(self):
        """开始执行合同"""
        if self.status == 'signed':
            self.status = 'executing'
            if not self.start_date:
                self.start_date = datetime.utcnow().date()
            db.session.commit()
    
    def complete_contract(self):
        """完成合同"""
        self.status = 'completed'
        if not self.end_date:
            self.end_date = datetime.utcnow().date()
        db.session.commit()
    
    def terminate_contract(self):
        """终止合同"""
        self.status = 'terminated'
        if not self.end_date:
            self.end_date = datetime.utcnow().date()
        db.session.commit()
    
    def add_payment(self, amount):
        """添加付款记录"""
        self.paid_amount += amount
        self.remaining_amount = self.contract_amount - self.paid_amount
        if self.remaining_amount <= 0:
            self.remaining_amount = 0
        db.session.commit()
    
    def get_payment_progress(self):
        """获取付款进度百分比"""
        if self.contract_amount > 0:
            return (self.paid_amount / self.contract_amount) * 100
        return 0
    
    def is_overdue(self):
        """检查是否逾期"""
        if self.end_date and self.status in ['signed', 'executing']:
            return datetime.utcnow().date() > self.end_date
        return False
    
    def to_dict(self):
        """转换为字典"""
        result = super().to_dict()
        result['payment_progress'] = self.get_payment_progress()
        result['is_overdue'] = self.is_overdue()
        if self.customer:
            result['customer_name'] = self.customer.name
        if self.sales_user:
            result['sales_user_name'] = self.sales_user.real_name or self.sales_user.username
        if self.quote:
            result['quote_number'] = self.quote.quote_number
        return result
    
    def __repr__(self):
        return f'<Contract {self.contract_number}>'