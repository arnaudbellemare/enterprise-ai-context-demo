"""
Supabase Integration System for Enterprise AI

This module provides comprehensive integration with Supabase for enterprise
AI systems, including real-time data synchronization, authentication,
and vector storage capabilities.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass, field
from enum import Enum
import os
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
import structlog

logger = structlog.get_logger(__name__)


class SupabaseTable(Enum):
    """Supabase table names"""
    USERS = "users"
    CONTEXT_ITEMS = "context_items"
    AI_SESSIONS = "ai_sessions"
    METRICS = "metrics"
    AUDIT_LOGS = "audit_logs"
    KNOWLEDGE_BASE = "knowledge_base"
    VECTOR_EMBEDDINGS = "vector_embeddings"


@dataclass
class SupabaseConfig:
    """Supabase configuration"""
    url: str
    anon_key: str
    service_role_key: Optional[str] = None
    options: Optional[ClientOptions] = None


@dataclass
class SupabaseRecord:
    """Supabase database record"""
    id: str
    table_name: str
    data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)


class SupabaseIntegrator:
    """
    Supabase Integration System for Enterprise AI
    
    Provides comprehensive integration with Supabase including real-time
    data synchronization, authentication, vector storage, and analytics.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.client: Optional[Client] = None
        self.realtime_client = None
        self.storage_client = None
        self.auth_client = None
        self._setup_supabase()
    
    def _setup_supabase(self):
        """Initialize Supabase client and services"""
        try:
            supabase_url = self.config.get("SUPABASE_URL") or os.getenv("SUPABASE_URL")
            supabase_key = self.config.get("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError("Supabase URL and key are required")
            
            # Create Supabase client
            self.client = create_client(supabase_url, supabase_key)
            
            # Initialize services
            self.realtime_client = self.client.realtime
            self.storage_client = self.client.storage
            self.auth_client = self.client.auth
            
            logger.info("Supabase client initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize Supabase client", error=str(e))
            raise
    
    async def create_tables(self) -> bool:
        """Create required tables in Supabase"""
        try:
            # This would typically be done via Supabase migrations
            # For now, we'll assume tables exist or create them via SQL
            
            table_definitions = {
                SupabaseTable.USERS: """
                    CREATE TABLE IF NOT EXISTS users (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        email TEXT UNIQUE NOT NULL,
                        username TEXT UNIQUE NOT NULL,
                        roles TEXT[] DEFAULT '{}',
                        security_level TEXT DEFAULT 'internal',
                        permissions TEXT[] DEFAULT '{}',
                        is_active BOOLEAN DEFAULT true,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """,
                SupabaseTable.CONTEXT_ITEMS: """
                    CREATE TABLE IF NOT EXISTS context_items (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID REFERENCES users(id),
                        session_id TEXT,
                        content TEXT NOT NULL,
                        source TEXT NOT NULL,
                        relevance_score FLOAT DEFAULT 0.0,
                        metadata JSONB DEFAULT '{}',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """,
                SupabaseTable.AI_SESSIONS: """
                    CREATE TABLE IF NOT EXISTS ai_sessions (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID REFERENCES users(id),
                        session_name TEXT,
                        context_data JSONB DEFAULT '{}',
                        gepa_optimizations JSONB DEFAULT '{}',
                        performance_metrics JSONB DEFAULT '{}',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """,
                SupabaseTable.METRICS: """
                    CREATE TABLE IF NOT EXISTS metrics (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        metric_name TEXT NOT NULL,
                        value FLOAT NOT NULL,
                        metadata JSONB DEFAULT '{}',
                        tags JSONB DEFAULT '{}',
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """,
                SupabaseTable.AUDIT_LOGS: """
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID REFERENCES users(id),
                        action TEXT NOT NULL,
                        resource TEXT NOT NULL,
                        ip_address TEXT,
                        user_agent TEXT,
                        success BOOLEAN DEFAULT false,
                        details JSONB DEFAULT '{}',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """,
                SupabaseTable.KNOWLEDGE_BASE: """
                    CREATE TABLE IF NOT EXISTS knowledge_base (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        title TEXT NOT NULL,
                        content TEXT NOT NULL,
                        content_type TEXT DEFAULT 'text',
                        source TEXT,
                        metadata JSONB DEFAULT '{}',
                        embedding VECTOR(1536),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """,
                SupabaseTable.VECTOR_EMBEDDINGS: """
                    CREATE TABLE IF NOT EXISTS vector_embeddings (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        content TEXT NOT NULL,
                        embedding VECTOR(1536),
                        metadata JSONB DEFAULT '{}',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """
            }
            
            # Note: In production, these would be created via Supabase migrations
            # For now, we'll just log the table definitions
            for table_name, definition in table_definitions.items():
                logger.info(f"Table definition for {table_name.value}: {definition[:100]}...")
            
            return True
            
        except Exception as e:
            logger.error("Failed to create tables", error=str(e))
            return False
    
    async def insert_record(
        self,
        table_name: SupabaseTable,
        data: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Optional[SupabaseRecord]:
        """
        Insert a record into Supabase
        
        Args:
            table_name: Name of the table
            data: Data to insert
            user_id: Optional user ID for user-specific data
            
        Returns:
            Inserted record or None if failed
        """
        try:
            # Add user_id if provided
            if user_id and "user_id" not in data:
                data["user_id"] = user_id
            
            # Insert record
            result = self.client.table(table_name.value).insert(data).execute()
            
            if result.data:
                record_data = result.data[0]
                record = SupabaseRecord(
                    id=record_data["id"],
                    table_name=table_name.value,
                    data=record_data,
                    created_at=datetime.fromisoformat(record_data["created_at"].replace("Z", "+00:00")),
                    updated_at=datetime.fromisoformat(record_data.get("updated_at", record_data["created_at"]).replace("Z", "+00:00"))
                )
                
                logger.info(f"Record inserted into {table_name.value}: {record.id}")
                return record
            else:
                logger.error(f"Failed to insert record into {table_name.value}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to insert record into {table_name.value}", error=str(e))
            return None
    
    async def get_records(
        self,
        table_name: SupabaseTable,
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        order_by: Optional[str] = None
    ) -> List[SupabaseRecord]:
        """
        Get records from Supabase table
        
        Args:
            table_name: Name of the table
            filters: Optional filters to apply
            limit: Maximum number of records to return
            order_by: Field to order by
            
        Returns:
            List of records
        """
        try:
            query = self.client.table(table_name.value).select("*")
            
            # Apply filters
            if filters:
                for key, value in filters.items():
                    if isinstance(value, list):
                        query = query.in_(key, value)
                    else:
                        query = query.eq(key, value)
            
            # Apply ordering
            if order_by:
                query = query.order(order_by, desc=True)
            
            # Apply limit
            if limit:
                query = query.limit(limit)
            
            result = query.execute()
            
            records = []
            for record_data in result.data:
                record = SupabaseRecord(
                    id=record_data["id"],
                    table_name=table_name.value,
                    data=record_data,
                    created_at=datetime.fromisoformat(record_data["created_at"].replace("Z", "+00:00")),
                    updated_at=datetime.fromisoformat(record_data.get("updated_at", record_data["created_at"]).replace("Z", "+00:00"))
                )
                records.append(record)
            
            logger.info(f"Retrieved {len(records)} records from {table_name.value}")
            return records
            
        except Exception as e:
            logger.error(f"Failed to get records from {table_name.value}", error=str(e))
            return []
    
    async def update_record(
        self,
        table_name: SupabaseTable,
        record_id: str,
        data: Dict[str, Any]
    ) -> Optional[SupabaseRecord]:
        """
        Update a record in Supabase
        
        Args:
            table_name: Name of the table
            record_id: ID of the record to update
            data: Data to update
            
        Returns:
            Updated record or None if failed
        """
        try:
            # Add updated_at timestamp
            data["updated_at"] = datetime.now().isoformat()
            
            result = self.client.table(table_name.value).update(data).eq("id", record_id).execute()
            
            if result.data:
                record_data = result.data[0]
                record = SupabaseRecord(
                    id=record_data["id"],
                    table_name=table_name.value,
                    data=record_data,
                    created_at=datetime.fromisoformat(record_data["created_at"].replace("Z", "+00:00")),
                    updated_at=datetime.fromisoformat(record_data.get("updated_at", record_data["created_at"]).replace("Z", "+00:00"))
                )
                
                logger.info(f"Record updated in {table_name.value}: {record.id}")
                return record
            else:
                logger.error(f"Failed to update record {record_id} in {table_name.value}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to update record {record_id} in {table_name.value}", error=str(e))
            return None
    
    async def delete_record(
        self,
        table_name: SupabaseTable,
        record_id: str
    ) -> bool:
        """
        Delete a record from Supabase
        
        Args:
            table_name: Name of the table
            record_id: ID of the record to delete
            
        Returns:
            Success status
        """
        try:
            result = self.client.table(table_name.value).delete().eq("id", record_id).execute()
            
            if result.data:
                logger.info(f"Record deleted from {table_name.value}: {record_id}")
                return True
            else:
                logger.error(f"Failed to delete record {record_id} from {table_name.value}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete record {record_id} from {table_name.value}", error=str(e))
            return False
    
    async def store_vector_embedding(
        self,
        content: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Store vector embedding in Supabase
        
        Args:
            content: Text content
            embedding: Vector embedding
            metadata: Optional metadata
            
        Returns:
            Record ID or None if failed
        """
        try:
            data = {
                "content": content,
                "embedding": embedding,
                "metadata": metadata or {}
            }
            
            result = await self.insert_record(SupabaseTable.VECTOR_EMBEDDINGS, data)
            return result.id if result else None
            
        except Exception as e:
            logger.error("Failed to store vector embedding", error=str(e))
            return None
    
    async def search_similar_vectors(
        self,
        query_embedding: List[float],
        limit: int = 10,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors using Supabase vector search
        
        Args:
            query_embedding: Query vector
            limit: Maximum number of results
            similarity_threshold: Minimum similarity score
            
        Returns:
            List of similar records
        """
        try:
            # Use Supabase's vector similarity search
            result = self.client.rpc(
                "match_embeddings",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": similarity_threshold,
                    "match_count": limit
                }
            ).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error("Vector search failed", error=str(e))
            return []
    
    async def setup_realtime_subscription(
        self,
        table_name: SupabaseTable,
        callback: Callable[[Dict[str, Any]], None]
    ) -> bool:
        """
        Setup real-time subscription for table changes
        
        Args:
            table_name: Name of the table to subscribe to
            callback: Callback function for handling changes
            
        Returns:
            Success status
        """
        try:
            def handle_change(payload):
                try:
                    callback(payload)
                except Exception as e:
                    logger.error("Realtime callback error", error=str(e))
            
            # Subscribe to table changes
            subscription = self.realtime_client.channel(f"public:{table_name.value}").on(
                "postgres_changes",
                {
                    "event": "*",
                    "schema": "public",
                    "table": table_name.value
                },
                handle_change
            ).subscribe()
            
            logger.info(f"Realtime subscription setup for {table_name.value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to setup realtime subscription for {table_name.value}", error=str(e))
            return False
    
    async def upload_file(
        self,
        bucket_name: str,
        file_path: str,
        file_content: bytes,
        content_type: str = "application/octet-stream"
    ) -> Optional[str]:
        """
        Upload file to Supabase Storage
        
        Args:
            bucket_name: Name of the storage bucket
            file_path: Path in the bucket
            file_content: File content as bytes
            content_type: MIME type of the file
            
        Returns:
            Public URL or None if failed
        """
        try:
            result = self.storage_client.from_(bucket_name).upload(
                file_path,
                file_content,
                {"content-type": content_type}
            )
            
            if result:
                # Get public URL
                public_url = self.storage_client.from_(bucket_name).get_public_url(file_path)
                logger.info(f"File uploaded to {bucket_name}/{file_path}")
                return public_url
            else:
                logger.error(f"Failed to upload file to {bucket_name}/{file_path}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to upload file to {bucket_name}/{file_path}", error=str(e))
            return None
    
    async def download_file(
        self,
        bucket_name: str,
        file_path: str
    ) -> Optional[bytes]:
        """
        Download file from Supabase Storage
        
        Args:
            bucket_name: Name of the storage bucket
            file_path: Path in the bucket
            
        Returns:
            File content as bytes or None if failed
        """
        try:
            result = self.storage_client.from_(bucket_name).download(file_path)
            
            if result:
                logger.info(f"File downloaded from {bucket_name}/{file_path}")
                return result
            else:
                logger.error(f"Failed to download file from {bucket_name}/{file_path}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to download file from {bucket_name}/{file_path}", error=str(e))
            return None
    
    async def get_analytics_data(
        self,
        metric_name: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        Get analytics data from Supabase
        
        Args:
            metric_name: Optional metric name filter
            start_date: Optional start date filter
            end_date: Optional end date filter
            limit: Maximum number of records
            
        Returns:
            List of analytics records
        """
        try:
            filters = {}
            
            if metric_name:
                filters["metric_name"] = metric_name
            
            if start_date:
                filters["timestamp"] = {"gte": start_date.isoformat()}
            
            if end_date:
                filters["timestamp"] = {"lte": end_date.isoformat()}
            
            records = await self.get_records(
                SupabaseTable.METRICS,
                filters=filters,
                limit=limit,
                order_by="timestamp"
            )
            
            return [record.data for record in records]
            
        except Exception as e:
            logger.error("Failed to get analytics data", error=str(e))
            return []
    
    def get_connection_status(self) -> Dict[str, Any]:
        """Get Supabase connection status"""
        return {
            "connected": self.client is not None,
            "realtime_available": self.realtime_client is not None,
            "storage_available": self.storage_client is not None,
            "auth_available": self.auth_client is not None,
            "config": {
                "url": self.config.get("SUPABASE_URL", "not_set"),
                "has_anon_key": bool(self.config.get("SUPABASE_ANON_KEY")),
                "has_service_key": bool(self.config.get("SUPABASE_SERVICE_ROLE_KEY"))
            }
        }


# Example usage and testing
async def main():
    """Example usage of the Supabase Integrator"""
    config = {
        "SUPABASE_URL": "your_supabase_url",
        "SUPABASE_ANON_KEY": "your_supabase_anon_key"
    }
    
    integrator = SupabaseIntegrator(config)
    
    # Create tables
    await integrator.create_tables()
    
    # Insert a test record
    test_data = {
        "email": "test@example.com",
        "username": "testuser",
        "roles": ["user"],
        "security_level": "internal"
    }
    
    record = await integrator.insert_record(SupabaseTable.USERS, test_data)
    if record:
        print(f"User created: {record.id}")
        
        # Update the record
        updated_record = await integrator.update_record(
            SupabaseTable.USERS,
            record.id,
            {"is_active": True}
        )
        print(f"User updated: {updated_record.id if updated_record else 'Failed'}")
    
    # Get records
    users = await integrator.get_records(SupabaseTable.USERS, limit=10)
    print(f"Retrieved {len(users)} users")
    
    # Get connection status
    status = integrator.get_connection_status()
    print(f"Connection status: {status}")


if __name__ == "__main__":
    asyncio.run(main())
