from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Customer, User
from sqlalchemy import or_
from datetime import datetime

# 创建客户管理蓝图
customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/', methods=['GET'])
@jwt_required()
def get_customers():
    """获取客户列表"""
    try:
        # 获取查询参数
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '').strip()
        status = request.args.get('status', '')
        level = request.args.get('level', '')
        sales_user_id = request.args.get('sales_user_id', type=int)
        
        # 构建查询
        query = Customer.query.filter_by(is_deleted=False)
        
        # 搜索条件
        if search:
            query = query.filter(
                or_(
                    Customer.name.contains(search),
                    Customer.company.contains(search),
                    Customer.contact_person.contains(search),
                    Customer.phone.contains(search),
                    Customer.email.contains(search)
                )
            )
        
        # 状态筛选
        if status:
            query = query.filter_by(status=status)
        
        # 等级筛选
        if level:
            query = query.filter_by(level=level)
        
        # 销售员筛选
        if sales_user_id:
            query = query.filter_by(sales_user_id=sales_user_id)
        
        # 排序
        query = query.order_by(Customer.created_at.desc())
        
        # 分页
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        customers = [customer.to_dict() for customer in pagination.items]
        
        return jsonify({
            'customers': customers,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_prev': pagination.has_prev,
                'has_next': pagination.has_next
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'获取客户列表失败: {str(e)}'}), 500

@customers_bp.route('/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer(customer_id):
    """获取客户详情"""
    try:
        customer = Customer.query.filter_by(
            id=customer_id,
            is_deleted=False
        ).first()
        
        if not customer:
            return jsonify({'error': '客户不存在'}), 404
        
        return jsonify({
            'customer': customer.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'获取客户详情失败: {str(e)}'}), 500

@customers_bp.route('/', methods=['POST'])
@jwt_required()
def create_customer():
    """创建客户"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # 验证必填字段
        if not data.get('name'):
            return jsonify({'error': '客户名称不能为空'}), 400
        
        # 检查客户名称是否已存在
        existing_customer = Customer.query.filter_by(
            name=data['name'].strip(),
            is_deleted=False
        ).first()
        
        if existing_customer:
            return jsonify({'error': '客户名称已存在'}), 400
        
        # 创建客户
        customer_data = {
            'name': data['name'].strip(),
            'company': data.get('company', '').strip(),
            'industry': data.get('industry', '').strip(),
            'customer_type': data.get('customer_type', 'individual'),
            'contact_person': data.get('contact_person', '').strip(),
            'phone': data.get('phone', '').strip(),
            'mobile': data.get('mobile', '').strip(),
            'email': data.get('email', '').strip(),
            'fax': data.get('fax', '').strip(),
            'website': data.get('website', '').strip(),
            'address': data.get('address', '').strip(),
            'city': data.get('city', '').strip(),
            'province': data.get('province', '').strip(),
            'country': data.get('country', '中国'),
            'postal_code': data.get('postal_code', '').strip(),
            'source': data.get('source', '').strip(),
            'level': data.get('level', 'C'),
            'status': data.get('status', 'potential'),
            'credit_limit': data.get('credit_limit', 0.00),
            'sales_user_id': data.get('sales_user_id', current_user_id),
            'description': data.get('description', '').strip(),
            'notes': data.get('notes', '').strip()
        }
        
        # 处理标签
        if data.get('tags_list'):
            customer_data['tags'] = ','.join([tag.strip() for tag in data['tags_list'] if tag.strip()])
        
        # 处理日期字段
        if data.get('first_contact_date'):
            try:
                customer_data['first_contact_date'] = datetime.strptime(
                    data['first_contact_date'], '%Y-%m-%d'
                ).date()
            except ValueError:
                return jsonify({'error': '首次接触日期格式错误，应为YYYY-MM-DD'}), 400
        
        if data.get('next_follow_date'):
            try:
                customer_data['next_follow_date'] = datetime.strptime(
                    data['next_follow_date'], '%Y-%m-%d'
                ).date()
            except ValueError:
                return jsonify({'error': '下次跟进日期格式错误，应为YYYY-MM-DD'}), 400
        
        customer = Customer(**customer_data)
        customer.save()
        
        return jsonify({
            'message': '客户创建成功',
            'customer': customer.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'创建客户失败: {str(e)}'}), 500

@customers_bp.route('/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    """更新客户信息"""
    try:
        customer = Customer.query.filter_by(
            id=customer_id,
            is_deleted=False
        ).first()
        
        if not customer:
            return jsonify({'error': '客户不存在'}), 404
        
        data = request.get_json()
        
        # 检查客户名称是否与其他客户重复
        if 'name' in data and data['name'].strip() != customer.name:
            existing_customer = Customer.query.filter_by(
                name=data['name'].strip(),
                is_deleted=False
            ).filter(Customer.id != customer_id).first()
            
            if existing_customer:
                return jsonify({'error': '客户名称已存在'}), 400
        
        # 可更新的字段
        updatable_fields = [
            'name', 'company', 'industry', 'customer_type', 'contact_person',
            'phone', 'mobile', 'email', 'fax', 'website', 'address', 'city',
            'province', 'country', 'postal_code', 'source', 'level', 'status',
            'credit_limit', 'sales_user_id', 'description', 'notes'
        ]
        
        for field in updatable_fields:
            if field in data:
                if isinstance(data[field], str):
                    setattr(customer, field, data[field].strip())
                else:
                    setattr(customer, field, data[field])
        
        # 处理标签
        if 'tags_list' in data:
            if data['tags_list']:
                customer.tags = ','.join([tag.strip() for tag in data['tags_list'] if tag.strip()])
            else:
                customer.tags = None
        
        # 处理日期字段
        date_fields = ['first_contact_date', 'next_follow_date']
        for field in date_fields:
            if field in data and data[field]:
                try:
                    setattr(customer, field, datetime.strptime(
                        data[field], '%Y-%m-%d'
                    ).date())
                except ValueError:
                    return jsonify({'error': f'{field}格式错误，应为YYYY-MM-DD'}), 400
        
        customer.save()
        
        return jsonify({
            'message': '客户信息更新成功',
            'customer': customer.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'更新客户信息失败: {str(e)}'}), 500

@customers_bp.route('/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    """删除客户"""
    try:
        customer = Customer.query.filter_by(
            id=customer_id,
            is_deleted=False
        ).first()
        
        if not customer:
            return jsonify({'error': '客户不存在'}), 404
        
        # 检查是否有关联的报价、合同或订单
        if customer.quotes or customer.contracts or customer.orders:
            return jsonify({'error': '该客户存在关联的业务数据，无法删除'}), 400
        
        # 软删除
        customer.delete()
        
        return jsonify({
            'message': '客户删除成功'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'删除客户失败: {str(e)}'}), 500

@customers_bp.route('/<int:customer_id>/contact', methods=['POST'])
@jwt_required()
def update_contact_date(customer_id):
    """更新客户最后接触日期"""
    try:
        customer = Customer.query.filter_by(
            id=customer_id,
            is_deleted=False
        ).first()
        
        if not customer:
            return jsonify({'error': '客户不存在'}), 404
        
        customer.update_last_contact()
        
        return jsonify({
            'message': '接触日期更新成功',
            'last_contact_date': customer.last_contact_date.isoformat() if customer.last_contact_date else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'更新接触日期失败: {str(e)}'}), 500

@customers_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_customer_stats():
    """获取客户统计信息"""
    try:
        # 总客户数
        total_customers = Customer.query.filter_by(is_deleted=False).count()
        
        # 按状态统计
        status_stats = db.session.query(
            Customer.status,
            db.func.count(Customer.id)
        ).filter_by(is_deleted=False).group_by(Customer.status).all()
        
        # 按等级统计
        level_stats = db.session.query(
            Customer.level,
            db.func.count(Customer.id)
        ).filter_by(is_deleted=False).group_by(Customer.level).all()
        
        # 按客户类型统计
        type_stats = db.session.query(
            Customer.customer_type,
            db.func.count(Customer.id)
        ).filter_by(is_deleted=False).group_by(Customer.customer_type).all()
        
        return jsonify({
            'total_customers': total_customers,
            'status_stats': dict(status_stats),
            'level_stats': dict(level_stats),
            'type_stats': dict(type_stats)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'获取客户统计失败: {str(e)}'}), 500