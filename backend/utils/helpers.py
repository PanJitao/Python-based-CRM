# -*- coding: utf-8 -*-
"""
CRM销售平台 - 辅助工具

提供各种通用的辅助功能
"""

import os
import uuid
import hashlib
import logging
import json
import csv
import io
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, date, timedelta
from decimal import Decimal
from flask import jsonify, request
from werkzeug.utils import secure_filename

class ResponseHelper:
    """
    响应辅助类
    
    提供统一的API响应格式
    """
    
    @staticmethod
    def success(data: Any = None, message: str = '操作成功', code: int = 200) -> tuple:
        """
        成功响应
        
        Args:
            data: 响应数据
            message: 响应消息
            code: HTTP状态码
            
        Returns:
            tuple: (响应体, HTTP状态码)
        """
        response = {
            'success': True,
            'message': message,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
        return jsonify(response), code
    
    @staticmethod
    def error(message: str = '操作失败', code: int = 400, errors: List[Dict] = None) -> tuple:
        """
        错误响应
        
        Args:
            message: 错误消息
            code: HTTP状态码
            errors: 详细错误信息
            
        Returns:
            tuple: (响应体, HTTP状态码)
        """
        response = {
            'success': False,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        if errors:
            response['errors'] = errors
        
        return jsonify(response), code
    
    @staticmethod
    def paginated(data: List[Any], total: int, page: int, per_page: int, message: str = '获取成功') -> tuple:
        """
        分页响应
        
        Args:
            data: 数据列表
            total: 总数量
            page: 当前页码
            per_page: 每页数量
            message: 响应消息
            
        Returns:
            tuple: (响应体, HTTP状态码)
        """
        total_pages = (total + per_page - 1) // per_page
        
        response = {
            'success': True,
            'message': message,
            'data': data,
            'pagination': {
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': total_pages,
                'has_prev': page > 1,
                'has_next': page < total_pages
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response), 200

class DateHelper:
    """
    日期辅助类
    
    提供日期相关的辅助功能
    """
    
    @staticmethod
    def now() -> datetime:
        """
        获取当前时间
        
        Returns:
            datetime: 当前时间
        """
        return datetime.now()
    
    @staticmethod
    def today() -> date:
        """
        获取今天日期
        
        Returns:
            date: 今天日期
        """
        return date.today()
    
    @staticmethod
    def format_datetime(dt: datetime, format_str: str = '%Y-%m-%d %H:%M:%S') -> str:
        """
        格式化日期时间
        
        Args:
            dt: 日期时间对象
            format_str: 格式字符串
            
        Returns:
            str: 格式化后的字符串
        """
        if dt is None:
            return ''
        return dt.strftime(format_str)
    
    @staticmethod
    def format_date(d: date, format_str: str = '%Y-%m-%d') -> str:
        """
        格式化日期
        
        Args:
            d: 日期对象
            format_str: 格式字符串
            
        Returns:
            str: 格式化后的字符串
        """
        if d is None:
            return ''
        return d.strftime(format_str)
    
    @staticmethod
    def parse_date(date_str: str, format_str: str = '%Y-%m-%d') -> Optional[date]:
        """
        解析日期字符串
        
        Args:
            date_str: 日期字符串
            format_str: 格式字符串
            
        Returns:
            Optional[date]: 日期对象，解析失败返回None
        """
        try:
            return datetime.strptime(date_str, format_str).date()
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def parse_datetime(datetime_str: str, format_str: str = '%Y-%m-%d %H:%M:%S') -> Optional[datetime]:
        """
        解析日期时间字符串
        
        Args:
            datetime_str: 日期时间字符串
            format_str: 格式字符串
            
        Returns:
            Optional[datetime]: 日期时间对象，解析失败返回None
        """
        try:
            return datetime.strptime(datetime_str, format_str)
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def add_days(d: date, days: int) -> date:
        """
        日期加天数
        
        Args:
            d: 日期
            days: 天数
            
        Returns:
            date: 新日期
        """
        return d + timedelta(days=days)
    
    @staticmethod
    def days_between(start_date: date, end_date: date) -> int:
        """
        计算两个日期之间的天数
        
        Args:
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            int: 天数差
        """
        return (end_date - start_date).days
    
    @staticmethod
    def get_month_range(year: int, month: int) -> tuple:
        """
        获取月份的开始和结束日期
        
        Args:
            year: 年份
            month: 月份
            
        Returns:
            tuple: (开始日期, 结束日期)
        """
        start_date = date(year, month, 1)
        
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        return start_date, end_date

class FileHelper:
    """
    文件辅助类
    
    提供文件相关的辅助功能
    """
    
    ALLOWED_EXTENSIONS = {
        'image': {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'},
        'document': {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'},
        'archive': {'zip', 'rar', '7z', 'tar', 'gz'}
    }
    
    @staticmethod
    def allowed_file(filename: str, file_type: str = None) -> bool:
        """
        检查文件是否允许上传
        
        Args:
            filename: 文件名
            file_type: 文件类型（image, document, archive）
            
        Returns:
            bool: 允许返回True
        """
        if '.' not in filename:
            return False
        
        ext = filename.rsplit('.', 1)[1].lower()
        
        if file_type:
            return ext in FileHelper.ALLOWED_EXTENSIONS.get(file_type, set())
        else:
            # 检查所有允许的扩展名
            all_extensions = set()
            for extensions in FileHelper.ALLOWED_EXTENSIONS.values():
                all_extensions.update(extensions)
            return ext in all_extensions
    
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """
        获取文件扩展名
        
        Args:
            filename: 文件名
            
        Returns:
            str: 扩展名
        """
        if '.' not in filename:
            return ''
        return filename.rsplit('.', 1)[1].lower()
    
    @staticmethod
    def generate_filename(original_filename: str) -> str:
        """
        生成安全的文件名
        
        Args:
            original_filename: 原始文件名
            
        Returns:
            str: 安全的文件名
        """
        # 获取文件扩展名
        ext = FileHelper.get_file_extension(original_filename)
        
        # 生成UUID作为文件名
        filename = str(uuid.uuid4())
        
        if ext:
            filename += '.' + ext
        
        return filename
    
    @staticmethod
    def get_file_size(file_path: str) -> int:
        """
        获取文件大小
        
        Args:
            file_path: 文件路径
            
        Returns:
            int: 文件大小（字节）
        """
        try:
            return os.path.getsize(file_path)
        except OSError:
            return 0
    
    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """
        格式化文件大小
        
        Args:
            size_bytes: 文件大小（字节）
            
        Returns:
            str: 格式化后的文件大小
        """
        if size_bytes == 0:
            return '0 B'
        
        size_names = ['B', 'KB', 'MB', 'GB', 'TB']
        i = 0
        size = float(size_bytes)
        
        while size >= 1024.0 and i < len(size_names) - 1:
            size /= 1024.0
            i += 1
        
        return f'{size:.1f} {size_names[i]}'
    
    @staticmethod
    def ensure_dir(dir_path: str):
        """
        确保目录存在
        
        Args:
            dir_path: 目录路径
        """
        if not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)

class StringHelper:
    """
    字符串辅助类
    
    提供字符串相关的辅助功能
    """
    
    @staticmethod
    def generate_id() -> str:
        """
        生成唯一ID
        
        Returns:
            str: 唯一ID
        """
        return str(uuid.uuid4())
    
    @staticmethod
    def generate_short_id(length: int = 8) -> str:
        """
        生成短ID
        
        Args:
            length: ID长度
            
        Returns:
            str: 短ID
        """
        return str(uuid.uuid4()).replace('-', '')[:length]
    
    @staticmethod
    def hash_string(text: str, algorithm: str = 'md5') -> str:
        """
        计算字符串哈希值
        
        Args:
            text: 文本
            algorithm: 哈希算法
            
        Returns:
            str: 哈希值
        """
        if algorithm == 'md5':
            return hashlib.md5(text.encode('utf-8')).hexdigest()
        elif algorithm == 'sha1':
            return hashlib.sha1(text.encode('utf-8')).hexdigest()
        elif algorithm == 'sha256':
            return hashlib.sha256(text.encode('utf-8')).hexdigest()
        else:
            raise ValueError(f'不支持的哈希算法: {algorithm}')
    
    @staticmethod
    def truncate(text: str, length: int, suffix: str = '...') -> str:
        """
        截断字符串
        
        Args:
            text: 文本
            length: 最大长度
            suffix: 后缀
            
        Returns:
            str: 截断后的字符串
        """
        if len(text) <= length:
            return text
        return text[:length - len(suffix)] + suffix
    
    @staticmethod
    def clean_string(text: str) -> str:
        """
        清理字符串
        
        Args:
            text: 文本
            
        Returns:
            str: 清理后的字符串
        """
        if not text:
            return ''
        return text.strip()
    
    @staticmethod
    def is_empty(text: str) -> bool:
        """
        检查字符串是否为空
        
        Args:
            text: 文本
            
        Returns:
            bool: 为空返回True
        """
        return not text or text.strip() == ''

class DataHelper:
    """
    数据辅助类
    
    提供数据处理相关的辅助功能
    """
    
    @staticmethod
    def to_dict(obj: Any, exclude_fields: List[str] = None) -> Dict[str, Any]:
        """
        将对象转换为字典
        
        Args:
            obj: 对象
            exclude_fields: 排除的字段
            
        Returns:
            Dict[str, Any]: 字典
        """
        if exclude_fields is None:
            exclude_fields = []
        
        if hasattr(obj, '__dict__'):
            result = {}
            for key, value in obj.__dict__.items():
                if key.startswith('_') or key in exclude_fields:
                    continue
                
                if isinstance(value, (datetime, date)):
                    result[key] = value.isoformat()
                elif isinstance(value, Decimal):
                    result[key] = float(value)
                else:
                    result[key] = value
            
            return result
        else:
            return obj
    
    @staticmethod
    def to_json(obj: Any, ensure_ascii: bool = False) -> str:
        """
        将对象转换为JSON字符串
        
        Args:
            obj: 对象
            ensure_ascii: 是否确保ASCII编码
            
        Returns:
            str: JSON字符串
        """
        def json_serializer(obj):
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            elif isinstance(obj, Decimal):
                return float(obj)
            raise TypeError(f'Object of type {type(obj)} is not JSON serializable')
        
        return json.dumps(obj, default=json_serializer, ensure_ascii=ensure_ascii, indent=2)
    
    @staticmethod
    def from_json(json_str: str) -> Any:
        """
        从JSON字符串解析对象
        
        Args:
            json_str: JSON字符串
            
        Returns:
            Any: 解析后的对象
        """
        try:
            return json.loads(json_str)
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def merge_dicts(dict1: Dict, dict2: Dict) -> Dict:
        """
        合并字典
        
        Args:
            dict1: 字典1
            dict2: 字典2
            
        Returns:
            Dict: 合并后的字典
        """
        result = dict1.copy()
        result.update(dict2)
        return result
    
    @staticmethod
    def filter_dict(data: Dict, allowed_keys: List[str]) -> Dict:
        """
        过滤字典
        
        Args:
            data: 原始字典
            allowed_keys: 允许的键
            
        Returns:
            Dict: 过滤后的字典
        """
        return {k: v for k, v in data.items() if k in allowed_keys}
    
    @staticmethod
    def remove_none_values(data: Dict) -> Dict:
        """
        移除字典中的None值
        
        Args:
            data: 原始字典
            
        Returns:
            Dict: 处理后的字典
        """
        return {k: v for k, v in data.items() if v is not None}

class ExportHelper:
    """
    导出辅助类
    
    提供数据导出功能
    """
    
    @staticmethod
    def to_csv(data: List[Dict], filename: str = None) -> str:
        """
        导出为CSV
        
        Args:
            data: 数据列表
            filename: 文件名
            
        Returns:
            str: CSV内容
        """
        if not data:
            return ''
        
        output = io.StringIO()
        
        # 获取字段名
        fieldnames = list(data[0].keys())
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in data:
            # 处理特殊类型
            processed_row = {}
            for key, value in row.items():
                if isinstance(value, (datetime, date)):
                    processed_row[key] = value.isoformat()
                elif isinstance(value, Decimal):
                    processed_row[key] = float(value)
                else:
                    processed_row[key] = value
            
            writer.writerow(processed_row)
        
        return output.getvalue()
    
    @staticmethod
    def to_excel(data: List[Dict], filename: str = None) -> bytes:
        """
        导出为Excel
        
        Args:
            data: 数据列表
            filename: 文件名
            
        Returns:
            bytes: Excel内容
        """
        try:
            import pandas as pd
            
            if not data:
                df = pd.DataFrame()
            else:
                # 处理特殊类型
                processed_data = []
                for row in data:
                    processed_row = {}
                    for key, value in row.items():
                        if isinstance(value, (datetime, date)):
                            processed_row[key] = value.isoformat()
                        elif isinstance(value, Decimal):
                            processed_row[key] = float(value)
                        else:
                            processed_row[key] = value
                    processed_data.append(processed_row)
                
                df = pd.DataFrame(processed_data)
            
            # 保存到内存
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Sheet1')
            
            return output.getvalue()
        
        except ImportError:
            raise ImportError('需要安装pandas和openpyxl库才能导出Excel文件')

def get_client_ip() -> str:
    """
    获取客户端IP地址
    
    Returns:
        str: IP地址
    """
    if request.environ.get('HTTP_X_FORWARDED_FOR') is None:
        return request.environ['REMOTE_ADDR']
    else:
        return request.environ['HTTP_X_FORWARDED_FOR']

def get_user_agent() -> str:
    """
    获取用户代理
    
    Returns:
        str: 用户代理字符串
    """
    return request.headers.get('User-Agent', '')

def log_request():
    """
    记录请求日志
    """
    logger = logging.getLogger(__name__)
    logger.info(f'{request.method} {request.url} - {get_client_ip()} - {get_user_agent()}')

def safe_int(value: Any, default: int = 0) -> int:
    """
    安全转换为整数
    
    Args:
        value: 值
        default: 默认值
        
    Returns:
        int: 整数值
    """
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value: Any, default: float = 0.0) -> float:
    """
    安全转换为浮点数
    
    Args:
        value: 值
        default: 默认值
        
    Returns:
        float: 浮点数值
    """
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_decimal(value: Any, default: Decimal = None) -> Decimal:
    """
    安全转换为Decimal
    
    Args:
        value: 值
        default: 默认值
        
    Returns:
        Decimal: Decimal值
    """
    if default is None:
        default = Decimal('0')
    
    try:
        return Decimal(str(value))
    except (ValueError, TypeError, InvalidOperation):
        return default