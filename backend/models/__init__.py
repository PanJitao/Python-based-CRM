from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# 创建数据库实例
db = SQLAlchemy()

class BaseModel(db.Model):
    """基础模型类，包含公共字段"""
    __abstract__ = True
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    
    def to_dict(self):
        """将模型转换为字典"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        return result
    
    def save(self):
        """保存模型到数据库"""
        db.session.add(self)
        db.session.commit()
        return self
    
    def delete(self):
        """软删除模型"""
        self.is_deleted = True
        self.updated_at = datetime.utcnow()
        db.session.commit()
        return self
    
    def hard_delete(self):
        """硬删除模型"""
        db.session.delete(self)
        db.session.commit()
        return True

# 导入所有模型
from .user import User
from .customer import Customer
from .quote import Quote, QuoteItem
from .contract import Contract
from .order import Order, OrderItem

__all__ = ['db', 'BaseModel', 'User', 'Customer', 'Quote', 'QuoteItem', 'Contract', 'Order', 'OrderItem']