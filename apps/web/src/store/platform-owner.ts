/**
 * Platform Owner Identity Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * The platform owner (developer / software seller) is the ONLY person who can:
 *   • Set/change the clinic name
 *   • Set/change the clinic specialty / clinicType
 *   • Set/change the logo / primary color branding
 *   • Access the Platform Super Admin panel
 *
 * Clinic admins and doctors can manage everything else:
 *   appointments, patients, services, staff, billing, etc.
 *
 * HOW IT WORKS:
 *   At deployment time the developer sets the env variable:
 *     VITE_PLATFORM_OWNER_KEY=<any long secret string you choose>
 *
 *   To unlock owner mode in the browser, open the browser console and run:
 *     localStorage.setItem('__po_session', '<your key>')
 *     location.reload()
 *
 *   To lock it again:
 *     localStorage.removeItem('__po_session')
 *     location.reload()
 *
 *   The clinic admin never sees this key and has no UI to enter it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const OWNER_KEY_ENV = import.meta.env.VITE_PLATFORM_OWNER_KEY as string | undefined;
const OWNER_SESSION_LS = '__po_session';

/**
 * Returns true if the current browser session is authenticated as the
 * platform owner. This is evaluated once at module load time and cached.
 */
function detectOwnerSession(): boolean {
  // Must have an env key configured
  if (!OWNER_KEY_ENV || OWNER_KEY_ENV.trim() === '') return false;
  try {
    const stored = localStorage.getItem(OWNER_SESSION_LS);
    return stored === OWNER_KEY_ENV;
  } catch {
    return false;
  }
}

/**
 * Singleton: computed once, never changes during the session.
 * This prevents clinic admins from toggling it at runtime via devtools.
 */
export const IS_PLATFORM_OWNER: boolean = detectOwnerSession();

/**
 * Call this from the browser console to log in as platform owner.
 * Usage: window.__ownerLogin('<your-key>')
 */
if (typeof window !== 'undefined') {
  (window as any).__ownerLogin = (key: string) => {
    localStorage.setItem(OWNER_SESSION_LS, key);
    console.info('✅ Platform owner session set. Reloading...');
    location.reload();
  };
  (window as any).__ownerLogout = () => {
    localStorage.removeItem(OWNER_SESSION_LS);
    console.info('🔒 Platform owner session cleared. Reloading...');
    location.reload();
  };
}
