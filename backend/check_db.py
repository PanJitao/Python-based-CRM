#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
检查数据库表结构
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import pymysql
from config import Config

def check_database():
    """检查数据库表结构"""
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
        
        # 检查数据库是否存在
        cursor.execute("SHOW DATABASES LIKE %s", (config.MYSQL_DATABASE,))
        db_exists = cursor.fetchone()
        print(f"数据库 {config.MYSQL_DATABASE} 存在: {bool(db_exists)}")
        
        if db_exists:
            # 检查users表是否存在
            cursor.execute("SHOW TABLES LIKE 'users'")
            table_exists = cursor.fetchone()
            print(f"users表存在: {bool(table_exists)}")
            
            if table_exists:
                # 显示表结构
                cursor.execute("DESCRIBE users")
                columns = cursor.fetchall()
                print("\nusers表结构:")
                for column in columns:
                    print(f"  {column[0]} - {column[1]}")
            else:
                print("users表不存在，需要创建表")
        else:
            print("数据库不存在，需要创建数据库")
        
    except Exception as e:
        print(f"检查失败: {str(e)}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == '__main__':
    check_database()