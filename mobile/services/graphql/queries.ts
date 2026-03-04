/**
 * GraphQL Queries
 * 
 * All GraphQL queries for the mobile app
 */

import { gql } from '@apollo/client';

// Satellite Queries
export const GET_SATELLITES = gql`
  query GetSatellites($filter: SatelliteFilter) {
    satellites(filter: $filter) {
      id
      noradId
      name
      type
      tle {
        line1
        line2
        epoch
      }
      position {
        latitude
        longitude
        altitude
      }
      velocity {
        x
        y
        z
      }
      altitude
    }
  }
`;

export const GET_SATELLITE = gql`
  query GetSatellite($id: ID, $noradId: Int) {
    satellite(id: $id, noradId: $noradId) {
      id
      noradId
      name
      type
      tle {
        line1
        line2
        epoch
      }
      position {
        latitude
        longitude
        altitude
      }
      velocity {
        x
        y
        z
      }
      altitude
    }
  }
`;

// Conjunction Queries
export const GET_CONJUNCTIONS = gql`
  query GetConjunctions($filter: ConjunctionFilter, $limit: Int) {
    conjunctions(filter: $filter, limit: $limit) {
      id
      satelliteId
      debrisId
      tca
      missDistance
      relativeVelocity
      probability
      riskLevel
      status
    }
  }
`;

export const GET_CONJUNCTION = gql`
  query GetConjunction($id: ID!) {
    conjunction(id: $id) {
      id
      satelliteId
      debrisId
      tca
      missDistance
      relativeVelocity
      probability
      riskLevel
      status
      satellite {
        id
        name
        noradId
      }
      debris {
        id
        name
        noradId
      }
    }
  }
`;

export const GET_HIGH_RISK_CONJUNCTIONS = gql`
  query GetHighRiskConjunctions {
    conjunctions(filter: { riskLevel: [HIGH, CRITICAL], status: ACTIVE }) {
      id
      satelliteId
      debrisId
      tca
      missDistance
      probability
      riskLevel
    }
  }
`;

// Analytics Queries
export const GET_CONJUNCTION_STATS = gql`
  query GetConjunctionStats {
    conjunctionStats {
      total
      active
      archived
      byRiskLevel {
        level
        count
        percentage
      }
      byStatus {
        status
        count
      }
    }
  }
`;

export const GET_RISK_TRENDS = gql`
  query GetRiskTrends($days: Int!) {
    riskTrends(days: $days) {
      date
      totalConjunctions
      averageRisk
      highRiskCount
      criticalRiskCount
    }
  }
`;

// Prediction Query
export const PREDICT_COLLISION = gql`
  query PredictCollision($satelliteId: ID!, $debrisId: ID!, $timeWindow: Int!) {
    predictCollision(
      satelliteId: $satelliteId
      debrisId: $debrisId
      timeWindowHours: $timeWindow
    ) {
      probability
      riskLevel
      confidence
      recommendation
      closestApproach {
        time
        distance
        relativeVelocity
      }
    }
  }
`;
