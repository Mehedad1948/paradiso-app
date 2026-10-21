export async function register() {
  // Only the Node.js runtime can open raw sockets (Edge can't)
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const proxy = process.env.SOCKS_PROXY;
  if (!proxy) return;

  const { socksDispatcher } = await import("fetch-socks");
  const { setGlobalDispatcher } = await import("undici");

  const url = new URL(proxy);
  setGlobalDispatcher(
    socksDispatcher({
      type: 5,
      host: url.hostname,
      port: Number(url.port),
    }),
  );
  console.log(`[proxy] server fetch routed through ${proxy}`);
}
