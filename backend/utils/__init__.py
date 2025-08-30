# -*- coding: utf-8 -*-
"""
CRM销售平台 - 工具包

提供数据库、认证、验证、辅助等工具模块
"""

from .database import DatabaseManager
from .auth import AuthManager, require_auth, require_role, require_permission, optional_auth
from .validators import (
    Validator, ValidationError,
    CustomerValidator, QuoteValidator, ContractValidator, OrderValidator, UserValidator,
    validate_pagination_params
)
from .helpers import (
    ResponseHelper, DateHelper, FileHelper, StringHelper, DataHelper, ExportHelper,
    get_client_ip, get_user_agent, log_request,
    safe_int, safe_float, safe_decimal
)
from .logger import setup_logger, get_logger, get_access_logger, RequestLogger, DatabaseLogger

__all__ = [
    # 数据库
    'DatabaseManager',
    
    # 认证
    'AuthManager',
    'require_auth',
    'require_role', 
    'require_permission',
    'optional_auth',
    
    # 验证
    'Validator',
    'ValidationError',
    'CustomerValidator',
    'QuoteValidator',
    'ContractValidator',
    'OrderValidator',
    'UserValidator',
    'validate_pagination_params',
    
    # 辅助工具
    'ResponseHelper',
    'DateHelper',
    'FileHelper',
    'StringHelper',
    'DataHelper',
    'ExportHelper',
    'get_client_ip',
    'get_user_agent',
    'log_request',
    'safe_int',
    'safe_float',
    'safe_decimal'
]