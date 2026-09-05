const $ = (s) => document.querySelector(s);
const modal = $("#modal");
// localStorage is optional in this prototype (blocked storage, quota, old data).
const sessionData = new Map();
let storageWritable = true;
function storageNotice() {
  storageWritable = false;
  $(".demo-label span").textContent =
    "Conteúdo ilustrativo · armazenamento indisponível; alterações só nesta sessão";
}
function readStored(key, fallback, validate) {
  try {
    const raw = sessionData.has(key)
      ? sessionData.get(key)
      : localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = key === "mv-name" ? raw : JSON.parse(raw);
    return validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
function writeStored(key, value) {
  const raw = key === "mv-name" ? value : JSON.stringify(value);
  sessionData.set(key, raw);
  try {
    localStorage.setItem(key, raw);
  } catch {
    storageNotice();
  }
}
const validReplies = (value) =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item && typeof item.author === "string" && typeof item.text === "string",
  );
const news = [
  {
    category: "Futebol",
    title: "Trabalho, intensidade e foco na próxima batalha",
    image: "photo-1574629810360-7efbbe195018",
    time: "Há 2 horas",
    likes: 84,
    body: "A semana de preparação é aquele momento de ajustar os detalhes, renovar a confiança e olhar para o próximo desafio. Aqui você vai acompanhar os treinos e as informações do elenco, sempre com fontes e data de publicação.",
  },
  {
    category: "Bastidores",
    title: "São Januário: cada canto guarda uma história",
    image: "photo-1522778119026-d647f0596c20",
    time: "Há 3 horas",
    likes: 126,
    body: "Nossa casa é encontro de gerações. Tem a primeira ida com a família, a amizade na arquibancada e aquele gol que ninguém esquece. Este espaço vai contar as histórias de quem faz São Januário ser tão especial.",
  },
  {
    category: "Torcida",
    title: "A camisa muda. O sentimento continua o mesmo.",
    image: "photo-1517466787929-bc90951d0974",
    time: "Há 4 horas",
    likes: 203,
    body: "Qual camisa marcou sua vida? A que você ganhou quando criança, a que acompanhou uma viagem ou aquela que virou uniforme de todo domingo? A memória da torcida também tem lugar por aqui.",
  },
  {
    category: "Base",
    title: "O futuro do Gigante começa na base",
    image: "photo-1431324155629-1a6deb1dec8d",
    time: "Nesta semana",
    likes: 57,
    body: "Um espaço para acompanhar a formação, conhecer as trajetórias dos jovens e torcer pelo futuro do Vasco. Calendário e cobertura da base serão integrados em uma próxima etapa.",
  },
  {
    category: "Outros esportes",
    title: "A cruz de malta vai muito além do gramado",
    image: "photo-1546519638-68e109498ffc",
    time: "Nesta semana",
    likes: 45,
    body: "A paixão acompanha o clube em cada modalidade. Este será o espaço para reunir a agenda e as histórias de outros esportes do Vasco.",
  },
];
let filter = "Todas",
  expanded = false;
const liked = new Set(
  readStored(
    "mv-likes",
    [],
    (value) =>
      Array.isArray(value) &&
      value.every((id) => Number.isInteger(id) && id >= 0 && id < news.length),
  ),
);
function renderNews() {
  const items = news
    .map((n, i) => ({ ...n, i }))
    .filter((n) => filter === "Todas" || n.category === filter);
  $("#news-grid").innerHTML = items
    .slice(0, expanded ? 99 : 3)
    .map(
      (n) =>
        `<article class="news-card"><button class="news-image" data-news="${n.i}" aria-label="Ler: ${n.title}"><img src="https://images.unsplash.com/${n.image}?auto=format&fit=crop&w=600&q=80" alt="Imagem ilustrativa de ${n.category.toLowerCase()}" loading="lazy"><span>${n.category}</span></button><h3><button class="news-title" data-news="${n.i}">${n.title}</button></h3><div class="news-meta"><span>${n.time} · Ilustrativo</span><button class="like ${liked.has(n.i) ? "liked" : ""}" data-like="${n.i}" aria-label="Curtir notícia" aria-pressed="${liked.has(n.i)}">${liked.has(n.i) ? "♥" : "♡"} ${n.likes + (liked.has(n.i) ? 1 : 0)}</button></div></article>`,
    )
    .join("");
}
function open(content) {
  $("#modal-content").innerHTML = content;
  $("#modal-content h2").id = "modal-title";
  modal.setAttribute("aria-labelledby", "modal-title");
  modal.showModal();
}
function toast(message) {
  $("#toast").textContent = storageWritable
    ? message
    : "Alteração aplicada apenas nesta sessão. O armazenamento está indisponível.";
  $("#toast").classList.add("visible");
  setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}
$("#close-modal").onclick = () => modal.close();
modal.addEventListener("click", (e) => {
  if (
    e.target === modal &&
    e.offsetX >= 0 &&
    (e.offsetX > modal.clientWidth || e.offsetY > modal.clientHeight)
  )
    modal.close();
});
document.addEventListener("click", (e) => {
  const n = e.target.closest("[data-news]");
  if (n) {
    const item = news[+n.dataset.news];
    open(
      `<span class="eyebrow">${item.category.toUpperCase()} · CONTEÚDO DEMONSTRATIVO</span><h2>${item.title}</h2><p>${item.body}</p><p>Esta matéria é uma prévia editorial do portal. Não representa uma notícia ou atualização real do clube.</p><button class="primary" id="discuss">Levar pra resenha →</button>`,
    );
    $("#discuss").onclick = () => {
      modal.close();
      $("#resenha").scrollIntoView({ behavior: "smooth" });
    };
  }
  const l = e.target.closest("[data-like]");
  if (l) {
    const id = +l.dataset.like;
    liked.has(id) ? liked.delete(id) : liked.add(id);
    writeStored("mv-likes", [...liked]);
    renderNews();
  }
});
document.querySelectorAll("[data-filter]").forEach(
  (b) =>
    (b.onclick = () => {
      filter = b.dataset.filter;
      document
        .querySelectorAll("[data-filter]")
        .forEach((x) => x.classList.toggle("selected", x === b));
      renderNews();
    }),
);
$("#all-news").onclick = () => {
  expanded = !expanded;
  $("#all-news").textContent = expanded ? "Ver menos ↑" : "Todas as notícias ↗";
  renderNews();
};
const slides = [
  [
    "O CALDEIRÃO VAI FERVER",
    "Tem coisa que só<br>São Januário explica.",
    "Não é só sobre futebol. É sobre pertencer.<br>A nossa casa, a nossa história, a nossa gente.",
  ],
  [
    "UM AMOR QUE ATRAVESSA GERAÇÕES",
    "A gente herda a camisa.<br>E vive o sentimento.",
    "Da primeira ida ao estádio à próxima batalha.<br>Tem uma história de Vasco em cada um de nós.",
  ],
  [
    "ONDE ESTIVER, EU VOU ESTAR",
    "A distância muda.<br>A paixão, nunca.",
    "Na arquibancada ou do outro lado do mundo.<br>Vascaíno sempre encontra a sua torcida.",
  ],
];
let slide = 0;
document.querySelectorAll("[data-slide]").forEach(
  (b) =>
    (b.onclick = () => {
      slide = +b.dataset.slide;
      $(".overline").textContent = slides[slide][0];
      $(".hero h2").innerHTML = slides[slide][1];
      $(".hero p").innerHTML = slides[slide][2];
      $(".hero-count").innerHTML = `0${slide + 1} <span>/ 03</span>`;
      document
        .querySelectorAll("[data-slide]")
        .forEach((x) => x.classList.toggle("selected", x === b));
    }),
);
$(".story-link").onclick = () =>
  open(
    `<span class="eyebrow">A VOZ DA ARQUIBANCADA</span><h2>${slides[slide][1]}</h2><p>Tem quem aprendeu a torcer antes de aprender a ler. Tem quem encontrou no Vasco uma família. E tem quem ainda vai viver seu primeiro jogo em São Januário.</p><p>O Meu Vascão nasce para reunir essas histórias. Um lugar para viver o pré-jogo, dividir a ansiedade, comemorar e continuar junto depois do apito final.</p><p>De vascaíno pra vascaíno. O sentimento não pode parar.</p>`,
  );
function poll(v) {
  document.querySelectorAll("[data-vote]").forEach((b, i) => {
    b.classList.toggle("voted", i === v);
    b.querySelector("span").textContent = ["82%", "13%", "5%"][i];
    b.setAttribute("aria-pressed", i === v);
  });
  $("#poll-note").textContent = storageWritable
    ? "Seu palpite foi salvo neste aparelho. Percentuais ilustrativos."
    : "Palpite aplicado só nesta sessão. Percentuais ilustrativos.";
}
document.querySelectorAll("[data-vote]").forEach(
  (b) =>
    (b.onclick = () => {
      writeStored("mv-vote", +b.dataset.vote);
      poll(+b.dataset.vote);
    }),
);
const savedVote = readStored("mv-vote", null, (value) =>
  [0, 1, 2].includes(value),
);
if (savedVote !== null) poll(savedVote);
$("#match-center").onclick = () =>
  open(
    '<span class="eyebrow">CENTRAL DO JOGO · DEMONSTRAÇÃO</span><h2>Vasco × Santos</h2><p>São Januário • Domingo, 18h30</p><p>O pré-jogo é nosso! A proposta é reunir informações da partida e a conversa da torcida. Cobertura lance a lance não faz parte da primeira versão.</p><p><b>Agenda ilustrativa:</b> data, adversário e horário ainda não estão conectados a uma fonte de partidas reais.</p><button class="primary" id="go-chat">Entrar na resenha →</button>',
  );
modal.addEventListener("click", (e) => {
  if (e.target.id === "go-chat") {
    modal.close();
    $("#resenha").scrollIntoView({ behavior: "smooth" });
  }
});
let username = readStored(
  "mv-name",
  null,
  (value) =>
    typeof value === "string" && value.trim().length > 0 && value.length <= 30,
);
function updateUser() {
  if (username) $("#join").textContent = "✠ " + username;
}
updateUser();
$("#join").onclick = () => {
  open(
    `<span class="eyebrow">A CASA TAMBÉM É SUA</span><h2>Chega mais, vascaíno.</h2><p>Escolha como quer aparecer na resenha. Nesta versão, seu perfil fica salvo apenas neste aparelho.</p><form id="profile-form"><label for="nickname">Seu nome ou apelido</label><input id="nickname" maxlength="30" required placeholder="Como a torcida te chama?" autocomplete="nickname"><button class="primary">Entrar pra torcida ✠</button></form>`,
  );
  $("#profile-form").onsubmit = (e) => {
    e.preventDefault();
    const value = $("#nickname").value.trim();
    if (!value) return;
    username = value;
    writeStored("mv-name", username);
    updateUser();
    modal.close();
    toast("Você já é de casa. Saudações vascaínas!");
  };
};
const escape = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const baseTopics = [
  {
    tag: "PRÉ-JOGO",
    title: "Qual seria o seu time titular pra próxima batalha?",
    author: "Rafa Cruzmaltino",
    count: 38,
  },
  {
    tag: "MEMÓRIA VASCAÍNA",
    title: "Qual foi o seu primeiro jogo em São Januário?",
    author: "Mari da Colina",
    count: 64,
  },
  {
    tag: "PAPO DE TORCIDA",
    title: "Aquela camisa que você não troca por nada. Qual é?",
    author: "Gui / Vascão",
    count: 27,
  },
];
let topics = [
  ...baseTopics,
  ...readStored(
    "mv-topics",
    [],
    (value) =>
      Array.isArray(value) &&
      value.every(
        (item) =>
          item &&
          ["tag", "title", "author", "body"].every(
            (key) => typeof item[key] === "string",
          ) &&
          Number.isInteger(item.count) &&
          item.count >= 0,
      ),
  ),
];
function renderTopics() {
  $("#forum-grid").innerHTML = topics
    .map(
      (t, i) =>
        `<button class="topic" data-topic="${i}"><span class="topic-label">${escape(t.tag)}</span><h3>${escape(t.title)}</h3><div class="topic-bottom"><span>${escape(t.author)}</span><span>♧ ${t.count + readStored("mv-replies-" + i, [], validReplies).length} respostas</span></div></button>`,
    )
    .join("");
}
function saveTopics() {
  writeStored("mv-topics", topics.slice(baseTopics.length));
}
$("#new-topic").onclick = () => {
  open(
    '<span class="eyebrow">SOLTA A VOZ</span><h2>Qual é a resenha?</h2><p>Seu tópico ficará salvo neste aparelho para experimentar o fórum.</p><form id="topic-form"><label for="topic-title">Título da conversa</label><input id="topic-title" maxlength="120" required placeholder="O que vamos discutir hoje?"><label for="topic-body">Sua mensagem</label><textarea id="topic-body" required maxlength="2000" placeholder="Pode chegar, a casa é nossa."></textarea><button class="primary">Publicar neste aparelho →</button></form>',
  );
  $("#topic-form").onsubmit = (e) => {
    e.preventDefault();
    const title = $("#topic-title").value.trim(),
      body = $("#topic-body").value.trim();
    if (!title || !body) return;
    topics.push({
      tag: "DA TORCIDA",
      title,
      body,
      author: username || "Vascaíno",
      count: 0,
    });
    saveTopics();
    renderTopics();
    modal.close();
    toast("Resenha criada neste aparelho!");
  };
};
$("#forum-grid").onclick = (e) => {
  const b = e.target.closest("[data-topic]");
  if (!b) return;
  const id = +b.dataset.topic,
    t = topics[id];
  const key = "mv-replies-" + id;
  let replies = readStored(key, [], validReplies);
  open(
    `<span class="eyebrow">${escape(t.tag)}</span><h2>${escape(t.title)}</h2><p>${escape(t.body || "A conversa começa com você. Conta a sua opinião!")}</p><p style="font-size:11px">Demonstração local. As contagens iniciais são ilustrativas; suas respostas ficam neste aparelho.</p><div id="replies"></div><form id="reply-form"><label for="reply">Sua resposta</label><textarea id="reply" required maxlength="2000" placeholder="Resenha boa tem respeito."></textarea><button class="primary">Responder neste aparelho →</button></form>`,
  );
  function renderReplies() {
    $("#replies").innerHTML = replies
      .map(
        (r) =>
          `<div class="reply"><b>${escape(r.author)}</b><p>${escape(r.text)}</p></div>`,
      )
      .join("");
  }
  renderReplies();
  $("#reply-form").onsubmit = (e) => {
    e.preventDefault();
    const text = $("#reply").value.trim();
    if (!text) return;
    replies.push({ author: username || "Vascaíno", text });
    writeStored(key, replies);
    renderReplies();
    renderTopics();
    $("#reply").value = "";
    toast("Resposta salva neste aparelho");
  };
};
$(".mobile-menu").onclick = () => {
  $("nav").classList.toggle("open");
  $(".mobile-menu").setAttribute(
    "aria-expanded",
    $("nav").classList.contains("open"),
  );
};
document.querySelectorAll("nav a").forEach(
  (a) =>
    (a.onclick = () => {
      document
        .querySelectorAll("nav a")
        .forEach((x) => x.classList.toggle("active", x === a));
      $("nav").classList.remove("open");
      $(".mobile-menu").setAttribute("aria-expanded", "false");
    }),
);
renderNews();
renderTopics();
