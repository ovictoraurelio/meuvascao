// Worker mínimo exigido pelo pool de testes; os testes exercitam bindings, não este fetch.
export default {
  fetch(): Response {
    return new Response("stub");
  },
};
