"""
GraphQL Client Example for Orbital Guard AI

Demonstrates how to use the GraphQL API v2
"""

from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

# ============================================================
# GraphQL Client Setup
# ============================================================

# Configure the transport
transport = RequestsHTTPTransport(
    url="http://localhost:8000/graphql",
    use_json=True,
    headers={
        "Content-Type": "application/json"
    }
)

# Create client
client = Client(
    transport=transport,
    fetch_schema_from_transport=True
)

# ============================================================
# Example Queries
# ============================================================

def get_satellites_example():
    """Example: Get all active satellites"""
    query = gql("""
        query GetActiveSatellites {
            satellites(type: ACTIVE, limit: 10) {
                id
                name
                noradId
                altitude
                position {
                    x
                    y
                    z
                    altitude
                }
                lastUpdated
            }
        }
    """)
    
    result = client.execute(query)
    print("Active Satellites:", result)
    return result

def get_conjunctions_example():
    """Example: Get high-risk conjunctions"""
    query = gql("""
        query GetHighRiskConjunctions {
            conjunctions(riskLevel: HIGH, limit: 20) {
                id
                satelliteName
                debrisName
                tca
                missDistance
                probability
                riskLevel
                relativeVelocity
                status
            }
        }
    """)
    
    result = client.execute(query)
    print("High-Risk Conjunctions:", result)
    return result

def get_stats_example():
    """Example: Get conjunction statistics for last 7 days"""
    query = gql("""
        query GetConjunctionStats {
            conjunctionStats(days: 7) {
                totalConjunctions
                averageProbability
                timeRangeDays
                byRiskLevel {
                    riskLevel
                    count
                    percentage
                }
                highestRiskConjunction {
                    id
                    satelliteName
                    probability
                    missDistance
                }
            }
        }
    """)
    
    result = client.execute(query)
    print("Conjunction Statistics:", result)
    return result

def get_risk_trends_example():
    """Example: Get risk trends for the past week"""
    query = gql("""
        query GetRiskTrends {
            riskTrends(
                startDate: "2026-01-20T00:00:00",
                endDate: "2026-01-27T23:59:59"
            ) {
                date
                totalEvents
                highRiskCount
                criticalRiskCount
                averageProbability
            }
        }
    """)
    
    result = client.execute(query)
    print("Risk Trends:", result)
    return result

def predict_collision_example():
    """Example: Predict collision risk"""
    query = gql("""
        query PredictCollision {
            predictCollision(
                satelliteId: "sat-0",
                debrisId: "debris-0",
                hours: 24
            ) {
                conjunctionId
                probability
                riskScore
                confidence
                factors
                recommendation
            }
        }
    """)
    
    result = client.execute(query)
    print("Collision Prediction:", result)
    return result

# ============================================================
# Example Mutations
# ============================================================

def update_tle_example():
    """Example: Update satellite TLE"""
    mutation = gql("""
        mutation UpdateTLE {
            updateSatelliteTle(
                id: "sat-0",
                tle: {
                    line1: "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990",
                    line2: "2 25544  51.6461 339.8014 0002571  84.5741  97.7625 15.48908950265532"
                }
            ) {
                id
                name
                tle {
                    line1
                    line2
                    epoch
                }
                lastUpdated
            }
        }
    """)
    
    result = client.execute(mutation)
    print("TLE Updated:", result)
    return result

def update_status_example():
    """Example: Update conjunction status"""
    mutation = gql("""
        mutation UpdateStatus {
            updateConjunctionStatus(
                id: "conj-0",
                status: MONITORING
            ) {
                id
                status
                updatedAt
            }
        }
    """)
    
    result = client.execute(mutation)
    print("Status Updated:", result)
    return result

def create_alert_example():
    """Example: Create alert for conjunction"""
    mutation = gql("""
        mutation CreateAlert {
            createAlert(
                conjunctionId: "conj-0",
                threshold: 0.001
            ) {
                id
                conjunctionId
                threshold
                createdAt
                acknowledged
            }
        }
    """)
    
    result = client.execute(mutation)
    print("Alert Created:", result)
    return result

# ============================================================
# Example Fragments (Reusable Query Parts)
# ============================================================

def query_with_fragments_example():
    """Example: Using fragments for reusable queries"""
    query = gql("""
        fragment ConjunctionDetails on Conjunction {
            id
            satelliteName
            debrisName
            tca
            missDistance
            probability
            riskLevel
        }
        
        query GetConjunctions {
            highRisk: conjunctions(riskLevel: HIGH, limit: 5) {
                ...ConjunctionDetails
            }
            critical: conjunctions(riskLevel: CRITICAL, limit: 5) {
                ...ConjunctionDetails
            }
        }
    """)
    
    result = client.execute(query)
    print("Conjunctions with Fragments:", result)
    return result

# ============================================================
# Run Examples
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("GraphQL API v2 Examples")
    print("=" * 60)
    
    print("\n1. Getting Active Satellites...")
    get_satellites_example()
    
    print("\n2. Getting High-Risk Conjunctions...")
    get_conjunctions_example()
    
    print("\n3. Getting Conjunction Statistics...")
    get_stats_example()
    
    print("\n4. Getting Risk Trends...")
    get_risk_trends_example()
    
    print("\n5. Predicting Collision...")
    predict_collision_example()
    
    print("\n6. Updating TLE...")
    # update_tle_example()  # Uncomment to test
    
    print("\n7. Creating Alert...")
    # create_alert_example()  # Uncomment to test
    
    print("\n8. Using Fragments...")
    query_with_fragments_example()
    
    print("\n" + "=" * 60)
    print("✅ Examples completed!")
