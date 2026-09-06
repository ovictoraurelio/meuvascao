const section = document.querySelector<HTMLElement>(".resenha[data-match-id]");
if (section) {
  const textarea = section.querySelector<HTMLTextAreaElement>('[name="body"]');
  const keyInput = section.querySelector<HTMLInputElement>(
    '[name="idempotencyKey"]',
  );
  const form = section.querySelector<HTMLFormElement>("#resenha-form");
  const draftKey = `meuvascao:rascunho:${location.pathname}`;
  try {
    if (section.dataset.published) {
      localStorage.removeItem(draftKey);
      localStorage.removeItem(`${draftKey}:key`);
    } else if (textarea) textarea.value = localStorage.getItem(draftKey) ?? "";
    if (keyInput) {
      const saved = localStorage.getItem(`${draftKey}:key`);
      if (saved) keyInput.value = saved;
      else localStorage.setItem(`${draftKey}:key`, keyInput.value);
    }
  } catch {
    /* Navegador pode bloquear armazenamento; formulário ainda funciona. */
  }
  textarea?.addEventListener("input", () => {
    try {
      localStorage.setItem(draftKey, textarea.value);
    } catch {
      /* Sem persistência local disponível. */
    }
  });
  form?.addEventListener("submit", () => {
    const button = form.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );
    if (button) button.disabled = true;
  });
  section
    .querySelector("#cancelar-resposta")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      section.querySelector('[name="parentId"]')?.remove();
      location.assign(`${location.pathname}#comentar`);
    });
  const pollButton =
    section.querySelector<HTMLButtonElement>("#novas-mensagens");
  const cursor = section.dataset.endCursor ?? "";
  let polling = false;
  async function poll() {
    if (
      document.hidden ||
      polling ||
      !section ||
      !pollButton ||
      section.dataset.hasMore === "true"
    )
      return;
    polling = true;
    try {
      const query = new URLSearchParams({
        matchId: section.dataset.matchId ?? "",
      });
      if (cursor) query.set("cursor", cursor);
      const response = await fetch(`/api/comments?${query}`, {
        credentials: "same-origin",
      });
      if (!response.ok) return;
      const data: unknown = await response.json();
      if (
        !data ||
        typeof data !== "object" ||
        !("items" in data) ||
        !Array.isArray(data.items)
      )
        return;
      if (data.items.length) {
        pollButton.textContent = `${data.items.length} novas mensagens`;
        pollButton.hidden = false;
      }
      // Não avança cursor nem insere conteúdo sem o clique de quem está lendo.
    } catch {
      /* A próxima rodada tenta novamente sem interromper a leitura. */
    } finally {
      polling = false;
    }
  }
  pollButton?.addEventListener("click", () => {
    const target = new URL(location.href);
    if (cursor) target.searchParams.set("cursor", cursor);
    target.hash = "comentar";
    location.assign(target);
  });
  window.setInterval(() => {
    void poll();
  }, 45000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void poll();
  });
}
