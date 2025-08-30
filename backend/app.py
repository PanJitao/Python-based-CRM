# -*- coding: utf-8 -*-
"""
CRM销售平台 - 主应用文件

这是Flask应用的入口文件，负责：
1. 创建和配置Flask应用
2. 初始化数据库连接
3. 注册蓝图和路由
4. 配置中间件和错误处理
5. 启动应用服务
"""

import os
import sys
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, g, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, get_jwt
import pymysql
from werkzeug.exceptions import HTTPException
import logging
from logging.handlers import RotatingFileHandler

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入配置和工具
from config import Config

from utils.auth import AuthManager
from utils.helpers import ResponseHelper
from utils.logger import setup_logger

# 导入路由蓝图
from routes.auth import auth_bp
from routes.customers import customers_bp
from routes.quotes import quotes_bp
from routes.contracts import contracts_bp
from routes.orders import orders_bp
from routes.dashboard import dashboard_bp

# 创建Flask应用
def create_app(config_class=Config):
    """
    创建和配置Flask应用
    
    Args:
        config_class: 配置类，默认为Config
        
    Returns:
        Flask: 配置好的Flask应用实例
    """
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 配置CORS
    CORS(app, 
         origins=['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:8000'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'Access-Control-Allow-Credentials'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
         expose_headers=['Content-Type', 'Authorization'],
         send_wildcard=False,
         vary_header=True)
    
    # 配置JWT
    jwt = JWTManager(app)
    
    # 配置日志
    setup_logging(app)
    
    # 初始化数据库
    from models import db
    db.init_app(app)
    
    # 注册JWT回调
    register_jwt_callbacks(jwt)
    
    # 注册请求钩子
    register_request_hooks(app)
    
    # 注册错误处理器
    register_error_handlers(app)
    
    # 注册蓝图
    register_blueprints(app)
    
    # 添加全局OPTIONS处理
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add('Access-Control-Allow-Headers', "*")
            response.headers.add('Access-Control-Allow-Methods', "*")
            return response
    
    # 注册CLI命令
    register_cli_commands(app)
    
    return app

def setup_logging(app):
    """
    配置应用日志
    
    Args:
        app: Flask应用实例
    """
    if not app.debug and not app.testing:
        # 创建日志目录
        log_dir = os.path.join(os.path.dirname(app.instance_path), 'logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # 配置文件日志处理器
        file_handler = RotatingFileHandler(
            os.path.join(log_dir, 'crm.log'),
            maxBytes=10240000,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        
        app.logger.setLevel(logging.INFO)
        app.logger.info('CRM应用启动')



def register_jwt_callbacks(jwt):
    """
    注册JWT回调函数
    
    Args:
        jwt: JWTManager实例
    """
    
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        """
        检查令牌是否已被撤销
        """
        jti = jwt_payload['jti']
        # 这里可以实现令牌黑名单检查逻辑
        # 暂时返回False，表示令牌未被撤销
        return False
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        """
        令牌过期回调
        """
        return ResponseHelper.error('令牌已过期，请重新登录', code=401)
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        """
        无效令牌回调
        """
        return ResponseHelper.error('无效的令牌', code=401)
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        """
        缺少令牌回调
        """
        return ResponseHelper.error('需要提供访问令牌', code=401)
    
    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        """
        需要新鲜令牌回调
        """
        return ResponseHelper.error('需要新的访问令牌', code=401)
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """
        已撤销令牌回调
        """
        return ResponseHelper.error('令牌已被撤销', code=401)

def register_request_hooks(app):
    """
    注册请求钩子
    
    Args:
        app: Flask应用实例
    """
    
    @app.before_request
    def before_request():
        """
        请求前处理
        """
        # 记录请求信息
        if app.config.get('LOG_REQUESTS', False):
            app.logger.info(f'{request.method} {request.url} - {request.remote_addr}')
        

        
        # 设置请求开始时间
        g.start_time = datetime.now()
    
    @app.after_request
    def after_request(response):
        """
        请求后处理
        """
        
        # 记录响应时间
        if hasattr(g, 'start_time'):
            duration = datetime.now() - g.start_time
            response.headers['X-Response-Time'] = str(duration.total_seconds())
        
        # 添加安全头
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        return response
    


def register_error_handlers(app):
    """
    注册错误处理器
    
    Args:
        app: Flask应用实例
    """
    
    @app.errorhandler(400)
    def bad_request(error):
        """
        处理400错误
        """
        return ResponseHelper.error('请求参数错误', code=400)
    
    @app.errorhandler(401)
    def unauthorized(error):
        """
        处理401错误
        """
        return ResponseHelper.error('未授权访问', code=401)
    
    @app.errorhandler(403)
    def forbidden(error):
        """
        处理403错误
        """
        return ResponseHelper.error('禁止访问', code=403)
    
    @app.errorhandler(404)
    def not_found(error):
        """
        处理404错误
        """
        return ResponseHelper.error('资源不存在', code=404)
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        """
        处理405错误
        """
        return ResponseHelper.error('请求方法不允许', code=405)
    
    @app.errorhandler(500)
    def internal_error(error):
        """
        处理500错误
        """
        app.logger.error(f'服务器内部错误: {str(error)}', exc_info=True)
        return ResponseHelper.error('服务器内部错误', code=500)
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        """
        处理未捕获的异常
        """
        if isinstance(error, HTTPException):
            return error
        
        app.logger.error(f'未处理的异常: {str(error)}', exc_info=True)
        return ResponseHelper.error('服务器内部错误', code=500)

def register_blueprints(app):
    """
    注册蓝图
    
    Args:
        app: Flask应用实例
    """
    # API版本前缀
    api_prefix = '/api/v1'
    
    # 注册认证路由
    app.register_blueprint(auth_bp, url_prefix=f'{api_prefix}/auth')
    
    # 注册业务路由
    app.register_blueprint(customers_bp, url_prefix=f'{api_prefix}/customers')
    app.register_blueprint(quotes_bp, url_prefix=f'{api_prefix}/quotes')
    app.register_blueprint(contracts_bp, url_prefix=f'{api_prefix}/contracts')
    app.register_blueprint(orders_bp, url_prefix=f'{api_prefix}/orders')
    app.register_blueprint(dashboard_bp, url_prefix=f'{api_prefix}/stats')
    
    app.logger.info('所有蓝图已注册')

def register_cli_commands(app):
    """
    注册CLI命令
    
    Args:
        app: Flask应用实例
    """
    
    @app.cli.command()
    def init_db():
        """
        初始化数据库
        """
        try:
            db_manager = DatabaseManager(app.config)
            
            # 读取并执行初始化SQL脚本
            init_sql_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), 
                'database', 
                'init.sql'
            )
            
            if os.path.exists(init_sql_path):
                with open(init_sql_path, 'r', encoding='utf-8') as f:
                    sql_script = f.read()
                
                # 执行SQL脚本
                connection = db_manager.get_connection()
                cursor = connection.cursor()
                
                # 分割SQL语句并执行
                statements = sql_script.split(';')
                for statement in statements:
                    statement = statement.strip()
                    if statement:
                        cursor.execute(statement)
                
                connection.commit()
                cursor.close()
                connection.close()
                
                print('数据库初始化成功！')
            else:
                print('初始化SQL文件不存在！')
                
        except Exception as e:
            print(f'数据库初始化失败: {str(e)}')
    
    @app.cli.command()
    def create_admin():
        """
        创建管理员用户
        """
        try:
            from models.user import User
            
            username = input('请输入管理员用户名: ')
            email = input('请输入管理员邮箱: ')
            real_name = input('请输入真实姓名: ')
            password = input('请输入密码: ')
            
            # 创建管理员用户
            admin_data = {
                'username': username,
                'email': email,
                'real_name': real_name,
                'password': password,
                'role': 'admin',
                'status': 'active'
            }
            
            db_manager = DatabaseManager(app.config)
            connection = db_manager.get_connection()
            
            user = User(connection)
            user_id = user.create(admin_data)
            
            connection.close()
            
            print(f'管理员用户创建成功！用户ID: {user_id}')
            
        except Exception as e:
            print(f'创建管理员用户失败: {str(e)}')

# 创建应用实例
app = create_app()

# 添加根路由
@app.route('/')
def index():
    """
    根路由 - 返回API信息
    """
    return ResponseHelper.success({
        'name': 'CRM销售平台API',
        'version': '1.0.0',
        'description': '一个功能完整的CRM销售管理系统',
        'endpoints': {
            'auth': '/api/v1/auth',
            'customers': '/api/v1/customers',
            'quotes': '/api/v1/quotes',
            'contracts': '/api/v1/contracts',
            'orders': '/api/v1/orders'
        },
        'timestamp': datetime.now().isoformat()
    })

# 健康检查路由
@app.route('/health')
def health_check():
    """
    健康检查路由
    """
    try:
        # 检查数据库连接
        db_manager = DatabaseManager(app.config)
        connection = db_manager.get_connection()
        if connection:
            connection.close()
            db_status = 'healthy'
        else:
            db_status = 'unhealthy'
    except Exception:
        db_status = 'unhealthy'
    
    status = 'healthy' if db_status == 'healthy' else 'unhealthy'
    
    return ResponseHelper.success({
        'status': status,
        'database': db_status,
        'timestamp': datetime.now().isoformat()
    })

# API信息路由
@app.route('/api/v1')
def api_info():
    """
    API信息路由
    """
    return ResponseHelper.success({
        'version': '1.0.0',
        'description': 'CRM销售平台API v1.0',
        'endpoints': {
            'auth': {
                'login': 'POST /api/v1/auth/login',
                'register': 'POST /api/v1/auth/register',
                'logout': 'POST /api/v1/auth/logout',
                'refresh': 'POST /api/v1/auth/refresh',
                'profile': 'GET/PUT /api/v1/auth/profile'
            },
            'customers': {
                'list': 'GET /api/v1/customers',
                'create': 'POST /api/v1/customers',
                'detail': 'GET /api/v1/customers/{id}',
                'update': 'PUT /api/v1/customers/{id}',
                'delete': 'DELETE /api/v1/customers/{id}'
            },
            'quotes': {
                'list': 'GET /api/v1/quotes',
                'create': 'POST /api/v1/quotes',
                'detail': 'GET /api/v1/quotes/{id}',
                'update': 'PUT /api/v1/quotes/{id}',
                'delete': 'DELETE /api/v1/quotes/{id}'
            },
            'contracts': {
                'list': 'GET /api/v1/contracts',
                'create': 'POST /api/v1/contracts',
                'detail': 'GET /api/v1/contracts/{id}',
                'update': 'PUT /api/v1/contracts/{id}',
                'delete': 'DELETE /api/v1/contracts/{id}'
            },
            'orders': {
                'list': 'GET /api/v1/orders',
                'create': 'POST /api/v1/orders',
                'detail': 'GET /api/v1/orders/{id}',
                'update': 'PUT /api/v1/orders/{id}',
                'delete': 'DELETE /api/v1/orders/{id}'
            }
        }
    })

if __name__ == '__main__':
    # 开发环境运行
    app.run(
        host=app.config.get('HOST', '0.0.0.0'),
        port=app.config.get('PORT', 5000),
        debug=app.config.get('DEBUG', True)
    )