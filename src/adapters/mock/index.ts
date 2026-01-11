/**
 * Mock Adapters - Public API
 *
 * Mock implementations of all ports for development and testing.
 * These will be replaced with real implementations when integrating with Sindri.
 */

// Repository
export type { MockRepositoryConfig } from "./mock-approval-repository";

export {
  createMockApprovalRepository,
  createMockRepositoryWithTestData,
} from "./mock-approval-repository";

// Policy Provider
export {
  SAMPLE_APPROVERS,
  createSamplePolicies,
  createMockPolicyProvider,
  createMockApproverResolver,
} from "./mock-policy-provider";

// Notification Service
export type { MockNotificationConfig } from "./mock-notification-service";

export {
  createMockNotificationService,
  createSilentNotificationService,
} from "./mock-notification-service";
