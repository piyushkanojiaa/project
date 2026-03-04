/**
 * GraphQL Mutations
 * 
 * All GraphQL mutations for the mobile app
 */

import { gql } from '@apollo/client';

// Update Satellite TLE
export const UPDATE_SATELLITE_TLE = gql`
  mutation UpdateSatelliteTLE($noradId: Int!, $tle: TLEInput!) {
    updateSatelliteTle(noradId: $noradId, tle: $tle) {
      success
      message
      satellite {
        id
        noradId
        name
        tle {
          line1
          line2
          epoch
        }
      }
    }
  }
`;

// Update Conjunction Status
export const UPDATE_CONJUNCTION_STATUS = gql`
  mutation UpdateConjunctionStatus($id: ID!, $status: ConjunctionStatus!) {
    updateConjunctionStatus(id: $id, status: $status) {
      success
      message
      conjunction {
        id
        status
      }
    }
  }
`;

// Create Alert
export const CREATE_ALERT = gql`
  mutation CreateAlert($conjunctionId: ID!, $severity: RiskLevel!, $message: String!) {
    createAlert(
      conjunctionId: $conjunctionId
      severity: $severity
      message: $message
    ) {
      success
      message
      alert {
        id
        conjunctionId
        severity
        message
        timestamp
      }
    }
  }
`;

// Register Push Token
export const REGISTER_PUSH_TOKEN = gql`
  mutation RegisterPushToken($token: String!, $platform: String!) {
    registerPushToken(token: $token, platform: $platform) {
      success
      message
    }
  }
`;
