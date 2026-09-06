// Fachada do módulo: pages/actions só importam daqui, nunca de um *.repo.ts diretamente
// (docs/03, "fronteiras" no CLAUDE.md).
export {
  chooseNickname,
  chooseNicknameSchema,
  deleteOwnAccount,
  getAuthenticatedUser,
  requireNotSuspended,
  ReservedNicknameError,
  SuspendedAccountError,
  buildAccountExport,
  type AccountExport,
  type AuthenticatedUser,
  type ChooseNicknameInput,
} from "./account.service";
export {
  DEV_LOGIN_ROLES,
  devLogin,
  devLoginSchema,
  type DevLoginInput,
} from "./dev-login";
export {
  confirmMagicLink,
  InvalidOrExpiredTokenError,
  RateLimitedError,
  requestMagicLink,
  requestMagicLinkSchema,
  TurnstileFailedError,
  type ConfirmMagicLinkResult,
  type RequestMagicLinkContext,
  type RequestMagicLinkInput,
} from "./magic-link";
export { listRecentDevMailboxMessages } from "./mailbox.repo";
export { isReservedNickname, normalizeNickname } from "./nickname";
export {
  buildSessionCookieValue,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifySessionCookieValue,
  type SessionCookiePayload,
} from "./session";
export { revokeAllSessionsForUser, revokeSession } from "./sessions.repo";
export { DuplicateNicknameError, findUserById, type User } from "./users.repo";
