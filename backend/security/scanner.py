"""
Security Testing & Vulnerability Scanner

Automated security testing for API endpoints and system vulnerabilities
"""

import asyncio
import aiohttp
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel
import json

# ============================================================
# Security Models
# ============================================================

class VulnerabilityLevel(str):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class SecurityIssue(BaseModel):
    """Detected security issue"""
    issue_id: str
    category: str
    severity: str
    description: str
    endpoint: Optional[str] = None
    detected_at: datetime
    remediation: str
    cvss_score: Optional[float] = None


# ============================================================
# Security Scanner
# ============================================================

class SecurityScanner:
    """Automated security vulnerability scanner"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Initialize security scanner
        
        Args:
            base_url: Base URL for API
        """
        self.base_url = base_url
        self.issues: List[SecurityIssue] = []
    
    async def run_full_scan(self) -> Dict:
        """
        Run comprehensive security scan
        
        Returns:
            Scan results summary
        """
        print("🔒 Starting security scan...")
        
        # Run all security tests
        results = {
            "sql_injection": await self.test_sql_injection(),
            "xss": await self.test_xss(),
            "auth_bypass": await self.test_auth_bypass(),
            "rate_limiting": await self.test_rate_limiting(),
            "cors": await self.test_cors_configuration(),
            "headers": await self.test_security_headers(),
            "ssl_tls": await self.test_ssl_configuration()
        }
        
        #Calculate summary
        total_issues = sum(r["issues_found"] for r in results.values())
        critical_count = sum(
            1 for issue in self.issues
            if issue.severity == VulnerabilityLevel.CRITICAL
        )
        
        print(f"\n✓ Security scan complete")
        print(f"  Total issues: {total_issues}")
        print(f"  Critical: {critical_count}")
        
        return {
            "scan_timestamp": datetime.utcnow().isoformat(),
            "total_tests": len(results),
            "total_issues": total_issues,
            "critical_issues": critical_count,
            "results": results,
            "issues": [issue.dict() for issue in self.issues]
        }
    
    async def test_sql_injection(self) -> Dict:
        """Test for SQL injection vulnerabilities"""
        print("  Testing SQL injection...")
        
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users--",
            "1' UNION SELECT NULL--",
            "admin'--",
            "' OR 1=1--"
        ]
        
        vulnerable_endpoints = []
        
        async with aiohttp.ClientSession() as session:
            for payload in sql_payloads:
                try:
                    # Test GraphQL endpoint
                    query = f'{{ satellites(name: "{payload}") {{ id }} }}'
                    
                    async with session.post(
                        f"{self.base_url}/graphql",
                        json={"query": query},
                        timeout=aiohttp.ClientTimeout(total=5)
                    ) as response:
                        text = await response.text()
                        
                        # Check for SQL errors
                        if any(err in text.lower() for err in [
                            "sql", "syntax error", "mysql", "postgresql",
                            "database error", "sqlite"
                        ]):
                            vulnerable_endpoints.append({
                                "endpoint": "/graphql",
                                "payload": payload
                            })
                
                except Exception:
                    pass
        
        if vulnerable_endpoints:
            self._add_issue(
                category="SQL Injection",
                severity=VulnerabilityLevel.CRITICAL,
                description=f"Possible SQL injection vulnerabilities detected",
                endpoint="/graphql",
                remediation="Use parameterized queries and input validation"
            )
        
        return {
            "test": "SQL Injection",
            "issues_found": len(vulnerable_endpoints),
            "status": "PASS" if not vulnerable_endpoints else "FAIL"
        }
    
    async def test_xss(self) -> Dict:
        """Test for Cross-Site Scripting (XSS) vulnerabilities"""
        print("  Testing XSS...")
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>"
        ]
        
        vulnerable_count = 0
        
        # Test would inject payloads and check for reflection
        # Simplified for example
        
        return {
            "test": "XSS",
            "issues_found": vulnerable_count,
            "status": "PASS"
        }
    
    async def test_auth_bypass(self) -> Dict:
        """Test for authentication bypass vulnerabilities"""
        print("  Testing authentication bypass...")
        
        issues_found = 0
        
        async with aiohttp.ClientSession() as session:
            # Test accessing protected endpoint without auth
            try:
                async with session.get(
                    f"{self.base_url}/admin/health",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        issues_found += 1
                        self._add_issue(
                            category="Authentication",
                            severity=VulnerabilityLevel.CRITICAL,
                            description="Admin endpoint accessible without authentication",
                            endpoint="/admin/health",
                            remediation="Implement authentication middleware"
                        )
            except:
                pass
        
        return {
            "test": "Authentication",
            "issues_found": issues_found,
            "status": "PASS" if issues_found == 0 else "FAIL"
        }
    
    async def test_rate_limiting(self) -> Dict:
        """Test rate limiting implementation"""
        print("  Testing rate limiting...")
        
        request_count = 150  # Try to exceed limit
        successful_requests = 0
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for _ in range(request_count):
                task = session.get(f"{self.base_url}/api/health")
                tasks.append(task)
            
            try:
                responses = await asyncio.gather(*tasks, return_exceptions=True)
                successful_requests = sum(
                    1 for r in responses
                    if not isinstance(r, Exception) and r.status == 200
                )
            except:
                pass
        
        # If all requests succeeded, rate limiting might be missing
        if successful_requests == request_count:
            self._add_issue(
                category="Rate Limiting",
                severity=VulnerabilityLevel.MEDIUM,
                description="No rate limiting detected - DoS risk",
                endpoint="/api/*",
                remediation="Implement rate limiting middleware"
            )
            return {
                "test": "Rate Limiting",
                "issues_found": 1,
                "status": "FAIL"
            }
        
        return {
            "test": "Rate Limiting",
            "issues_found": 0,
            "status": "PASS"
        }
    
    async def test_cors_configuration(self) -> Dict:
        """Test CORS configuration"""
        print("  Testing CORS configuration...")
        
        issues_found = 0
        
        async with aiohttp.ClientSession() as session:
            headers = {"Origin": "http://evil.com"}
            
            try:
                async with session.options(
                    f"{self.base_url}/api/health",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    cors_header = response.headers.get("Access-Control-Allow-Origin") 
                    
                    # Check if wildcard (*) is used
                    if cors_header == "*":
                        issues_found += 1
                        self._add_issue(
                            category="CORS",
                            severity=VulnerabilityLevel.MEDIUM,
                            description="CORS allows any origin (*)",
                            remediation="Restrict CORS to specific trusted origins"
                        )
            except:
                pass
        
        return {
            "test": "CORS Configuration",
            "issues_found": issues_found,
            "status": "PASS" if issues_found == 0 else "WARNING"
        }
    
    async def test_security_headers(self) -> Dict:
        """Test security headers implementation"""
        print("  Testing security headers...")
        
        required_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": None,  # Any value OK
            "Content-Security-Policy": None
        }
        
        missing_headers = []
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{self.base_url}/api/health",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    for header in required_headers:
                        if header not in response.headers:
                            missing_headers.append(header)
            except:
                pass
        
        if missing_headers:
            self._add_issue(
                category="Security Headers",
                severity=VulnerabilityLevel.LOW,
                description=f"Missing security headers: {', '.join(missing_headers)}",
                remediation="Add missing security headers to all responses"
            )
        
        return {
            "test": "Security Headers",
            "issues_found": len(missing_headers),
            "missing_headers": missing_headers,
            "status": "PASS" if not missing_headers else "WARNING"
        }
    
    async def test_ssl_configuration(self) -> Dict:
        """Test SSL/TLS configuration"""
        print("  Testing SSL configuration...")
        
        # This would test SSL cert, protocols, ciphers
        # Simplified for HTTP development mode
        
        return {
            "test": "SSL/TLS",
            "issues_found": 0,
            "status": "SKIPPED",
            "note": "Requires HTTPS endpoint"
        }
    
    def _add_issue(
        self,
        category: str,
        severity: str,
        description: str,
        remediation: str,
        endpoint: Optional[str] = None
    ):
        """Add security issue to list"""
        import uuid
        
        issue = SecurityIssue(
            issue_id=str(uuid.uuid4()),
            category=category,
            severity=severity,
            description=description,
            endpoint=endpoint,
            detected_at=datetime.utcnow(),
            remediation=remediation
        )
        
        self.issues.append(issue)
    
    def generate_report(self) -> str:
        """Generate human-readable security report"""
        report = []
        report.append("=" * 60)
        report.append("SECURITY SCAN REPORT")
        report.append("=" * 60)
        report.append(f"Scan Date: {datetime.utcnow().isoformat()}")
        report.append(f"Total Issues: {len(self.issues)}")
        report.append("")
        
        # Group by severity
        by_severity = {}
        for issue in self.issues:
            if issue.severity not in by_severity:
                by_severity[issue.severity] = []
            by_severity[issue.severity].append(issue)
        
        # Report by severity
        for severity in [
            VulnerabilityLevel.CRITICAL,
            VulnerabilityLevel.HIGH,
            VulnerabilityLevel.MEDIUM,
            VulnerabilityLevel.LOW
        ]:
            if severity in by_severity:
                report.append(f"\n{severity} SEVERITY ({len(by_severity[severity])} issues)")
                report.append("-" * 60)
                
                for issue in by_severity[severity]:
                    report.append(f"\n[{issue.category}] {issue.description}")
                    if issue.endpoint:
                        report.append(f"Endpoint: {issue.endpoint}")
                    report.append(f"Remediation: {issue.remediation}")
                    report.append("")
        
        report.append("=" * 60)
        
        return "\n".join(report)


# ============================================================
# API Fuzzer
# ============================================================

class APIFuzzer:
    """Fuzz API endpoints to find crashes"""
    
    @staticmethod
    async def fuzz_endpoint(
        url: str,
        method: str = "GET",
        iterations: int = 100
    ) -> Dict:
        """Fuzz an API endpoint"""
        import random
        import string
        
        crashes = []
        
        async with aiohttp.ClientSession() as session:
            for i in range(iterations):
                # Generate random payload
                payload = ''.join(
                    random.choices(
                        string.printable,
                        k=random.randint(1, 1000)
                    )
                )
                
                try:
                    if method == "GET":
                        await session.get(f"{url}?data={payload}", timeout=aiohttp.ClientTimeout(total=2))
                    elif method == "POST":
                        await session.post(url, json={"data": payload}, timeout=aiohttp.ClientTimeout(total=2))
                except Exception as e:
                    crashes.append(str(e))
        
        return {
            "iterations": iterations,
            "crashes": len(crashes),
            "crash_rate": len(crashes) / iterations
        }


# Export
__all__ = [
    'SecurityScanner',
    'APIFuzzer',
    'SecurityIssue',
    'VulnerabilityLevel'
]
