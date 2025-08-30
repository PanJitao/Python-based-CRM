# -*- coding: utf-8 -*-
"""
CRM销售平台 - 数据验证工具

提供各种数据验证功能
"""

import re
import logging
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from decimal import Decimal, InvalidOperation

class ValidationError(Exception):
    """
    验证错误异常
    """
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(message)

class Validator:
    """
    数据验证器
    
    提供各种数据验证方法
    """
    
    def __init__(self):
        """
        初始化验证器
        """
        self.logger = logging.getLogger(__name__)
        self.errors = []
    
    def reset_errors(self):
        """
        重置错误列表
        """
        self.errors = []
    
    def add_error(self, field: str, message: str):
        """
        添加错误
        
        Args:
            field: 字段名
            message: 错误消息
        """
        self.errors.append({
            'field': field,
            'message': message
        })
    
    def has_errors(self) -> bool:
        """
        是否有错误
        
        Returns:
            bool: 有错误返回True
        """
        return len(self.errors) > 0
    
    def get_errors(self) -> List[Dict[str, str]]:
        """
        获取错误列表
        
        Returns:
            List[Dict[str, str]]: 错误列表
        """
        return self.errors
    
    def validate_required(self, value: Any, field: str) -> bool:
        """
        验证必填字段
        
        Args:
            value: 值
            field: 字段名
            
        Returns:
            bool: 验证通过返回True
        """
        if value is None or (isinstance(value, str) and value.strip() == ''):
            self.add_error(field, f'{field}是必填字段')
            return False
        return True
    
    def validate_string(self, value: Any, field: str, min_length: int = 0, max_length: int = None) -> bool:
        """
        验证字符串
        
        Args:
            value: 值
            field: 字段名
            min_length: 最小长度
            max_length: 最大长度
            
        Returns:
            bool: 验证通过返回True
        """
        if value is None:
            return True
        
        if not isinstance(value, str):
            self.add_error(field, f'{field}必须是字符串')
            return False
        
        length = len(value)
        
        if length < min_length:
            self.add_error(field, f'{field}长度不能少于{min_length}个字符')
            return False
        
        if max_length is not None and length > max_length:
            self.add_error(field, f'{field}长度不能超过{max_length}个字符')
            return False
        
        return True
    
    def validate_email(self, value: Any, field: str) -> bool:
        """
        验证邮箱
        
        Args:
            value: 值
            field: 字段名
            
        Returns:
            bool: 验证通过返回True
        """
        if value is None or value == '':
            return True
        
        if not isinstance(value, str):
            self.add_error(field, f'{field}必须是字符串')
            return False
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            self.add_error(field, f'{field}格式不正确')
            return False
        
        return True
    
    def validate_phone(self, value: Any, field: str) -> bool:
        """
        验证手机号
        
        Args:
            value: 值
            field: 字段名
            
        Returns:
            bool: 验证通过返回True
        """
        if value is None or value == '':
            return True
        
        if not isinstance(value, str):
            self.add_error(field, f'{field}必须是字符串')
            return False
        
        # 中国手机号格式
        phone_pattern = r'^1[3-9]\d{9}$'
        if not re.match(phone_pattern, value):
            self.add_error(field, f'{field}格式不正确')
            return False
        
        return True
    
    def validate_integer(self, value: Any, field: str, min_value: int = None, max_value: int = None) -> bool:
        """
        验证整数
        
        Args:
            value: 值
            field: 字段名
            min_value: 最小值
            max_value: 最大值
            
        Returns:
            bool: 验证通过返回True
        """
        if value is None:
            return True
        
        try:
            int_value = int(value)
        except (ValueError, TypeError):
            self.add_error(field, f'{field}必须是整数')
            return False
        
        if min_value is not None and int_value < min_value:
            self.add_error(field, f'{field}不能小于{min_value}')
            return False
        
        if max_value is not None and int_value > max_value:
            self.add_error(field, f'{field}不能大于{max_value}')
            return False
        
        return True
    
    def validate_decimal(self, value: Any, field: str, min_value: Decimal = None, max_value: Decimal = None, decimal_places: int = 2) -> bool:
        """
        验证小数
        
        Args:
            value: 值
            field: 字段名
            min_value: 最小值
            max_value: 最大值
            decimal_places: 小数位数
            
        Returns:
            bool: 验证通过返回True
        """
        if value is None:
            return True
        
        try:
            decimal_value = Decimal(str(value))
        except (InvalidOperation, ValueError, TypeError):
            self.add_error(field, f'{field}必须是有效的数字')
            return False
        
        # 检查小数位数
        if decimal_value.as_tuple().exponent < -decimal_places:
            self.add_error(field, f'{field}小数位数不能超过{decimal_places}位')
            return False
        
        if min_value is not None and decimal_value < min_value:
            self.add_error(field, f'{field}不能小于{min_value}')
            return False
        
        if max_value is not None and decimal_value > max_value:
            self.add_error(field, f'{field}不能大于{max_value}')
            return False
        
        return True
    
    def validate_date(self, value: Any, field: str, date_format: str = '%Y-%m-%d') -> bool:
        """
        验证日期
        
        Args:
            value: 值
            field: 字段名
            date_format: 日期格式
            
        Returns:
            bool: 验证通过返回True
        """
        if value is None or value == '':
            return True
        
        if isinstance(value, datetime):
            return True
        
        if not isinstance(value, str):
            self.add_error(field, f'{field}必须是字符串或日期对象')
            return False
        
        try:
            datetime.strptime(value, date_format)
        except ValueError:
            self.add_error(field, f'{field}日期格式不正确，应为{date_format}')
            return False
        
        return True
    
    def validate_choice(self, value: Any, field: str, choices: List[Any]) -> bool:
        """
        验证选择项
        
        Args:
            value: 值
            field: 字段名
            choices: 可选值列表
            
        Returns:
            bool: 验证通过返回True
        """
        if value is None:
            return True
        
        if value not in choices:
            self.add_error(field, f'{field}必须是以下值之一: {", ".join(map(str, choices))}')
            return False
        
        return True
    
    def validate_url(self, value: Any, field: str) -> bool:
        """
        验证URL
        
        Args:
            value: 值
            field: 字段名
            
        Returns:
            bool: 验证通过返回True
        """
        if value is None or value == '':
            return True
        
        if not isinstance(value, str):
            self.add_error(field, f'{field}必须是字符串')
            return False
        
        url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        if not re.match(url_pattern, value, re.IGNORECASE):
            self.add_error(field, f'{field}URL格式不正确')
            return False
        
        return True
    
    def validate_json(self, value: Any, field: str) -> bool:
        """
        验证JSON
        
        Args:
            value: 值
            field: 字段名
            
        Returns:
            bool: 验证通过返回True
        """
        if value is None:
            return True
        
        if isinstance(value, (dict, list)):
            return True
        
        if not isinstance(value, str):
            self.add_error(field, f'{field}必须是有效的JSON字符串')
            return False
        
        try:
            import json
            json.loads(value)
        except (ValueError, TypeError):
            self.add_error(field, f'{field}不是有效的JSON格式')
            return False
        
        return True

class CustomerValidator(Validator):
    """
    客户数据验证器
    """
    
    def validate_customer_data(self, data: Dict[str, Any]) -> bool:
        """
        验证客户数据
        
        Args:
            data: 客户数据
            
        Returns:
            bool: 验证通过返回True
        """
        self.reset_errors()
        
        # 必填字段
        self.validate_required(data.get('name'), 'name')
        
        # 字符串字段
        self.validate_string(data.get('name'), 'name', max_length=100)
        self.validate_string(data.get('company'), 'company', max_length=200)
        self.validate_string(data.get('position'), 'position', max_length=100)
        self.validate_string(data.get('industry'), 'industry', max_length=100)
        self.validate_string(data.get('source'), 'source', max_length=100)
        self.validate_string(data.get('address'), 'address', max_length=500)
        self.validate_string(data.get('notes'), 'notes', max_length=1000)
        
        # 邮箱
        self.validate_email(data.get('email'), 'email')
        
        # 手机号
        self.validate_phone(data.get('phone'), 'phone')
        
        # 状态
        status_choices = ['潜在客户', '意向客户', '成交客户', '流失客户']
        self.validate_choice(data.get('status'), 'status', status_choices)
        
        # 重要程度
        importance_choices = ['低', '中', '高']
        self.validate_choice(data.get('importance'), 'importance', importance_choices)
        
        return not self.has_errors()

class QuoteValidator(Validator):
    """
    报价数据验证器
    """
    
    def validate_quote_data(self, data: Dict[str, Any]) -> bool:
        """
        验证报价数据
        
        Args:
            data: 报价数据
            
        Returns:
            bool: 验证通过返回True
        """
        self.reset_errors()
        
        # 必填字段
        self.validate_required(data.get('customer_id'), 'customer_id')
        self.validate_required(data.get('title'), 'title')
        self.validate_required(data.get('total_amount'), 'total_amount')
        
        # 整数字段
        self.validate_integer(data.get('customer_id'), 'customer_id', min_value=1)
        
        # 字符串字段
        self.validate_string(data.get('title'), 'title', max_length=200)
        self.validate_string(data.get('description'), 'description', max_length=1000)
        self.validate_string(data.get('notes'), 'notes', max_length=1000)
        
        # 金额
        self.validate_decimal(data.get('total_amount'), 'total_amount', min_value=Decimal('0'))
        
        # 状态
        status_choices = ['草稿', '已发送', '已接受', '已拒绝', '已过期']
        self.validate_choice(data.get('status'), 'status', status_choices)
        
        # 有效期
        self.validate_date(data.get('valid_until'), 'valid_until')
        
        return not self.has_errors()

class ContractValidator(Validator):
    """
    合同数据验证器
    """
    
    def validate_contract_data(self, data: Dict[str, Any]) -> bool:
        """
        验证合同数据
        
        Args:
            data: 合同数据
            
        Returns:
            bool: 验证通过返回True
        """
        self.reset_errors()
        
        # 必填字段
        self.validate_required(data.get('customer_id'), 'customer_id')
        self.validate_required(data.get('title'), 'title')
        self.validate_required(data.get('amount'), 'amount')
        
        # 整数字段
        self.validate_integer(data.get('customer_id'), 'customer_id', min_value=1)
        
        # 字符串字段
        self.validate_string(data.get('title'), 'title', max_length=200)
        self.validate_string(data.get('content'), 'content', max_length=5000)
        self.validate_string(data.get('notes'), 'notes', max_length=1000)
        
        # 金额
        self.validate_decimal(data.get('amount'), 'amount', min_value=Decimal('0'))
        
        # 状态
        status_choices = ['草稿', '待审核', '已签署', '执行中', '已完成', '已终止']
        self.validate_choice(data.get('status'), 'status', status_choices)
        
        # 日期
        self.validate_date(data.get('start_date'), 'start_date')
        self.validate_date(data.get('end_date'), 'end_date')
        
        return not self.has_errors()

class OrderValidator(Validator):
    """
    订单数据验证器
    """
    
    def validate_order_data(self, data: Dict[str, Any]) -> bool:
        """
        验证订单数据
        
        Args:
            data: 订单数据
            
        Returns:
            bool: 验证通过返回True
        """
        self.reset_errors()
        
        # 必填字段
        self.validate_required(data.get('customer_id'), 'customer_id')
        self.validate_required(data.get('title'), 'title')
        self.validate_required(data.get('amount'), 'amount')
        
        # 整数字段
        self.validate_integer(data.get('customer_id'), 'customer_id', min_value=1)
        self.validate_integer(data.get('contract_id'), 'contract_id', min_value=1)
        
        # 字符串字段
        self.validate_string(data.get('title'), 'title', max_length=200)
        self.validate_string(data.get('description'), 'description', max_length=1000)
        self.validate_string(data.get('notes'), 'notes', max_length=1000)
        
        # 金额
        self.validate_decimal(data.get('amount'), 'amount', min_value=Decimal('0'))
        
        # 状态
        status_choices = ['待确认', '已确认', '生产中', '已发货', '已完成', '已取消']
        self.validate_choice(data.get('status'), 'status', status_choices)
        
        # 优先级
        priority_choices = ['低', '中', '高', '紧急']
        self.validate_choice(data.get('priority'), 'priority', priority_choices)
        
        # 日期
        self.validate_date(data.get('delivery_date'), 'delivery_date')
        
        return not self.has_errors()

class UserValidator(Validator):
    """
    用户数据验证器
    """
    
    def validate_user_data(self, data: Dict[str, Any], is_update: bool = False) -> bool:
        """
        验证用户数据
        
        Args:
            data: 用户数据
            is_update: 是否为更新操作
            
        Returns:
            bool: 验证通过返回True
        """
        self.reset_errors()
        
        # 必填字段（新建时）
        if not is_update:
            self.validate_required(data.get('username'), 'username')
            self.validate_required(data.get('password'), 'password')
            self.validate_required(data.get('email'), 'email')
        
        # 字符串字段
        self.validate_string(data.get('username'), 'username', min_length=3, max_length=50)
        self.validate_string(data.get('real_name'), 'real_name', max_length=100)
        self.validate_string(data.get('department'), 'department', max_length=100)
        
        # 密码（新建或修改密码时）
        if data.get('password'):
            self.validate_string(data.get('password'), 'password', min_length=8, max_length=128)
        
        # 邮箱
        if data.get('email'):
            self.validate_email(data.get('email'), 'email')
        
        # 手机号
        self.validate_phone(data.get('phone'), 'phone')
        
        # 角色
        role_choices = ['admin', 'manager', 'sales', 'user']
        self.validate_choice(data.get('role'), 'role', role_choices)
        
        # 状态
        status_choices = ['active', 'inactive', 'locked']
        self.validate_choice(data.get('status'), 'status', status_choices)
        
        return not self.has_errors()

def validate_pagination_params(page: Any, per_page: Any) -> Dict[str, Any]:
    """
    验证分页参数
    
    Args:
        page: 页码
        per_page: 每页数量
        
    Returns:
        Dict[str, Any]: 验证结果
    """
    result = {
        'valid': True,
        'page': 1,
        'per_page': 20,
        'errors': []
    }
    
    # 验证页码
    try:
        page_int = int(page) if page else 1
        if page_int < 1:
            page_int = 1
        result['page'] = page_int
    except (ValueError, TypeError):
        result['errors'].append('页码必须是正整数')
        result['valid'] = False
    
    # 验证每页数量
    try:
        per_page_int = int(per_page) if per_page else 20
        if per_page_int < 1:
            per_page_int = 20
        elif per_page_int > 100:
            per_page_int = 100
        result['per_page'] = per_page_int
    except (ValueError, TypeError):
        result['errors'].append('每页数量必须是正整数')
        result['valid'] = False
    
    return result