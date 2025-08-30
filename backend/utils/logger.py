# -*- coding: utf-8 -*-
"""
CRM销售平台 - 日志工具

提供日志配置和管理功能
"""

import os
import logging
import logging.handlers
from datetime import datetime
from typing import Optional

def setup_logger(name: str = 'crm', level: str = 'INFO', log_dir: str = 'logs') -> logging.Logger:
    """
    设置日志记录器
    
    Args:
        name: 日志记录器名称
        level: 日志级别
        log_dir: 日志目录
        
    Returns:
        logging.Logger: 配置好的日志记录器
    """
    # 创建日志目录
    if not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)
    
    # 创建日志记录器
    logger = logging.getLogger(name)
    
    # 如果已经配置过，直接返回
    if logger.handlers:
        return logger
    
    # 设置日志级别
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # 创建格式化器
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # 文件处理器 - 所有日志
    all_log_file = os.path.join(log_dir, 'app.log')
    file_handler = logging.handlers.RotatingFileHandler(
        all_log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # 错误日志文件处理器
    error_log_file = os.path.join(log_dir, 'error.log')
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)
    
    # 访问日志文件处理器
    access_log_file = os.path.join(log_dir, 'access.log')
    access_handler = logging.handlers.RotatingFileHandler(
        access_log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    access_handler.setLevel(logging.INFO)
    
    # 访问日志使用简化格式
    access_formatter = logging.Formatter(
        '%(asctime)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    access_handler.setFormatter(access_formatter)
    
    # 创建访问日志记录器
    access_logger = logging.getLogger(f'{name}.access')
    access_logger.setLevel(logging.INFO)
    access_logger.addHandler(access_handler)
    access_logger.propagate = False  # 不传播到父记录器
    
    return logger

def get_logger(name: str = 'crm') -> logging.Logger:
    """
    获取日志记录器
    
    Args:
        name: 日志记录器名称
        
    Returns:
        logging.Logger: 日志记录器
    """
    return logging.getLogger(name)

def get_access_logger(name: str = 'crm') -> logging.Logger:
    """
    获取访问日志记录器
    
    Args:
        name: 日志记录器名称
        
    Returns:
        logging.Logger: 访问日志记录器
    """
    return logging.getLogger(f'{name}.access')

def log_request(method: str, url: str, ip: str, user_agent: str, user_id: Optional[int] = None):
    """
    记录请求日志
    
    Args:
        method: HTTP方法
        url: 请求URL
        ip: 客户端IP
        user_agent: 用户代理
        user_id: 用户ID
    """
    access_logger = get_access_logger()
    
    user_info = f'User:{user_id}' if user_id else 'Anonymous'
    message = f'{method} {url} - {ip} - {user_info} - {user_agent}'
    
    access_logger.info(message)

def log_error(error: Exception, context: str = ''):
    """
    记录错误日志
    
    Args:
        error: 异常对象
        context: 上下文信息
    """
    logger = get_logger()
    
    error_message = f'{context} - {type(error).__name__}: {str(error)}' if context else f'{type(error).__name__}: {str(error)}'
    logger.error(error_message, exc_info=True)

def log_operation(user_id: int, operation: str, target: str, details: str = ''):
    """
    记录操作日志
    
    Args:
        user_id: 用户ID
        operation: 操作类型
        target: 操作目标
        details: 详细信息
    """
    logger = get_logger()
    
    message = f'User:{user_id} {operation} {target}'
    if details:
        message += f' - {details}'
    
    logger.info(message)

class RequestLogger:
    """
    请求日志中间件
    """
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """
        初始化应用
        
        Args:
            app: Flask应用实例
        """
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        """
        请求前处理
        """
        from flask import request, g
        
        g.start_time = datetime.now()
        
        # 记录请求开始
        access_logger = get_access_logger()
        access_logger.debug(f'Request started: {request.method} {request.url}')
    
    def after_request(self, response):
        """
        请求后处理
        
        Args:
            response: 响应对象
            
        Returns:
            响应对象
        """
        from flask import request, g
        from utils.helpers import get_client_ip, get_user_agent
        
        # 计算请求耗时
        if hasattr(g, 'start_time'):
            duration = (datetime.now() - g.start_time).total_seconds()
        else:
            duration = 0
        
        # 获取用户信息
        user_id = None
        try:
            from flask_jwt_extended import get_jwt_identity
            current_user = get_jwt_identity()
            if current_user:
                user_id = current_user.get('user_id')
        except Exception:
            pass
        
        # 记录访问日志
        access_logger = get_access_logger()
        
        user_info = f'User:{user_id}' if user_id else 'Anonymous'
        message = (
            f'{request.method} {request.url} - '
            f'{response.status_code} - '
            f'{duration:.3f}s - '
            f'{get_client_ip()} - '
            f'{user_info} - '
            f'{get_user_agent()}'
        )
        
        if response.status_code >= 400:
            access_logger.warning(message)
        else:
            access_logger.info(message)
        
        return response

class DatabaseLogger:
    """
    数据库操作日志
    """
    
    @staticmethod
    def log_query(sql: str, params: tuple = None, duration: float = None):
        """
        记录SQL查询
        
        Args:
            sql: SQL语句
            params: 参数
            duration: 执行时间
        """
        logger = get_logger('crm.db')
        
        message = f'SQL: {sql}'
        if params:
            message += f' - Params: {params}'
        if duration is not None:
            message += f' - Duration: {duration:.3f}s'
        
        logger.debug(message)
    
    @staticmethod
    def log_transaction(operation: str, tables: list = None):
        """
        记录事务操作
        
        Args:
            operation: 操作类型
            tables: 涉及的表
        """
        logger = get_logger('crm.db')
        
        message = f'Transaction {operation}'
        if tables:
            message += f' - Tables: {", ".join(tables)}'
        
        logger.info(message)

# 预定义的日志记录器
app_logger = None
access_logger = None
db_logger = None

def init_loggers(log_level: str = 'INFO', log_dir: str = 'logs'):
    """
    初始化所有日志记录器
    
    Args:
        log_level: 日志级别
        log_dir: 日志目录
    """
    global app_logger, access_logger, db_logger
    
    # 主应用日志
    app_logger = setup_logger('crm', log_level, log_dir)
    
    # 访问日志
    access_logger = get_access_logger('crm')
    
    # 数据库日志
    db_logger = setup_logger('crm.db', log_level, log_dir)
    
    app_logger.info('日志系统初始化完成')

# 便捷函数
def info(message: str):
    """记录信息日志"""
    if app_logger:
        app_logger.info(message)

def warning(message: str):
    """记录警告日志"""
    if app_logger:
        app_logger.warning(message)

def error(message: str):
    """记录错误日志"""
    if app_logger:
        app_logger.error(message)

def debug(message: str):
    """记录调试日志"""
    if app_logger:
        app_logger.debug(message)