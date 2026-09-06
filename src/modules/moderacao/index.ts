import type { Database } from "@/lib/db/client";
import { requireRole } from "@/modules/administracao";
import type { SessionCookiePayload } from "@/modules/identidade";
import {
  reasonInput,
  suspensionInput,
  slowModeInput,
  threadClosedInput,
  writingClosedInput,
} from "./input";
import {
  hideCommentRecord,
  listModerationRecords,
  setUserSuspendedRecord,
  setThreadRecord,
  setWritingClosedRecord,
  resolveReportRecord,
} from "./moderation.repo";
export { ModerationTargetError } from "./moderation.repo";
const roles = ["moderador", "admin"] as const;
type Session = SessionCookiePayload | null;
export async function listModeration(db: Database, session: Session) {
  await requireRole(db, session, roles);
  return listModerationRecords(db);
}
export async function hideComment(
  db: Database,
  session: Session,
  input: unknown,
) {
  const actor = await requireRole(db, session, roles);
  return hideCommentRecord(db, actor, reasonInput.parse(input));
}
export async function resolveReport(
  db: Database,
  session: Session,
  input: unknown,
) {
  const actor = await requireRole(db, session, roles);
  return resolveReportRecord(db, actor, reasonInput.parse(input));
}
export async function setUserSuspended(
  db: Database,
  session: Session,
  input: unknown,
) {
  const actor = await requireRole(db, session, roles);
  return setUserSuspendedRecord(db, actor, suspensionInput.parse(input));
}
export async function setSlowMode(
  db: Database,
  session: Session,
  input: unknown,
) {
  const actor = await requireRole(db, session, roles);
  const parsed = slowModeInput.parse(input);
  return setThreadRecord(
    db,
    actor,
    parsed.id,
    { slowModeSeconds: parsed.seconds },
    parsed.reason,
  );
}
export async function setThreadClosed(
  db: Database,
  session: Session,
  input: unknown,
) {
  const actor = await requireRole(db, session, roles);
  const parsed = threadClosedInput.parse(input);
  return setThreadRecord(
    db,
    actor,
    parsed.id,
    { status: parsed.closed ? "closed" : "open" },
    parsed.reason,
  );
}
export async function setWritingClosed(
  db: Database,
  session: Session,
  input: unknown,
) {
  const actor = await requireRole(db, session, roles);
  return setWritingClosedRecord(db, actor, writingClosedInput.parse(input));
}
