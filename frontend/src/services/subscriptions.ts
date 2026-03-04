/**
 * GraphQL Subscription Queries
 * 
 * Real-time subscription queries for WebSocket updates
 */

import { gql } from '@apollo/client';

// ============================================================
// Conjunctions Subscriptions
// ============================================================

export const CONJUNCTION_CREATED = gql`
  subscription OnConjunctionCreated($minRiskLevel: RiskLevel) {
    conjunctionCreated(minRiskLevel: $minRiskLevel) {
      id
      satelliteName
      debrisName
      tca
      missDistance
      probability
      riskLevel
      relativeVelocity
      status
      createdAt
      updatedAt
    }
  }
`;

export const CONJUNCTION_UPDATED = gql`
  subscription OnConjunctionUpdated(
    $conjunctionId: String
    $minRiskLevel: RiskLevel
  ) {
    conjunctionUpdated(
      conjunctionId: $conjunctionId
      minRiskLevel: $minRiskLevel
    ) {
      id
      satelliteName
      debrisName
      tca
      missDistance
      probability
      riskLevel
      relativeVelocity
      status
      createdAt
      updatedAt
    }
  }
`;

export const CRITICAL_ALERT = gql`
  subscription OnCriticalAlert {
    criticalAlert {
      id
      satelliteName
      debrisName
      tca
      missDistance
      probability
      riskLevel
      relativeVelocity
      status
      createdAt
    }
  }
`;

// ============================================================
// Satellite Subscriptions
// ============================================================

export const SATELLITE_POSITION_UPDATED = gql`
  subscription OnSatellitePositionUpdated(
    $noradId: String
    $updateInterval: Int
  ) {
    satellitePositionUpdated(
      noradId: $noradId
      updateInterval: $updateInterval
    ) {
      id
      name
      noradId
      type
      altitude
      position {
        x
        y
        z
        lat
        lng
        altitude
      }
      velocity {
        vx
        vy
        vz
        magnitude
      }
      lastUpdated
      isActive
    }
  }
`;

// ============================================================
// Statistics Subscriptions
// ============================================================

export const STATS_UPDATED = gql`
  subscription OnStatsUpdated($updateInterval: Int) {
    statsUpdated(updateInterval: $updateInterval) {
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
        debrisName
        probability
        missDistance
        riskLevel
      }
    }
  }
`;
