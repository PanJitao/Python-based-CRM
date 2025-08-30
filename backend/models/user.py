from . import db, BaseModel
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(BaseModel):
    """用户模型"""
    __tablename__ = 'users'
    
    username = db.Column(db.String(80), unique=True, nullable=False, comment='用户名')
    email = db.Column(db.String(120), unique=True, nullable=False, comment='邮箱')
    password_hash = db.Column(db.String(255), nullable=False, comment='密码哈希')
    real_name = db.Column(db.String(50), nullable=True, comment='真实姓名')
    phone = db.Column(db.String(20), nullable=True, comment='电话号码')
    department = db.Column(db.String(50), nullable=True, comment='部门')
    position = db.Column(db.String(50), nullable=True, comment='职位')
    role = db.Column(db.Enum('admin', 'manager', 'sales', 'user', name='user_roles'), 
                    default='user', nullable=False, comment='用户角色')
    status = db.Column(db.Enum('active', 'inactive', 'suspended', name='user_status'), 
                      default='active', nullable=False, comment='用户状态')
    last_login = db.Column(db.DateTime, nullable=True, comment='最后登录时间')
    avatar = db.Column(db.String(255), nullable=True, comment='头像URL')
    
    def __init__(self, username, email, password, **kwargs):
        self.username = username
        self.email = email
        self.set_password(password)
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def set_password(self, password):
        """设置密码"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """验证密码"""
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        """更新最后登录时间"""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self, include_sensitive=False):
        """转换为字典，默认不包含敏感信息"""
        result = super().to_dict()
        if not include_sensitive:
            result.pop('password_hash', None)
        return result
    
    def has_permission(self, permission):
        """检查用户权限"""
        role_permissions = {
            'admin': ['all'],
            'manager': ['read', 'write', 'delete', 'manage_team'],
            'sales': ['read', 'write', 'manage_own'],
            'user': ['read']
        }
        user_permissions = role_permissions.get(self.role, [])
        return permission in user_permissions or 'all' in user_permissions
    
    def __repr__(self):
        return f'<User {self.username}>'