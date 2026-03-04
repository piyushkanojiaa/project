"""
OpenAPI/Swagger API Documentation Configuration

Comprehensive API documentation with examples and schemas
"""

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

def custom_openapi_schema(app: FastAPI):
    """
    Generate custom OpenAPI schema with enhanced documentation
    """
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Orbital Guard AI API",
        version="2.0.0",
        description="""
# Orbital Guard AI API Documentation

Real-time space debris monitoring and collision prediction system.

## Features

- 🛰️ **Satellite Tracking**: Monitor 1000+ active satellites
- ⚠️ **Conjunction Prediction**: ML-powered collision risk assessment
- 📊 **Real-Time Analytics**: Live statistics and visualizations
- 🔔 **WebSocket Subscriptions**: Real-time updates via GraphQL
- 🔐 **Authentication**: JWT-based security with RBAC

## Authentication

Most endpoints require authentication. Include your JWT token in the header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Getting a Token

1. Register: `POST /auth/register`
2. Login: `POST /auth/login`
3. Use returned `access_token` in subsequent requests

## Rate Limiting

- **Viewer**: 100 requests/hour
- **Analyst**: 1000 requests/hour  
- **Admin**: Unlimited
- **API User**: 10,000 requests/hour

## GraphQL Endpoint

GraphQL playground available at `/graphql` for interactive queries and subscriptions.

### Example Query

```graphql
query {
  conjunctions(limit: 10, riskLevel: HIGH) {
    id
    satelliteName
    debrisName
    probability
    missDistance
  }
}
```

### Example Subscription

```graphql
subscription {
  criticalAlert {
    id
    satelliteName
    debrisName
    riskLevel
  }
}
```

## Support

- **Documentation**: https://docs.orbitalguard.ai
- **GitHub**: https://github.com/yourusername/orbital-guard-ai
- **Email**: support@orbitalguard.ai

## Version History

### v2.0.0 (Current)
- GraphQL API with subscriptions
- Real-time WebSocket updates
- Advanced ML trajectory prediction
- JWT authentication & RBAC
- Admin dashboard

### v1.0.0
- REST API
- Basic collision prediction
- TLE data management
        """,
        routes=app.routes,
        tags=[
            {
                "name": "Authentication",
                "description": "User registration, login, and token management"
            },
            {
                "name": "Satellites",
                "description": "Satellite data and orbital parameters"
            },
            {
                "name": "Conjunctions",
                "description": "Conjunction events and collision predictions"
            },
            {
                "name": "Analytics",
                "description": "Statistics, trends, and visualizations"
            },
            {
                "name": "Admin Dashboard",
                "description": "System monitoring and user management (Admin only)"
            },
            {
                "name": "ML Models",
                "description": "Machine learning model predictions and analysis"
            },
            {
                "name": "GraphQL",
                "description": "GraphQL queries, mutations, and subscriptions"
            }
        ]
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT access token obtained from /auth/login"
        },
        "APIKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "API key for programmatic access"
        }
    }
    
    # Add response examples
    openapi_schema["components"]["examples"] = {
        "ConjunctionExample": {
            "value": {
                "id": "conj_abc123",
                "satellite_name": "ISS (ZARYA)",
                "debris_name": "FENGYUN 1C DEB",
                "tca": "2026-02-03T14:30:00Z",
                "miss_distance": 0.245,
                "probability": 0.00034,
                "risk_level": "HIGH",
                "relative_velocity": 7.85,
                "status": "MONITORING"
            }
        },
        "SatelliteExample": {
            "value": {
                "id": "sat_456",
                "name": "ISS (ZARYA)",
                "norad_id": "25544",
                "type": "ACTIVE",
                "altitude": 408.5,
                "position": {
                    "x": 6771.23,
                    "y": 0.0,
                    "z": 0.0,
                    "lat": 45.67,
                    "lng": -122.34,
                    "altitude": 408.5
                },
                "last_updated": "2026-02-02T16:30:00Z",
                "is_active": True
            }
        },
        "ErrorExample": {
            "value": {
                "detail": "Unauthorized: Invalid or expired token"
            }
        }
    }
    
    # Add server information
    openapi_schema["servers"] = [
        {
            "url": "http://localhost:8000",
            "description": "Local development server"
        },
        {
            "url": "https://api.orbitalguard.ai",
            "description": "Production server"
        },
        {
            "url": "https://staging.api.orbitalguard.ai",
            "description": "Staging server"
        }
    ]
    
    # Add contact information
    openapi_schema["info"]["contact"] = {
        "name": "Orbital Guard AI Support",
        "email": "support@orbitalguard.ai",
        "url": "https://orbitalguard.ai/support"
    }
    
    openapi_schema["info"]["license"] = {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
    
    # Add external documentation
    openapi_schema["externalDocs"] = {
        "description": "Full API Documentation",
        "url": "https://docs.orbitalguard.ai"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


def setup_api_docs(app: FastAPI):
    """
    Configure API documentation
    """
    app.openapi = lambda: custom_openapi_schema(app)
    
    # Customize Swagger UI
    app.swagger_ui_parameters = {
        "deepLinking": True,
        "displayRequestDuration": True,
        "docExpansion": "none",
        "filter": True,
        "showExtensions": True,
        "showCommonExtensions": True,
        "syntaxHighlight": {
            "activate": True,
            "theme": "monokai"
        },
        "tryItOutEnabled": True
    }
    
    return app


# Example of adding rich documentation to endpoints
def document_endpoint(
    summary: str,
    description: str,
    response_example: dict,
    tags: list = None
):
    """
    Decorator helper for adding rich documentation to endpoints
    """
    return {
        "summary": summary,
        "description": description,
        "responses": {
            200: {
                "description": "Successful response",
                "content": {
                    "application/json": {
                        "example": response_example
                    }
                }
            },
            401: {
                "description": "Unauthorized",
                "content": {
                    "application/json": {
                        "example": {"detail": "Invalid or expired token"}
                    }
                }
            },
            403: {
                "description": "Forbidden",
                "content": {
                    "application/json": {
                        "example": {"detail": "Insufficient permissions"}
                    }
                }
            },
            500: {
                "description": "Internal server error",
                "content": {
                    "application/json": {
                        "example": {"detail": "An unexpected error occurred"}
                    }
                }
            }
        },
        "tags": tags or []
    }


__all__ = ['custom_openapi_schema', 'setup_api_docs', 'document_endpoint']
