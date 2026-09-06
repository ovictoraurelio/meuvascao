-- Dados de EXEMPLO para explorar `npm run dev` localmente. Nenhum destes números, nomes ou
-- resultados é real; tudo rotulado "(exemplo)" para não ser confundido com conteúdo de verdade.

INSERT INTO matches (id, slug, competition, opponent_name, home_away, kickoff_at, kickoff_precision, venue, status, created_at, updated_at)
VALUES ('dev00000-0000-0000-0000-000000000001', 'vasco-x-time-exemplo', 'Brasileirão (exemplo)', 'Time Exemplo', 'casa', 1789335000000, 'confirmado', 'São Januário (exemplo)', 'agendado', 1788220800000, 1788220800000);

INSERT INTO curated_links (id, url, url_normalized, title, source_name, label, slot, position, status, curated_by, created_at, updated_at)
VALUES ('dev00001-0000-0000-0000-000000000001', 'https://exemplo.com/noticia-do-dia', 'https://exemplo.com/noticia-do-dia', 'Notícia de exemplo do dia', 'Fonte Exemplo', 'noticia', 'em1minuto', 1, 'publicado', 'seed', 1788220800000, 1788220800000);

INSERT INTO curated_links (id, url, url_normalized, title, source_name, label, slot, position, status, curated_by, created_at, updated_at)
VALUES ('dev00001-0000-0000-0000-000000000002', 'https://exemplo.com/opiniao-do-dia', 'https://exemplo.com/opiniao-do-dia', 'Opinião de exemplo sobre o próximo jogo', 'Fonte Exemplo', 'opiniao', 'em1minuto', 2, 'publicado', 'seed', 1788220800000, 1788220800000);
