from . import db, BaseModel
from datetime import datetime

class Customer(BaseModel):
    """客户模型"""
    __tablename__ = 'customers'
    
    # 基本信息
    name = db.Column(db.String(100), nullable=False, comment='客户名称')
    company = db.Column(db.String(200), nullable=True, comment='公司名称')
    industry = db.Column(db.String(100), nullable=True, comment='所属行业')
    customer_type = db.Column(db.Enum('individual', 'enterprise', name='customer_types'), 
                             default='individual', nullable=False, comment='客户类型')
    
    # 联系信息
    contact_person = db.Column(db.String(50), nullable=True, comment='联系人')
    phone = db.Column(db.String(20), nullable=True, comment='电话号码')
    mobile = db.Column(db.String(20), nullable=True, comment='手机号码')
    email = db.Column(db.String(120), nullable=True, comment='邮箱')
    fax = db.Column(db.String(20), nullable=True, comment='传真')
    website = db.Column(db.String(200), nullable=True, comment='网站')
    
    # 地址信息
    address = db.Column(db.Text, nullable=True, comment='详细地址')
    city = db.Column(db.String(50), nullable=True, comment='城市')
    province = db.Column(db.String(50), nullable=True, comment='省份')
    country = db.Column(db.String(50), default='中国', comment='国家')
    postal_code = db.Column(db.String(10), nullable=True, comment='邮政编码')
    
    # 业务信息
    source = db.Column(db.String(50), nullable=True, comment='客户来源')
    level = db.Column(db.Enum('A', 'B', 'C', 'D', name='customer_levels'), 
                     default='C', nullable=False, comment='客户等级')
    status = db.Column(db.Enum('potential', 'active', 'inactive', 'lost', name='customer_status'), 
                      default='potential', nullable=False, comment='客户状态')
    credit_limit = db.Column(db.DECIMAL(15, 2), default=0.00, comment='信用额度')
    
    # 销售信息
    sales_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, comment='负责销售员ID')
    first_contact_date = db.Column(db.Date, nullable=True, comment='首次接触日期')
    last_contact_date = db.Column(db.Date, nullable=True, comment='最后接触日期')
    next_follow_date = db.Column(db.Date, nullable=True, comment='下次跟进日期')
    
    # 备注信息
    description = db.Column(db.Text, nullable=True, comment='客户描述')
    notes = db.Column(db.Text, nullable=True, comment='备注信息')
    tags = db.Column(db.String(500), nullable=True, comment='标签（逗号分隔）')
    
    # 关联关系
    sales_user = db.relationship('User', backref='customers', lazy=True)
    quotes = db.relationship('Quote', backref='customer', lazy=True)
    contracts = db.relationship('Contract', backref='customer', lazy=True)
    orders = db.relationship('Order', backref='customer', lazy=True)
    
    def __init__(self, name, **kwargs):
        self.name = name
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def update_last_contact(self):
        """更新最后接触日期"""
        self.last_contact_date = datetime.utcnow().date()
        db.session.commit()
    
    def get_tags_list(self):
        """获取标签列表"""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []
    
    def set_tags_list(self, tags_list):
        """设置标签列表"""
        if tags_list:
            self.tags = ','.join([tag.strip() for tag in tags_list if tag.strip()])
        else:
            self.tags = None
    
    def to_dict(self):
        """转换为字典"""
        result = super().to_dict()
        result['tags_list'] = self.get_tags_list()
        if self.sales_user:
            result['sales_user_name'] = self.sales_user.real_name or self.sales_user.username
        return result
    
    def __repr__(self):
        return f'<Customer {self.name}>'