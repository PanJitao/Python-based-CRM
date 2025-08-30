# -*- coding: utf-8 -*-
"""
仪表盘路由
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from utils.helpers import ResponseHelper

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    """获取仪表盘数据"""
    # 在这里，您可以从数据库或其他来源获取实际的仪表盘数据。
    # 现在，我们只返回一些模拟数据。
    dashboard_data = {
        'customers': {'total': 120, 'change': 5},
        'quotes': {'total': 80, 'change': -2},
        'contracts': {'total': 50, 'change': 10},
        'revenue': {'total': 120000, 'change': 15}
    }
    return ResponseHelper.success(dashboard_data)

@dashboard_bp.route('/recent-activities', methods=['GET'])
@jwt_required()
def get_recent_activities():
    """获取最近的活动"""
    # 在这里，您可以从数据库或其他来源获取最近的活动。
    # 现在，我们只返回一些模拟数据。
    recent_activities = [
        {'type': 'customer', 'title': '新客户', 'description': '添加了新客户：张三', 'created_at': '2023-07-31T10:00:00Z'},
        {'type': 'quote', 'title': '新报价', 'description': '创建了新的报价单 #123', 'created_at': '2023-07-31T09:30:00Z'},
        {'type': 'contract', 'title': '合同签署', 'description': '合同 #456 已签署', 'created_at': '2023-07-30T15:00:00Z'}
    ]
    return ResponseHelper.success({'activities': recent_activities})