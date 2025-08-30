#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
创建管理员用户脚本
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import pymysql
from werkzeug.security import generate_password_hash
from config import Config

def create_admin_user():
    """创建管理员用户"""
    config = Config()
    
    # 数据库连接配置
    db_config = {
        'host': config.MYSQL_HOST,
        'port': config.MYSQL_PORT,
        'user': config.MYSQL_USER,
        'password': config.MYSQL_PASSWORD,
        'database': config.MYSQL_DATABASE,
        'charset': 'utf8mb4'
    }
    
    try:
        # 连接数据库
        connection = pymysql.connect(**db_config)
        cursor = connection.cursor()
        
        # 生成密码哈希
        password_hash = generate_password_hash('admin')
        
        # 检查admin用户是否已存在
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        existing_user = cursor.fetchone()
        
        if existing_user:
            # 更新现有用户的密码
            cursor.execute(
                "UPDATE users SET password = %s WHERE username = 'admin'",
                (password_hash,)
            )
            print("Admin用户密码已更新")
        else:
            # 创建新的admin用户
            cursor.execute(
                """INSERT INTO users (username, email, password, full_name, role, status) 
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                ('admin', 'admin@crm.com', password_hash, '系统管理员', 'admin', 'active')
            )
            print("Admin用户已创建")
        
        # 提交事务
        connection.commit()
        print("操作成功完成")
        print("用户名: admin")
        print("密码: admin")
        
    except Exception as e:
        print(f"操作失败: {str(e)}")
        if 'connection' in locals():
            connection.rollback()
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == '__main__':
    create_admin_user()