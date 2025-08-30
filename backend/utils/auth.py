# -*- coding: utf-8 -*-
"""
CRM销售平台 - 认证工具

提供用户认证、权限验证、密码加密等功能
"""

import bcrypt
import jwt
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

class AuthManager:
    """
    认证管理器
    
    负责用户认证、权限验证、密码加密等功能
    """
    
    def __init__(self):
        """
        初始化认证管理器
        """
        self.logger = logging.getLogger(__name__)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        加密密码
        
        Args:
            password: 明文密码
            
        Returns:
            str: 加密后的密码哈希
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """
        验证密码
        
        Args:
            password: 明文密码
            hashed_password: 加密后的密码哈希
            
        Returns:
            bool: 密码正确返回True，错误返回False
        """
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False
    
    @staticmethod
    def generate_token(user_id: int, username: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
        """
        生成JWT令牌
        
        Args:
            user_id: 用户ID
            username: 用户名
            role: 用户角色
            expires_delta: 过期时间间隔
            
        Returns:
            str: JWT令牌
        """
        if expires_delta is None:
            expires_delta = timedelta(hours=24)
        
        payload = {
            'user_id': user_id,
            'username': username,
            'role': role,
            'exp': datetime.utcnow() + expires_delta,
            'iat': datetime.utcnow()
        }
        
        secret_key = current_app.config.get('JWT_SECRET_KEY', 'default-secret-key')
        token = jwt.encode(payload, secret_key, algorithm='HS256')
        return token
    
    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        """
        解码JWT令牌
        
        Args:
            token: JWT令牌
            
        Returns:
            Optional[Dict[str, Any]]: 解码后的载荷，失败时返回None
        """
        try:
            secret_key = current_app.config.get('JWT_SECRET_KEY', 'default-secret-key')
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def get_token_from_header() -> Optional[str]:
        """
        从请求头获取JWT令牌
        
        Returns:
            Optional[str]: JWT令牌，未找到时返回None
        """
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            return auth_header.split(' ')[1]
        return None
    
    @staticmethod
    def get_current_user() -> Optional[Dict[str, Any]]:
        """
        获取当前用户信息
        
        Returns:
            Optional[Dict[str, Any]]: 当前用户信息，未认证时返回None
        """
        try:
            verify_jwt_in_request()
            user_identity = get_jwt_identity()
            return user_identity
        except Exception:
            return None
    
    @staticmethod
    def check_permission(required_role: str, user_role: str) -> bool:
        """
        检查用户权限
        
        Args:
            required_role: 需要的角色
            user_role: 用户角色
            
        Returns:
            bool: 有权限返回True，无权限返回False
        """
        # 角色权限等级
        role_levels = {
            'admin': 3,
            'manager': 2,
            'sales': 1,
            'user': 0
        }
        
        required_level = role_levels.get(required_role, 0)
        user_level = role_levels.get(user_role, 0)
        
        return user_level >= required_level
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """
        验证密码强度
        
        Args:
            password: 密码
            
        Returns:
            Dict[str, Any]: 验证结果
        """
        result = {
            'valid': True,
            'errors': [],
            'score': 0
        }
        
        # 长度检查
        if len(password) < 8:
            result['valid'] = False
            result['errors'].append('密码长度至少8位')
        else:
            result['score'] += 1
        
        # 包含数字
        if any(c.isdigit() for c in password):
            result['score'] += 1
        else:
            result['errors'].append('密码应包含数字')
        
        # 包含小写字母
        if any(c.islower() for c in password):
            result['score'] += 1
        else:
            result['errors'].append('密码应包含小写字母')
        
        # 包含大写字母
        if any(c.isupper() for c in password):
            result['score'] += 1
        else:
            result['errors'].append('密码应包含大写字母')
        
        # 包含特殊字符
        special_chars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
        if any(c in special_chars for c in password):
            result['score'] += 1
        else:
            result['errors'].append('密码应包含特殊字符')
        
        # 如果有错误，则无效
        if result['errors']:
            result['valid'] = False
        
        return result

def require_auth(f):
    """
    需要认证的装饰器
    
    Args:
        f: 被装饰的函数
        
    Returns:
        装饰后的函数
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'success': False,
                'message': '需要认证',
                'error': str(e)
            }), 401
    
    return decorated_function

def require_role(required_role: str):
    """
    需要特定角色的装饰器
    
    Args:
        required_role: 需要的角色
        
    Returns:
        装饰器函数
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user = get_jwt_identity()
                
                if not current_user:
                    return jsonify({
                        'success': False,
                        'message': '用户信息无效'
                    }), 401
                
                user_role = current_user.get('role', 'user')
                
                if not AuthManager.check_permission(required_role, user_role):
                    return jsonify({
                        'success': False,
                        'message': '权限不足'
                    }), 403
                
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': '权限验证失败',
                    'error': str(e)
                }), 401
        
        return decorated_function
    return decorator

def require_permission(permission: str):
    """
    需要特定权限的装饰器
    
    Args:
        permission: 需要的权限
        
    Returns:
        装饰器函数
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user = get_jwt_identity()
                
                if not current_user:
                    return jsonify({
                        'success': False,
                        'message': '用户信息无效'
                    }), 401
                
                # 这里可以实现更复杂的权限检查逻辑
                # 目前简化为角色检查
                user_role = current_user.get('role', 'user')
                
                # 管理员拥有所有权限
                if user_role == 'admin':
                    return f(*args, **kwargs)
                
                # 根据权限名称检查
                permission_map = {
                    'customer.read': ['manager', 'sales'],
                    'customer.write': ['manager', 'sales'],
                    'customer.delete': ['manager'],
                    'quote.read': ['manager', 'sales'],
                    'quote.write': ['manager', 'sales'],
                    'quote.delete': ['manager'],
                    'contract.read': ['manager', 'sales'],
                    'contract.write': ['manager'],
                    'contract.delete': ['manager'],
                    'order.read': ['manager', 'sales'],
                    'order.write': ['manager'],
                    'order.delete': ['manager'],
                    'user.manage': ['admin'],
                    'system.config': ['admin']
                }
                
                allowed_roles = permission_map.get(permission, [])
                
                if user_role not in allowed_roles:
                    return jsonify({
                        'success': False,
                        'message': f'缺少权限: {permission}'
                    }), 403
                
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': '权限验证失败',
                    'error': str(e)
                }), 401
        
        return decorated_function
    return decorator

def optional_auth(f):
    """
    可选认证的装饰器
    
    Args:
        f: 被装饰的函数
        
    Returns:
        装饰后的函数
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request(optional=True)
        except Exception:
            pass  # 忽略认证错误
        
        return f(*args, **kwargs)
    
    return decorated_function