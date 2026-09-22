/**
 * Central subscription helpers for KissanSarthi
 */

/**
 * Checks whether a user object has an active Pro subscription.
 * Handles both plain objects from AuthContext/localStorage and API payloads.
 *
 * @param {Object} user - User object from AuthContext or backend
 * @returns {boolean}
 */
export function isProUser(user) {
  if (!user?.subscription) return false;
  const { plan, expiresAt } = user.subscription;
  if (plan !== 'pro') return false;
  if (!expiresAt) return true; // Lifetime/indefinite pro if no expiration specified
  return new Date(expiresAt) > new Date();
}

/**
 * Returns a human-friendly formatted string of when the Pro subscription expires.
 *
 * @param {Object} user
 * @returns {string|null}
 */
export function getProExpiryDate(user) {
  if (!user?.subscription?.expiresAt) return null;
  return new Date(user.subscription.expiresAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
