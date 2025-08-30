# -*- coding: utf-8 -*-
"""
CRM销售平台 - 数据库管理工具

提供数据库连接、查询、事务等功能
"""

import pymysql
import logging
from contextlib import contextmanager
from typing import Optional, Dict, Any, List, Tuple

class DatabaseManager:
    """
    数据库管理器
    
    负责数据库连接管理、查询执行、事务处理等
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        初始化数据库管理器
        
        Args:
            config: 配置字典，包含数据库连接信息
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # 数据库连接配置
        self.db_config = {
            'host': config.get('MYSQL_HOST', 'localhost'),
            'port': config.get('MYSQL_PORT', 3306),
            'user': config.get('MYSQL_USER', 'root'),
            'password': config.get('MYSQL_PASSWORD', ''),
            'database': config.get('MYSQL_DATABASE', 'crm_database'),
            'charset': config.get('DB_CHARSET', 'utf8mb4'),
            'autocommit': False,
            'cursorclass': pymysql.cursors.DictCursor
        }
    
    def get_connection(self) -> Optional[pymysql.Connection]:
        """
        获取数据库连接
        
        Returns:
            pymysql.Connection: 数据库连接对象，失败时返回None
        """
        try:
            connection = pymysql.connect(**self.db_config)
            return connection
        except Exception as e:
            self.logger.error(f'数据库连接失败: {str(e)}')
            return None
    
    @contextmanager
    def get_db_connection(self):
        """
        获取数据库连接的上下文管理器
        
        Yields:
            pymysql.Connection: 数据库连接对象
        """
        connection = None
        try:
            connection = self.get_connection()
            if connection is None:
                raise Exception('无法获取数据库连接')
            yield connection
        except Exception as e:
            if connection:
                connection.rollback()
            self.logger.error(f'数据库操作失败: {str(e)}')
            raise
        finally:
            if connection:
                connection.close()
    
    @contextmanager
    def get_db_cursor(self, connection: pymysql.Connection):
        """
        获取数据库游标的上下文管理器
        
        Args:
            connection: 数据库连接对象
            
        Yields:
            pymysql.cursors.Cursor: 数据库游标对象
        """
        cursor = None
        try:
            cursor = connection.cursor()
            yield cursor
        except Exception as e:
            self.logger.error(f'数据库游标操作失败: {str(e)}')
            raise
        finally:
            if cursor:
                cursor.close()
    
    def execute_query(self, sql: str, params: Optional[Tuple] = None) -> List[Dict[str, Any]]:
        """
        执行查询语句
        
        Args:
            sql: SQL查询语句
            params: 查询参数
            
        Returns:
            List[Dict[str, Any]]: 查询结果列表
        """
        try:
            with self.get_db_connection() as connection:
                with self.get_db_cursor(connection) as cursor:
                    cursor.execute(sql, params)
                    results = cursor.fetchall()
                    return results
        except Exception as e:
            self.logger.error(f'查询执行失败: {str(e)}, SQL: {sql}, Params: {params}')
            raise
    
    def execute_query_one(self, sql: str, params: Optional[Tuple] = None) -> Optional[Dict[str, Any]]:
        """
        执行查询语句并返回单条记录
        
        Args:
            sql: SQL查询语句
            params: 查询参数
            
        Returns:
            Optional[Dict[str, Any]]: 查询结果，无结果时返回None
        """
        try:
            with self.get_db_connection() as connection:
                with self.get_db_cursor(connection) as cursor:
                    cursor.execute(sql, params)
                    result = cursor.fetchone()
                    return result
        except Exception as e:
            self.logger.error(f'单条查询执行失败: {str(e)}, SQL: {sql}, Params: {params}')
            raise
    
    def execute_update(self, sql: str, params: Optional[Tuple] = None) -> int:
        """
        执行更新语句（INSERT、UPDATE、DELETE）
        
        Args:
            sql: SQL更新语句
            params: 更新参数
            
        Returns:
            int: 受影响的行数
        """
        try:
            with self.get_db_connection() as connection:
                with self.get_db_cursor(connection) as cursor:
                    affected_rows = cursor.execute(sql, params)
                    connection.commit()
                    return affected_rows
        except Exception as e:
            self.logger.error(f'更新执行失败: {str(e)}, SQL: {sql}, Params: {params}')
            raise
    
    def execute_insert(self, sql: str, params: Optional[Tuple] = None) -> int:
        """
        执行插入语句并返回插入的ID
        
        Args:
            sql: SQL插入语句
            params: 插入参数
            
        Returns:
            int: 插入记录的ID
        """
        try:
            with self.get_db_connection() as connection:
                with self.get_db_cursor(connection) as cursor:
                    cursor.execute(sql, params)
                    insert_id = connection.insert_id()
                    connection.commit()
                    return insert_id
        except Exception as e:
            self.logger.error(f'插入执行失败: {str(e)}, SQL: {sql}, Params: {params}')
            raise
    
    def execute_batch(self, sql: str, params_list: List[Tuple]) -> int:
        """
        批量执行SQL语句
        
        Args:
            sql: SQL语句
            params_list: 参数列表
            
        Returns:
            int: 受影响的总行数
        """
        try:
            with self.get_db_connection() as connection:
                with self.get_db_cursor(connection) as cursor:
                    affected_rows = cursor.executemany(sql, params_list)
                    connection.commit()
                    return affected_rows
        except Exception as e:
            self.logger.error(f'批量执行失败: {str(e)}, SQL: {sql}')
            raise
    
    @contextmanager
    def transaction(self):
        """
        事务上下文管理器
        
        Yields:
            Tuple[pymysql.Connection, pymysql.cursors.Cursor]: 连接和游标对象
        """
        connection = None
        cursor = None
        try:
            connection = self.get_connection()
            if connection is None:
                raise Exception('无法获取数据库连接')
            
            cursor = connection.cursor()
            connection.begin()
            
            yield connection, cursor
            
            connection.commit()
        except Exception as e:
            if connection:
                connection.rollback()
            self.logger.error(f'事务执行失败: {str(e)}')
            raise
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def test_connection(self) -> bool:
        """
        测试数据库连接
        
        Returns:
            bool: 连接成功返回True，失败返回False
        """
        try:
            connection = self.get_connection()
            if connection:
                connection.close()
                return True
            return False
        except Exception as e:
            self.logger.error(f'数据库连接测试失败: {str(e)}')
            return False
    
    def get_table_info(self, table_name: str) -> List[Dict[str, Any]]:
        """
        获取表结构信息
        
        Args:
            table_name: 表名
            
        Returns:
            List[Dict[str, Any]]: 表结构信息
        """
        sql = "DESCRIBE `{}`".format(table_name)
        return self.execute_query(sql)
    
    def get_table_count(self, table_name: str, where_clause: str = '', params: Optional[Tuple] = None) -> int:
        """
        获取表记录数
        
        Args:
            table_name: 表名
            where_clause: WHERE条件子句
            params: 查询参数
            
        Returns:
            int: 记录数
        """
        sql = f"SELECT COUNT(*) as count FROM `{table_name}`"
        if where_clause:
            sql += f" WHERE {where_clause}"
        
        result = self.execute_query_one(sql, params)
        return result['count'] if result else 0
    
    def build_insert_sql(self, table_name: str, data: Dict[str, Any]) -> Tuple[str, Tuple]:
        """
        构建插入SQL语句
        
        Args:
            table_name: 表名
            data: 插入数据字典
            
        Returns:
            Tuple[str, Tuple]: SQL语句和参数元组
        """
        columns = list(data.keys())
        placeholders = ', '.join(['%s'] * len(columns))
        column_names = ', '.join([f'`{col}`' for col in columns])
        
        sql = f"INSERT INTO `{table_name}` ({column_names}) VALUES ({placeholders})"
        params = tuple(data.values())
        
        return sql, params
    
    def build_update_sql(self, table_name: str, data: Dict[str, Any], where_clause: str) -> Tuple[str, Tuple]:
        """
        构建更新SQL语句
        
        Args:
            table_name: 表名
            data: 更新数据字典
            where_clause: WHERE条件子句
            
        Returns:
            Tuple[str, Tuple]: SQL语句和参数元组
        """
        set_clause = ', '.join([f'`{col}` = %s' for col in data.keys()])
        sql = f"UPDATE `{table_name}` SET {set_clause} WHERE {where_clause}"
        params = tuple(data.values())
        
        return sql, params
    
    def build_select_sql(self, table_name: str, columns: List[str] = None, 
                        where_clause: str = '', order_by: str = '', 
                        limit: int = None, offset: int = None) -> str:
        """
        构建查询SQL语句
        
        Args:
            table_name: 表名
            columns: 查询列名列表，None表示查询所有列
            where_clause: WHERE条件子句
            order_by: ORDER BY子句
            limit: LIMIT数量
            offset: OFFSET偏移量
            
        Returns:
            str: SQL查询语句
        """
        if columns:
            column_names = ', '.join([f'`{col}`' for col in columns])
        else:
            column_names = '*'
        
        sql = f"SELECT {column_names} FROM `{table_name}`"
        
        if where_clause:
            sql += f" WHERE {where_clause}"
        
        if order_by:
            sql += f" ORDER BY {order_by}"
        
        if limit is not None:
            sql += f" LIMIT {limit}"
            if offset is not None:
                sql += f" OFFSET {offset}"
        
        return sql