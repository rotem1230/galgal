import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "67e41f5649c352bc654f6bb3", 
  requiresAuth: true // Ensure authentication is required for all operations
});
