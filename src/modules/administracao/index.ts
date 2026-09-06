import { z } from "zod";
import type { Database } from "@/lib/db/client";
import {
  getAuthenticatedUser,
  type SessionCookiePayload,
  type User,
} from "@/modules/identidade";
import {
  exportLeadRecords,
  listAdminRecords,
  saveLinkRecord,
  saveMatchRecord,
  withdrawLinkRecord,
} from "./admin.repo";
import { linkInput, matchInput } from "./input";
export class AdminAccessError extends Error {}
export async function requireRole(
  db: Database,
  session: SessionCookiePayload | null,
  roles: readonly User["role"][],
) {
  const auth = await getAuthenticatedUser(db, session);
  if (!auth || auth.user.status !== "active" || !roles.includes(auth.user.role))
    throw new AdminAccessError("Acesso restrito à equipe autorizada.");
  return auth.user;
}
const editorialRoles = ["editor", "admin"] as const;
export async function saveMatch(
  db: Database,
  session: SessionCookiePayload | null,
  input: unknown,
) {
  const actor = await requireRole(db, session, editorialRoles);
  return saveMatchRecord(db, actor, matchInput.parse(input));
}
export async function saveLink(
  db: Database,
  session: SessionCookiePayload | null,
  input: unknown,
) {
  const actor = await requireRole(db, session, editorialRoles);
  return saveLinkRecord(db, actor, linkInput.parse(input));
}
export async function withdrawLink(
  db: Database,
  session: SessionCookiePayload | null,
  id: unknown,
) {
  const actor = await requireRole(db, session, editorialRoles);
  return withdrawLinkRecord(db, actor, z.guid().parse(id));
}
export async function listAdmin(
  db: Database,
  session: SessionCookiePayload | null,
) {
  await requireRole(db, session, editorialRoles);
  return listAdminRecords(db);
}
export async function exportLeads(
  db: Database,
  session: SessionCookiePayload | null,
) {
  const actor = await requireRole(db, session, ["admin"]);
  return exportLeadRecords(db, actor);
}
