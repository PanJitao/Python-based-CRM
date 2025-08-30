from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from models import db, User
from datetime import timedelta
import re

# 创建认证蓝图
auth_bp = Blueprint('auth', __name__)

# 邮箱验证正则表达式
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    try:
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field}是必填字段'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        # 验证用户名长度
        if len(username) < 3 or len(username) > 20:
            return jsonify({'error': '用户名长度必须在3-20个字符之间'}), 400
        
        # 验证邮箱格式
        if not EMAIL_REGEX.match(email):
            return jsonify({'error': '邮箱格式不正确'}), 400
        
        # 验证密码强度
        if len(password) < 6:
            return jsonify({'error': '密码长度至少6个字符'}), 400
        
        # 检查用户名是否已存在
        if User.query.filter_by(username=username).first():
            return jsonify({'error': '用户名已存在'}), 400
        
        # 检查邮箱是否已存在
        if User.query.filter_by(email=email).first():
            return jsonify({'error': '邮箱已被注册'}), 400
        
        # 创建新用户
        user = User(
            username=username,
            email=email,
            password=password,
            real_name=data.get('real_name', ''),
            phone=data.get('phone', ''),
            department=data.get('department', ''),
            position=data.get('position', '')
        )
        
        user.save()
        
        return jsonify({
            'message': '注册成功',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'注册失败: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    """用户登录"""
    # 处理CORS预检请求
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        
        # 验证必填字段
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': '用户名和密码不能为空'}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        # 查找用户（支持用户名或邮箱登录）
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user:
            return jsonify({'error': '用户不存在'}), 401
        
        # 检查用户状态
        if user.status != 'active':
            return jsonify({'error': '账户已被禁用，请联系管理员'}), 401
        
        # 验证密码
        if not user.check_password(password):
            return jsonify({'error': '密码错误'}), 401
        
        # 更新最后登录时间
        user.update_last_login()
        
        # 生成JWT令牌
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=24)
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            expires_delta=timedelta(days=30)
        )
        
        return jsonify({
            'message': '登录成功',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'登录失败: {str(e)}'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """刷新访问令牌"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.status != 'active':
            return jsonify({'error': '用户不存在或已被禁用'}), 401
        
        # 生成新的访问令牌
        new_access_token = create_access_token(
            identity=current_user_id,
            expires_delta=timedelta(hours=24)
        )
        
        return jsonify({
            'access_token': new_access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'刷新令牌失败: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """获取用户信息"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'获取用户信息失败: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """更新用户信息"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        data = request.get_json()
        
        # 可更新的字段
        updatable_fields = ['real_name', 'phone', 'department', 'position', 'avatar']
        
        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])
        
        # 如果要更新邮箱，需要验证格式和唯一性
        if 'email' in data:
            new_email = data['email'].strip().lower()
            if not EMAIL_REGEX.match(new_email):
                return jsonify({'error': '邮箱格式不正确'}), 400
            
            # 检查邮箱是否已被其他用户使用
            existing_user = User.query.filter(
                User.email == new_email,
                User.id != current_user_id
            ).first()
            
            if existing_user:
                return jsonify({'error': '邮箱已被其他用户使用'}), 400
            
            user.email = new_email
        
        user.save()
        
        return jsonify({
            'message': '用户信息更新成功',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'更新用户信息失败: {str(e)}'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """修改密码"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        data = request.get_json()
        
        # 验证必填字段
        if not data.get('old_password') or not data.get('new_password'):
            return jsonify({'error': '旧密码和新密码不能为空'}), 400
        
        old_password = data['old_password']
        new_password = data['new_password']
        
        # 验证旧密码
        if not user.check_password(old_password):
            return jsonify({'error': '旧密码错误'}), 400
        
        # 验证新密码强度
        if len(new_password) < 6:
            return jsonify({'error': '新密码长度至少6个字符'}), 400
        
        # 设置新密码
        user.set_password(new_password)
        user.save()
        
        return jsonify({
            'message': '密码修改成功'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'修改密码失败: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """用户登出"""
    # 在实际应用中，可以将JWT令牌加入黑名单
    # 这里简单返回成功消息
    return jsonify({
        'message': '登出成功'
    }), 200