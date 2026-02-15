export default {
  async fetch(request, env) {
    // Static assets are served automatically by the [assets] config
    // This worker handles any custom routing if needed
    return new Response('Not found', { status: 404 });
  }
};
