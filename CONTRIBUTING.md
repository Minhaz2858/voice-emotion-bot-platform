# Contributing

Thanks for taking the time to contribute. This project is a small, self-hosted
voice agent platform — issues and pull requests are welcome.

## Getting set up

See the [Quickstart](README.md#quickstart). In short: one Flask app in
`landing/` and two Next.js apps in `apps/`. Each component has its own
`.env.example`; copy it to `.env` (Flask) or `.env.local` (Next.js) and fill in
your own provider keys.

## Ground rules

1. **Never commit credentials.** No API keys, tokens, webhook URLs, or live
   service links in code, docs, commits, screenshots or issues. Use
   `process.env.*` server-side or `os.environ[...]`, and document new variables
   in the relevant `.env.example` and in the README table.
2. **Keep provider calls server-side.** The browser must never receive a
   provider key. New providers belong behind a route handler in
   `apps/*/app/api/`.
3. **Don't commit build output or local environments** — `node_modules/`,
   `.next/`, `__pycache__/`, `.venv/`, `*.mp3`, `.DS_Store`.
4. **Match the existing style** of the file you are editing (2-space TS/JS,
   4-space Python, `.editorconfig` covers the basics).

## Pull requests

- One logical change per PR, with a short description of *why*.
- State what you tested and how (browser, mode, provider).
- If you change an API route, update the route table in `README.md` and the
  docs under `docs/` when behaviour changes.
- If you add a provider, add it to the environment-variable table too.

## Reporting bugs

Include: which app/mode, browser, the exact steps, what you expected, what
happened, and the relevant console/terminal output **with all keys redacted**.
