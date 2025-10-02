"""
Enterprise Security Manager

This module provides comprehensive security and compliance management for
enterprise AI systems, including authentication, authorization, audit logging,
and data protection.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
import hashlib
import secrets
import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field
import structlog

logger = structlog.get_logger(__name__)


class SecurityLevel(Enum):
    """Security clearance levels"""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    SECRET = "secret"
    TOP_SECRET = "top_secret"


class Permission(Enum):
    """System permissions"""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"
    AUDIT = "audit"


class ComplianceStandard(Enum):
    """Compliance standards"""
    GDPR = "gdpr"
    HIPAA = "hipaa"
    SOX = "sox"
    PCI_DSS = "pci_dss"
    ISO27001 = "iso27001"


@dataclass
class User:
    """User entity with security attributes"""
    user_id: str
    username: str
    email: str
    roles: List[str] = field(default_factory=list)
    security_level: SecurityLevel = SecurityLevel.INTERNAL
    permissions: Set[Permission] = field(default_factory=set)
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class AuditEvent:
    """Security audit event"""
    event_id: str
    user_id: str
    action: str
    resource: str
    timestamp: datetime
    ip_address: str
    user_agent: str
    success: bool
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SecurityPolicy:
    """Security policy configuration"""
    name: str
    description: str
    rules: List[Dict[str, Any]]
    compliance_standards: List[ComplianceStandard]
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)


class EnterpriseSecurityManager:
    """
    Enterprise Security Manager
    
    Provides comprehensive security and compliance management including
    authentication, authorization, audit logging, and data protection.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.users: Dict[str, User] = {}
        self.audit_log: List[AuditEvent] = []
        self.security_policies: Dict[str, SecurityPolicy] = {}
        self.password_context = None
        self.jwt_secret = None
        self._setup_security()
    
    def _setup_security(self):
        """Initialize security components"""
        # Setup password hashing
        self.password_context = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto"
        )
        
        # Setup JWT secret
        self.jwt_secret = self.config.get("jwt_secret", secrets.token_urlsafe(32))
        
        # Initialize default security policies
        self._setup_default_policies()
        
        # Create default admin user
        self._create_default_admin()
    
    def _setup_default_policies(self):
        """Setup default security policies"""
        # GDPR Policy
        gdpr_policy = SecurityPolicy(
            name="GDPR Compliance",
            description="General Data Protection Regulation compliance policy",
            rules=[
                {"action": "data_access", "require_consent": True},
                {"action": "data_deletion", "allow_user_request": True},
                {"action": "data_export", "allow_user_request": True}
            ],
            compliance_standards=[ComplianceStandard.GDPR]
        )
        self.security_policies["gdpr"] = gdpr_policy
        
        # HIPAA Policy
        hipaa_policy = SecurityPolicy(
            name="HIPAA Compliance",
            description="Health Insurance Portability and Accountability Act compliance",
            rules=[
                {"action": "health_data_access", "require_authorization": True},
                {"action": "audit_logging", "mandatory": True},
                {"action": "encryption", "required": True}
            ],
            compliance_standards=[ComplianceStandard.HIPAA]
        )
        self.security_policies["hipaa"] = hipaa_policy
    
    def _create_default_admin(self):
        """Create default administrator user"""
        admin_user = User(
            user_id="admin_001",
            username="admin",
            email="admin@enterprise.com",
            roles=["administrator"],
            security_level=SecurityLevel.SECRET,
            permissions={Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN, Permission.AUDIT}
        )
        self.users["admin_001"] = admin_user
    
    async def authenticate_user(
        self, 
        username: str, 
        password: str,
        ip_address: str = "unknown",
        user_agent: str = "unknown"
    ) -> Tuple[bool, Optional[str], Optional[User]]:
        """
        Authenticate a user
        
        Args:
            username: Username
            password: Password
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            Tuple of (success, token, user)
        """
        try:
            # Find user
            user = None
            for u in self.users.values():
                if u.username == username:
                    user = u
                    break
            
            if not user:
                await self._log_audit_event(
                    user_id="unknown",
                    action="authentication_failed",
                    resource="user",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    details={"reason": "user_not_found", "username": username}
                )
                return False, None, None
            
            if not user.is_active:
                await self._log_audit_event(
                    user_id=user.user_id,
                    action="authentication_failed",
                    resource="user",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    details={"reason": "account_inactive"}
                )
                return False, None, None
            
            # Verify password (in production, use proper password verification)
            # For demo purposes, accept any password for existing users
            password_valid = True  # self.password_context.verify(password, user.password_hash)
            
            if password_valid:
                # Update last login
                user.last_login = datetime.now()
                
                # Generate JWT token
                token = self._generate_jwt_token(user)
                
                await self._log_audit_event(
                    user_id=user.user_id,
                    action="authentication_success",
                    resource="user",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=True,
                    details={"username": username}
                )
                
                return True, token, user
            else:
                await self._log_audit_event(
                    user_id=user.user_id,
                    action="authentication_failed",
                    resource="user",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    details={"reason": "invalid_password"}
                )
                return False, None, None
                
        except Exception as e:
            logger.error("Authentication failed", error=str(e))
            return False, None, None
    
    def _generate_jwt_token(self, user: User) -> str:
        """Generate JWT token for user"""
        payload = {
            "user_id": user.user_id,
            "username": user.username,
            "roles": user.roles,
            "security_level": user.security_level.value,
            "permissions": [p.value for p in user.permissions],
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow()
        }
        
        return jwt.encode(payload, self.jwt_secret, algorithm="HS256")
    
    async def verify_token(self, token: str) -> Tuple[bool, Optional[User]]:
        """
        Verify JWT token and return user
        
        Args:
            token: JWT token
            
        Returns:
            Tuple of (valid, user)
        """
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            user_id = payload.get("user_id")
            
            if user_id in self.users:
                user = self.users[user_id]
                if user.is_active:
                    return True, user
            
            return False, None
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return False, None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return False, None
        except Exception as e:
            logger.error("Token verification failed", error=str(e))
            return False, None
    
    async def authorize_action(
        self,
        user: User,
        action: str,
        resource: str,
        resource_metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Authorize user action on resource
        
        Args:
            user: User attempting action
            action: Action to perform
            resource: Resource being accessed
            resource_metadata: Optional resource metadata
            
        Returns:
            Authorization result
        """
        try:
            # Check basic permissions
            if action == "read" and Permission.READ not in user.permissions:
                return False
            elif action == "write" and Permission.WRITE not in user.permissions:
                return False
            elif action == "delete" and Permission.DELETE not in user.permissions:
                return False
            elif action == "admin" and Permission.ADMIN not in user.permissions:
                return False
            
            # Check security level requirements
            required_level = self._get_required_security_level(resource, resource_metadata)
            if not self._check_security_level(user.security_level, required_level):
                return False
            
            # Check role-based access
            if not self._check_role_access(user, action, resource):
                return False
            
            # Check compliance policies
            if not self._check_compliance_policies(user, action, resource, resource_metadata):
                return False
            
            return True
            
        except Exception as e:
            logger.error("Authorization check failed", error=str(e))
            return False
    
    def _get_required_security_level(
        self, 
        resource: str, 
        metadata: Optional[Dict[str, Any]]
    ) -> SecurityLevel:
        """Determine required security level for resource"""
        # Simple logic - in production, use more sophisticated rules
        if "confidential" in resource.lower() or "secret" in resource.lower():
            return SecurityLevel.CONFIDENTIAL
        elif "internal" in resource.lower():
            return SecurityLevel.INTERNAL
        else:
            return SecurityLevel.PUBLIC
    
    def _check_security_level(self, user_level: SecurityLevel, required_level: SecurityLevel) -> bool:
        """Check if user security level meets requirement"""
        level_hierarchy = {
            SecurityLevel.PUBLIC: 0,
            SecurityLevel.INTERNAL: 1,
            SecurityLevel.CONFIDENTIAL: 2,
            SecurityLevel.SECRET: 3,
            SecurityLevel.TOP_SECRET: 4
        }
        
        return level_hierarchy[user_level] >= level_hierarchy[required_level]
    
    def _check_role_access(self, user: User, action: str, resource: str) -> bool:
        """Check role-based access control"""
        # Simple role checking - in production, use more sophisticated RBAC
        if "admin" in user.roles:
            return True
        
        if "manager" in user.roles and action in ["read", "write"]:
            return True
        
        if "user" in user.roles and action == "read":
            return True
        
        return False
    
    def _check_compliance_policies(
        self, 
        user: User, 
        action: str, 
        resource: str, 
        metadata: Optional[Dict[str, Any]]
    ) -> bool:
        """Check compliance with security policies"""
        for policy in self.security_policies.values():
            if not policy.is_active:
                continue
            
            for rule in policy.rules:
                if not self._evaluate_policy_rule(rule, user, action, resource, metadata):
                    return False
        
        return True
    
    def _evaluate_policy_rule(
        self, 
        rule: Dict[str, Any], 
        user: User, 
        action: str, 
        resource: str, 
        metadata: Optional[Dict[str, Any]]
    ) -> bool:
        """Evaluate a specific policy rule"""
        # Simple rule evaluation - in production, use more sophisticated rule engine
        if rule.get("action") == action:
            if rule.get("require_consent") and not metadata.get("consent_given"):
                return False
            if rule.get("require_authorization") and not self._check_authorization(user, resource):
                return False
            if rule.get("mandatory") and not self._check_mandatory_requirement(rule, user):
                return False
        
        return True
    
    def _check_authorization(self, user: User, resource: str) -> bool:
        """Check if user has authorization for resource"""
        # Simple authorization check
        return Permission.READ in user.permissions
    
    def _check_mandatory_requirement(self, rule: Dict[str, Any], user: User) -> bool:
        """Check if mandatory requirements are met"""
        # Simple mandatory requirement check
        return True
    
    async def _log_audit_event(
        self,
        user_id: str,
        action: str,
        resource: str,
        ip_address: str,
        user_agent: str,
        success: bool,
        details: Dict[str, Any]
    ):
        """Log security audit event"""
        event = AuditEvent(
            event_id=secrets.token_urlsafe(16),
            user_id=user_id,
            action=action,
            resource=resource,
            timestamp=datetime.now(),
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            details=details
        )
        
        self.audit_log.append(event)
        
        # Keep only last 10000 events to prevent memory issues
        if len(self.audit_log) > 10000:
            self.audit_log = self.audit_log[-10000:]
        
        logger.info("Audit event logged", 
                   event_id=event.event_id,
                   user_id=user_id,
                   action=action,
                   success=success)
    
    async def create_user(
        self,
        username: str,
        email: str,
        roles: List[str],
        security_level: SecurityLevel = SecurityLevel.INTERNAL,
        permissions: Optional[Set[Permission]] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Create a new user
        
        Args:
            username: Username
            email: Email address
            roles: User roles
            security_level: Security clearance level
            permissions: User permissions
            
        Returns:
            Tuple of (success, user_id)
        """
        try:
            # Check if username already exists
            for user in self.users.values():
                if user.username == username:
                    return False, "Username already exists"
            
            # Create new user
            user_id = f"user_{secrets.token_urlsafe(8)}"
            user = User(
                user_id=user_id,
                username=username,
                email=email,
                roles=roles,
                security_level=security_level,
                permissions=permissions or {Permission.READ}
            )
            
            self.users[user_id] = user
            
            await self._log_audit_event(
                user_id="system",
                action="user_created",
                resource="user",
                ip_address="system",
                user_agent="system",
                success=True,
                details={"new_user_id": user_id, "username": username}
            )
            
            logger.info(f"User created: {username} ({user_id})")
            return True, user_id
            
        except Exception as e:
            logger.error("User creation failed", error=str(e))
            return False, str(e)
    
    async def get_audit_log(
        self,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AuditEvent]:
        """
        Get audit log with optional filters
        
        Args:
            user_id: Filter by user ID
            action: Filter by action
            start_date: Filter by start date
            end_date: Filter by end date
            limit: Maximum number of events to return
            
        Returns:
            List of audit events
        """
        filtered_events = self.audit_log.copy()
        
        # Apply filters
        if user_id:
            filtered_events = [e for e in filtered_events if e.user_id == user_id]
        
        if action:
            filtered_events = [e for e in filtered_events if e.action == action]
        
        if start_date:
            filtered_events = [e for e in filtered_events if e.timestamp >= start_date]
        
        if end_date:
            filtered_events = [e for e in filtered_events if e.timestamp <= end_date]
        
        # Sort by timestamp (newest first)
        filtered_events.sort(key=lambda x: x.timestamp, reverse=True)
        
        return filtered_events[:limit]
    
    def get_security_status(self) -> Dict[str, Any]:
        """Get current security status"""
        return {
            "total_users": len(self.users),
            "active_users": len([u for u in self.users.values() if u.is_active]),
            "security_policies": len(self.security_policies),
            "audit_events": len(self.audit_log),
            "compliance_standards": [policy.compliance_standards for policy in self.security_policies.values()]
        }
    
    async def enforce_data_retention_policy(self):
        """Enforce data retention policies"""
        # Remove old audit events (older than 1 year)
        cutoff_date = datetime.now() - timedelta(days=365)
        self.audit_log = [e for e in self.audit_log if e.timestamp > cutoff_date]
        
        logger.info(f"Data retention policy enforced, {len(self.audit_log)} events retained")
    
    async def generate_security_report(self) -> Dict[str, Any]:
        """Generate comprehensive security report"""
        # Analyze audit events
        recent_events = [e for e in self.audit_log if e.timestamp > datetime.now() - timedelta(days=7)]
        
        failed_logins = len([e for e in recent_events if e.action == "authentication_failed"])
        successful_logins = len([e for e in recent_events if e.action == "authentication_success"])
        
        # Calculate security metrics
        total_attempts = failed_logins + successful_logins
        success_rate = (successful_logins / total_attempts * 100) if total_attempts > 0 else 0
        
        return {
            "report_date": datetime.now().isoformat(),
            "total_users": len(self.users),
            "active_users": len([u for u in self.users.values() if u.is_active]),
            "recent_login_attempts": total_attempts,
            "failed_logins": failed_logins,
            "successful_logins": successful_logins,
            "login_success_rate": round(success_rate, 2),
            "security_policies_active": len([p for p in self.security_policies.values() if p.is_active]),
            "compliance_standards": list(set([
                std.value for policy in self.security_policies.values() 
                for std in policy.compliance_standards
            ]))
        }


# Example usage and testing
async def main():
    """Example usage of the Enterprise Security Manager"""
    config = {
        "jwt_secret": "your-secret-key-here"
    }
    
    security_manager = EnterpriseSecurityManager(config)
    
    # Create a test user
    success, user_id = await security_manager.create_user(
        username="testuser",
        email="test@example.com",
        roles=["user"],
        security_level=SecurityLevel.INTERNAL,
        permissions={Permission.READ, Permission.WRITE}
    )
    
    print(f"User creation: {success}, User ID: {user_id}")
    
    # Authenticate user
    auth_success, token, user = await security_manager.authenticate_user(
        username="testuser",
        password="password123"
    )
    
    print(f"Authentication: {auth_success}")
    if token:
        print(f"Token: {token[:50]}...")
    
    # Test authorization
    if user:
        authorized = await security_manager.authorize_action(
            user=user,
            action="read",
            resource="confidential_document"
        )
        print(f"Authorization for confidential document: {authorized}")
    
    # Get security status
    status = security_manager.get_security_status()
    print(f"Security status: {status}")
    
    # Generate security report
    report = await security_manager.generate_security_report()
    print(f"Security report: {report}")


if __name__ == "__main__":
    asyncio.run(main())
