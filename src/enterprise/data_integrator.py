"""
Enterprise Data Integration System

This module provides comprehensive data integration capabilities for connecting
to various enterprise data sources including CRM, databases, document repositories,
and real-time feeds.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass, field
from enum import Enum
import aiohttp
import pandas as pd
from sqlalchemy import create_engine, text
from pymongo import MongoClient
import redis
from pydantic import BaseModel, Field
import structlog

logger = structlog.get_logger(__name__)


class DataSourceType(Enum):
    """Types of data sources"""
    DATABASE = "database"
    API = "api"
    FILE_SYSTEM = "file_system"
    CRM = "crm"
    DOCUMENT_STORE = "document_store"
    REAL_TIME_FEED = "real_time_feed"
    CACHE = "cache"


class DataFormat(Enum):
    """Supported data formats"""
    JSON = "json"
    CSV = "csv"
    XML = "xml"
    PARQUET = "parquet"
    TEXT = "text"
    BINARY = "binary"


@dataclass
class DataSource:
    """Configuration for a data source"""
    name: str
    source_type: DataSourceType
    connection_config: Dict[str, Any]
    schema: Optional[Dict[str, Any]] = None
    refresh_interval: int = 3600  # seconds
    last_updated: Optional[datetime] = None
    is_active: bool = True


@dataclass
class DataRecord:
    """Individual data record"""
    id: str
    content: str
    metadata: Dict[str, Any]
    source: str
    timestamp: datetime
    format: DataFormat
    size_bytes: int = 0


@dataclass
class IntegrationResult:
    """Result of data integration operation"""
    source_name: str
    records_processed: int
    records_successful: int
    records_failed: int
    processing_time_ms: float
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class EnterpriseDataIntegrator:
    """
    Enterprise Data Integration System
    
    This system provides unified access to multiple enterprise data sources
    with real-time synchronization, data transformation, and caching capabilities.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.data_sources: Dict[str, DataSource] = {}
        self.connections: Dict[str, Any] = {}
        self.cache = None
        self.transformers: Dict[str, Callable] = {}
        self._setup_integration()
    
    def _setup_integration(self):
        """Initialize integration components"""
        # Setup cache
        if self.config.get("redis_url"):
            self.cache = redis.from_url(self.config["redis_url"])
        
        # Register default transformers
        self._register_default_transformers()
    
    def _register_default_transformers(self):
        """Register default data transformers"""
        self.transformers = {
            "json_to_text": self._json_to_text,
            "csv_to_records": self._csv_to_records,
            "normalize_metadata": self._normalize_metadata,
            "extract_entities": self._extract_entities
        }
    
    async def register_data_source(
        self, 
        name: str, 
        source_type: DataSourceType,
        connection_config: Dict[str, Any],
        schema: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Register a new data source
        
        Args:
            name: Unique name for the data source
            source_type: Type of data source
            connection_config: Connection configuration
            schema: Optional data schema
            
        Returns:
            Success status
        """
        try:
            data_source = DataSource(
                name=name,
                source_type=source_type,
                connection_config=connection_config,
                schema=schema
            )
            
            # Test connection
            connection = await self._create_connection(source_type, connection_config)
            if connection:
                self.connections[name] = connection
                self.data_sources[name] = data_source
                
                logger.info(f"Data source '{name}' registered successfully")
                return True
            else:
                logger.error(f"Failed to connect to data source '{name}'")
                return False
                
        except Exception as e:
            logger.error(f"Failed to register data source '{name}'", error=str(e))
            return False
    
    async def _create_connection(
        self, 
        source_type: DataSourceType, 
        config: Dict[str, Any]
    ) -> Optional[Any]:
        """Create connection to data source"""
        try:
            if source_type == DataSourceType.DATABASE:
                return await self._create_database_connection(config)
            elif source_type == DataSourceType.API:
                return await self._create_api_connection(config)
            elif source_type == DataSourceType.CRM:
                return await self._create_crm_connection(config)
            elif source_type == DataSourceType.DOCUMENT_STORE:
                return await self._create_document_store_connection(config)
            elif source_type == DataSourceType.CACHE:
                return await self._create_cache_connection(config)
            else:
                logger.warning(f"Unsupported data source type: {source_type}")
                return None
                
        except Exception as e:
            logger.error(f"Connection creation failed", source_type=source_type.value, error=str(e))
            return None
    
    async def _create_database_connection(self, config: Dict[str, Any]):
        """Create database connection"""
        connection_string = config.get("connection_string")
        if not connection_string:
            raise ValueError("Database connection string required")
        
        engine = create_engine(connection_string)
        return engine
    
    async def _create_api_connection(self, config: Dict[str, Any]):
        """Create API connection"""
        return {
            "base_url": config.get("base_url"),
            "headers": config.get("headers", {}),
            "auth": config.get("auth"),
            "timeout": config.get("timeout", 30)
        }
    
    async def _create_crm_connection(self, config: Dict[str, Any]):
        """Create CRM connection"""
        # Mock CRM connection - in production, integrate with Salesforce, HubSpot, etc.
        return {
            "crm_type": config.get("crm_type", "salesforce"),
            "api_key": config.get("api_key"),
            "base_url": config.get("base_url"),
            "version": config.get("version", "v1")
        }
    
    async def _create_document_store_connection(self, config: Dict[str, Any]):
        """Create document store connection"""
        if config.get("store_type") == "mongodb":
            client = MongoClient(config.get("connection_string"))
            return client
        else:
            # File system connection
            return {"path": config.get("path", "./documents")}
    
    async def _create_cache_connection(self, config: Dict[str, Any]):
        """Create cache connection"""
        return redis.from_url(config.get("connection_string"))
    
    async def fetch_data(
        self, 
        source_name: str, 
        query: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> List[DataRecord]:
        """
        Fetch data from a specific source
        
        Args:
            source_name: Name of the data source
            query: Optional query string
            filters: Optional filters to apply
            limit: Maximum number of records to return
            
        Returns:
            List of data records
        """
        if source_name not in self.data_sources:
            logger.error(f"Data source '{source_name}' not found")
            return []
        
        data_source = self.data_sources[source_name]
        connection = self.connections.get(source_name)
        
        if not connection:
            logger.error(f"No connection available for source '{source_name}'")
            return []
        
        try:
            # Check cache first
            cache_key = f"data:{source_name}:{hash(str(query) + str(filters))}"
            cached_data = await self._get_from_cache(cache_key)
            if cached_data:
                logger.info(f"Retrieved {len(cached_data)} records from cache")
                return cached_data
            
            # Fetch from source
            records = await self._fetch_from_source(
                data_source, connection, query, filters, limit
            )
            
            # Transform records
            transformed_records = await self._transform_records(records, data_source)
            
            # Cache results
            await self._cache_data(cache_key, transformed_records)
            
            logger.info(f"Fetched {len(transformed_records)} records from '{source_name}'")
            return transformed_records
            
        except Exception as e:
            logger.error(f"Failed to fetch data from '{source_name}'", error=str(e))
            return []
    
    async def _fetch_from_source(
        self,
        data_source: DataSource,
        connection: Any,
        query: Optional[str],
        filters: Optional[Dict[str, Any]],
        limit: Optional[int]
    ) -> List[DataRecord]:
        """Fetch data from specific source type"""
        if data_source.source_type == DataSourceType.DATABASE:
            return await self._fetch_from_database(connection, query, filters, limit)
        elif data_source.source_type == DataSourceType.API:
            return await self._fetch_from_api(connection, query, filters, limit)
        elif data_source.source_type == DataSourceType.CRM:
            return await self._fetch_from_crm(connection, query, filters, limit)
        elif data_source.source_type == DataSourceType.DOCUMENT_STORE:
            return await self._fetch_from_document_store(connection, query, filters, limit)
        else:
            logger.warning(f"Unsupported fetch operation for {data_source.source_type}")
            return []
    
    async def _fetch_from_database(
        self, 
        connection: Any, 
        query: str, 
        filters: Optional[Dict[str, Any]], 
        limit: Optional[int]
    ) -> List[DataRecord]:
        """Fetch data from database"""
        try:
            if not query:
                query = "SELECT * FROM data_table"
            
            if limit:
                query += f" LIMIT {limit}"
            
            with connection.connect() as conn:
                result = conn.execute(text(query))
                rows = result.fetchall()
                
                records = []
                for row in rows:
                    record = DataRecord(
                        id=str(hash(str(row))),
                        content=json.dumps(dict(row._mapping)),
                        metadata={"table": "data_table"},
                        source="database",
                        timestamp=datetime.now(),
                        format=DataFormat.JSON
                    )
                    records.append(record)
                
                return records
                
        except Exception as e:
            logger.error("Database fetch failed", error=str(e))
            return []
    
    async def _fetch_from_api(
        self, 
        connection: Dict[str, Any], 
        query: str, 
        filters: Optional[Dict[str, Any]], 
        limit: Optional[int]
    ) -> List[DataRecord]:
        """Fetch data from API"""
        try:
            async with aiohttp.ClientSession() as session:
                url = connection["base_url"]
                if query:
                    url += f"/{query}"
                
                headers = connection.get("headers", {})
                timeout = aiohttp.ClientTimeout(total=connection.get("timeout", 30))
                
                async with session.get(url, headers=headers, timeout=timeout) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        records = []
                        if isinstance(data, list):
                            for item in data[:limit] if limit else data:
                                record = DataRecord(
                                    id=str(hash(str(item))),
                                    content=json.dumps(item),
                                    metadata={"api_source": connection["base_url"]},
                                    source="api",
                                    timestamp=datetime.now(),
                                    format=DataFormat.JSON
                                )
                                records.append(record)
                        else:
                            record = DataRecord(
                                id=str(hash(str(data))),
                                content=json.dumps(data),
                                metadata={"api_source": connection["base_url"]},
                                source="api",
                                timestamp=datetime.now(),
                                format=DataFormat.JSON
                            )
                            records.append(record)
                        
                        return records
                    else:
                        logger.error(f"API request failed with status {response.status}")
                        return []
                        
        except Exception as e:
            logger.error("API fetch failed", error=str(e))
            return []
    
    async def _fetch_from_crm(
        self, 
        connection: Dict[str, Any], 
        query: str, 
        filters: Optional[Dict[str, Any]], 
        limit: Optional[int]
    ) -> List[DataRecord]:
        """Fetch data from CRM system"""
        # Mock CRM data - in production, integrate with actual CRM APIs
        mock_crm_data = [
            {
                "customer_id": "CUST_001",
                "name": "Acme Corporation",
                "industry": "Technology",
                "revenue": 1000000,
                "last_contact": "2024-01-15"
            },
            {
                "customer_id": "CUST_002", 
                "name": "Beta Industries",
                "industry": "Manufacturing",
                "revenue": 2500000,
                "last_contact": "2024-01-20"
            }
        ]
        
        records = []
        for item in mock_crm_data[:limit] if limit else mock_crm_data:
            record = DataRecord(
                id=item["customer_id"],
                content=json.dumps(item),
                metadata={"crm_type": connection.get("crm_type", "salesforce")},
                source="crm",
                timestamp=datetime.now(),
                format=DataFormat.JSON
            )
            records.append(record)
        
        return records
    
    async def _fetch_from_document_store(
        self, 
        connection: Any, 
        query: str, 
        filters: Optional[Dict[str, Any]], 
        limit: Optional[int]
    ) -> List[DataRecord]:
        """Fetch data from document store"""
        # Mock document store - in production, integrate with actual document systems
        mock_documents = [
            {
                "title": "Enterprise AI Strategy",
                "content": "This document outlines our enterprise AI strategy...",
                "type": "strategy",
                "department": "executive"
            },
            {
                "title": "Technical Implementation Guide",
                "content": "This guide covers technical implementation details...",
                "type": "technical",
                "department": "engineering"
            }
        ]
        
        records = []
        for doc in mock_documents[:limit] if limit else mock_documents:
            record = DataRecord(
                id=str(hash(doc["title"])),
                content=doc["content"],
                metadata={
                    "title": doc["title"],
                    "type": doc["type"],
                    "department": doc["department"]
                },
                source="document_store",
                timestamp=datetime.now(),
                format=DataFormat.TEXT
            )
            records.append(record)
        
        return records
    
    async def _transform_records(
        self, 
        records: List[DataRecord], 
        data_source: DataSource
    ) -> List[DataRecord]:
        """Transform records based on source configuration"""
        transformed_records = []
        
        for record in records:
            # Apply transformations
            transformed_content = record.content
            transformed_metadata = record.metadata.copy()
            
            # Apply schema transformations
            if data_source.schema:
                transformed_content = self._apply_schema_transform(
                    transformed_content, data_source.schema
                )
            
            # Apply registered transformers
            for transformer_name, transformer_func in self.transformers.items():
                if transformer_name in data_source.connection_config.get("transformers", []):
                    transformed_content = transformer_func(transformed_content)
            
            # Update record
            record.content = transformed_content
            record.metadata.update(transformed_metadata)
            record.size_bytes = len(transformed_content.encode('utf-8'))
            
            transformed_records.append(record)
        
        return transformed_records
    
    def _apply_schema_transform(self, content: str, schema: Dict[str, Any]) -> str:
        """Apply schema-based transformations"""
        try:
            data = json.loads(content)
            transformed_data = {}
            
            for field, config in schema.items():
                if field in data:
                    if config.get("type") == "string":
                        transformed_data[field] = str(data[field])
                    elif config.get("type") == "number":
                        transformed_data[field] = float(data[field])
                    elif config.get("type") == "boolean":
                        transformed_data[field] = bool(data[field])
                    else:
                        transformed_data[field] = data[field]
            
            return json.dumps(transformed_data)
            
        except Exception as e:
            logger.error("Schema transformation failed", error=str(e))
            return content
    
    def _json_to_text(self, content: str) -> str:
        """Transform JSON to readable text"""
        try:
            data = json.loads(content)
            return json.dumps(data, indent=2)
        except:
            return content
    
    def _csv_to_records(self, content: str) -> str:
        """Transform CSV to structured records"""
        try:
            df = pd.read_csv(content)
            return df.to_json(orient='records')
        except:
            return content
    
    def _normalize_metadata(self, content: str) -> str:
        """Normalize metadata in content"""
        # Simple normalization - in production, implement comprehensive normalization
        return content
    
    def _extract_entities(self, content: str) -> str:
        """Extract entities from content"""
        # Simple entity extraction - in production, use NLP libraries
        return content
    
    async def _get_from_cache(self, cache_key: str) -> Optional[List[DataRecord]]:
        """Get data from cache"""
        if not self.cache:
            return None
        
        try:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error("Cache retrieval failed", error=str(e))
        
        return None
    
    async def _cache_data(self, cache_key: str, data: List[DataRecord]):
        """Cache data"""
        if not self.cache:
            return
        
        try:
            # Convert records to JSON-serializable format
            cache_data = []
            for record in data:
                cache_data.append({
                    "id": record.id,
                    "content": record.content,
                    "metadata": record.metadata,
                    "source": record.source,
                    "timestamp": record.timestamp.isoformat(),
                    "format": record.format.value,
                    "size_bytes": record.size_bytes
                })
            
            self.cache.setex(cache_key, 3600, json.dumps(cache_data))  # 1 hour TTL
        except Exception as e:
            logger.error("Caching failed", error=str(e))
    
    async def sync_all_sources(self) -> Dict[str, IntegrationResult]:
        """Sync all registered data sources"""
        results = {}
        
        for source_name, data_source in self.data_sources.items():
            if not data_source.is_active:
                continue
            
            start_time = datetime.now()
            
            try:
                # Fetch data
                records = await self.fetch_data(source_name)
                
                # Calculate metrics
                processing_time = (datetime.now() - start_time).total_seconds() * 1000
                
                result = IntegrationResult(
                    source_name=source_name,
                    records_processed=len(records),
                    records_successful=len(records),
                    records_failed=0,
                    processing_time_ms=processing_time
                )
                
                results[source_name] = result
                
                # Update last updated timestamp
                data_source.last_updated = datetime.now()
                
            except Exception as e:
                processing_time = (datetime.now() - start_time).total_seconds() * 1000
                
                result = IntegrationResult(
                    source_name=source_name,
                    records_processed=0,
                    records_successful=0,
                    records_failed=1,
                    processing_time_ms=processing_time,
                    errors=[str(e)]
                )
                
                results[source_name] = result
        
        logger.info(f"Sync completed for {len(results)} sources")
        return results
    
    def get_integration_status(self) -> Dict[str, Any]:
        """Get status of all data sources"""
        status = {
            "total_sources": len(self.data_sources),
            "active_sources": len([s for s in self.data_sources.values() if s.is_active]),
            "sources": {}
        }
        
        for name, source in self.data_sources.items():
            status["sources"][name] = {
                "type": source.source_type.value,
                "is_active": source.is_active,
                "last_updated": source.last_updated.isoformat() if source.last_updated else None,
                "refresh_interval": source.refresh_interval
            }
        
        return status


# Example usage and testing
async def main():
    """Example usage of the Enterprise Data Integrator"""
    config = {
        "redis_url": "redis://localhost:6379/0"
    }
    
    integrator = EnterpriseDataIntegrator(config)
    
    # Register database source
    await integrator.register_data_source(
        name="main_database",
        source_type=DataSourceType.DATABASE,
        connection_config={
            "connection_string": "sqlite:///./data/enterprise.db"
        }
    )
    
    # Register API source
    await integrator.register_data_source(
        name="external_api",
        source_type=DataSourceType.API,
        connection_config={
            "base_url": "https://api.example.com",
            "headers": {"Authorization": "Bearer token"},
            "timeout": 30
        }
    )
    
    # Register CRM source
    await integrator.register_data_source(
        name="salesforce_crm",
        source_type=DataSourceType.CRM,
        connection_config={
            "crm_type": "salesforce",
            "api_key": "your_api_key",
            "base_url": "https://api.salesforce.com"
        }
    )
    
    # Fetch data from sources
    db_data = await integrator.fetch_data("main_database", "SELECT * FROM users LIMIT 5")
    api_data = await integrator.fetch_data("external_api", "users")
    crm_data = await integrator.fetch_data("salesforce_crm")
    
    print(f"Database records: {len(db_data)}")
    print(f"API records: {len(api_data)}")
    print(f"CRM records: {len(crm_data)}")
    
    # Sync all sources
    sync_results = await integrator.sync_all_sources()
    print(f"Sync results: {sync_results}")
    
    # Get integration status
    status = integrator.get_integration_status()
    print(f"Integration status: {status}")


if __name__ == "__main__":
    asyncio.run(main())
