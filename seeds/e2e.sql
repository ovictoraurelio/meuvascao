-- Dados de EXEMPLO para os testes E2E (Playwright). Slugs e nomes batem com os fixtures já
-- escritos em tests/e2e/f04-f10-*.spec.ts (fatia F1) para que, quando cada fixme virar um teste
-- de verdade, o seed já exista. Nenhum destes números ou nomes representa um jogo ou dado real.

-- Jogo agendado, com horário confirmado (2026-09-13, 18h30 em Brasília).
INSERT INTO matches (id, slug, competition, opponent_name, home_away, kickoff_at, kickoff_precision, venue, status, created_at, updated_at)
VALUES ('e2e00000-0000-0000-0000-000000000001', 'vasco-x-adversario-seed', 'Brasileirão (exemplo)', 'Adversário Seed', 'casa', 1789335000000, 'confirmado', 'São Januário (exemplo)', 'agendado', 1788220800000, 1788220800000);

-- Jogo sem horário confirmado ainda.
INSERT INTO matches (id, slug, competition, opponent_name, home_away, kickoff_at, kickoff_precision, status, created_at, updated_at)
VALUES ('e2e00000-0000-0000-0000-000000000002', 'vasco-x-adversario-sem-horario', 'Copa (exemplo)', 'Adversário Seed', 'fora', NULL, 'indefinido', 'indefinido', 1788220800000, 1788220800000);

-- Jogo adiado (mantém o horário original que motivou o adiamento).
INSERT INTO matches (id, slug, competition, opponent_name, home_away, kickoff_at, kickoff_precision, status, created_at, updated_at)
VALUES ('e2e00000-0000-0000-0000-000000000003', 'vasco-x-adversario-adiado', 'Brasileirão (exemplo)', 'Adversário Seed', 'casa', 1789927200000, 'confirmado', 'adiado', 1788220800000, 1788220800000);

-- Jogo encerrado, com placar e fonte (exigido pelo CHECK matches_encerrado_tem_placar).
INSERT INTO matches (id, slug, competition, opponent_name, home_away, kickoff_at, kickoff_precision, status, score_vasco, score_opponent, source_name, source_url, created_at, updated_at)
VALUES ('e2e00000-0000-0000-0000-000000000004', 'vasco-x-adversario-encerrado', 'Brasileirão (exemplo)', 'Adversário Seed', 'fora', 1788125400000, 'confirmado', 'encerrado', 2, 1, 'Fonte Exemplo', 'https://exemplo.com/materia-de-teste', 1788125400000, 1788125400000);

-- Links curados: um normal, um marcado como rumor (F7), um com payload hostil marcado por um
-- identificador único (seed-xss-marker) para o gate de XSS localizar sem depender de contar
-- todo <script> da página — ver tests/e2e/f04-home-captura.spec.ts.
INSERT INTO curated_links (id, url, url_normalized, title, source_name, label, slot, position, status, curated_by, created_at, updated_at)
VALUES ('e2e00001-0000-0000-0000-000000000001', 'https://exemplo.com/noticia-1', 'https://exemplo.com/noticia-1', 'Notícia de exemplo do dia', 'Fonte Exemplo', 'noticia', 'em1minuto', 1, 'publicado', 'seed', 1788220800000, 1788220800000);

INSERT INTO curated_links (id, url, url_normalized, title, source_name, label, slot, position, status, curated_by, created_at, updated_at)
VALUES ('e2e00001-0000-0000-0000-000000000002', 'https://exemplo.com/rumor-da-semana', 'https://exemplo.com/rumor-da-semana', 'Rumor da semana (exemplo)', 'Fonte Exemplo', 'rumor', 'em1minuto', 2, 'publicado', 'seed', 1788220800000, 1788220800000);

INSERT INTO curated_links (id, url, url_normalized, title, source_name, label, slot, position, status, curated_by, created_at, updated_at)
VALUES ('e2e00001-0000-0000-0000-000000000003', 'https://exemplo.com/payload-hostil', 'https://exemplo.com/payload-hostil', '<script>window.__seedXss=1</script><span data-seed-xss-marker>Título hostil</span>', 'Fonte Exemplo', 'noticia', 'ultimas', 1, 'publicado', 'seed', 1788220800000, 1788220800000);

-- Lead já cadastrado, usado pelo teste de duplicidade em tests/e2e/f04-home-captura.spec.ts.
INSERT INTO leads (id, channel, value, value_normalized, source_page, privacy_version, consented_at, ip_hash, created_at, updated_at)
VALUES ('e2e00002-0000-0000-0000-000000000001', 'email', 'torcedor@example.com', 'torcedor@example.com', '/', '2026-01-01', 1788220800000, 'seed-hash', 1788220800000, 1788220800000);
