type CommunityErrorCode =
  "UNAUTHORIZED" | "FORBIDDEN" | "BAD_REQUEST" | "TOO_MANY_REQUESTS";
export class CommunityError extends Error {
  readonly code: CommunityErrorCode;
  readonly retryAfter: number;
  constructor(
    message: string,
    code: CommunityErrorCode = "BAD_REQUEST",
    retryAfter = 0,
  ) {
    super(message);
    this.code = code;
    this.retryAfter = retryAfter;
  }
}
