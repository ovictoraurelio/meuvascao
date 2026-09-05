/**
 * Acesso ao banco. O cliente Drizzle e os repositórios entram na fatia F3; por enquanto só a
 * sonda usada pela rota de saúde, para que nenhuma página fale com o binding diretamente.
 */
export async function pingDatabase(db: D1Database): Promise<void> {
  await db.prepare("SELECT 1").first();
}
