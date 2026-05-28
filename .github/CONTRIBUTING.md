# Contributing to HamLog

Thanks for your interest in improving HamLog! This guide covers how to get a
development environment running and what we expect in a pull request.

## Ways to contribute

- **Report a bug** — open a [bug report](https://github.com/kbennett2000/HamLog/issues/new?template=bug_report.yml).
- **Request a feature** — open a [feature request](https://github.com/kbennett2000/HamLog/issues/new?template=feature_request.yml).
- **Send a pull request** — fix a bug, add a feature, or improve the docs.

For anything non-trivial, please open an issue to discuss the approach before
you start coding.

## Development setup

HamLog is a TypeScript monorepo: an Express + MySQL backend and a React
frontend, deployed with Docker Compose.

1. Install [Docker](https://docs.docker.com/get-docker/) and Node.js 20.
2. Copy the environment file and set a JWT secret:
   ```bash
   cp .env.example .env
   # set JWT_SECRET — e.g. openssl rand -hex 32
   ```
3. Start the stack:
   ```bash
   docker compose up -d
   ```
4. The app is at `http://localhost:8050`.

For frontend-only iteration you can run the dev server in `client/`
(`npm install && npm start`), which proxies the API to the backend.

See the [installation guides](../docs/) for platform-specific details.

## Pull request guidelines

- **Keep changes focused.** One logical change per PR.
- **Tests are required** for new features and bug fixes. A bug fix should
  include a test that fails before the fix and passes after.
- **Run lint and type-checks** before pushing. Both frontend and backend use
  TypeScript `strict` mode.
- **Respect data preservation.** Schema changes must ship as numbered,
  forward-only migrations and must never destroy existing data. This rule
  overrides everything else.
- **Use conventional commits** (`feat:`, `fix:`, `refactor:`, `docs:`, …).
- **Update the docs** when you change user-facing behavior.

## Project conventions

- REST routing is resource-based and lowercase-plural (`POST /api/qsos`).
- All SQL uses parameterized queries — never interpolate user input.
- Timestamps are stored as UTC; the client formats to local time for display.
- See [`CLAUDE.md`](../CLAUDE.md) for the full architecture and conventions.

## Code of Conduct

By participating, you agree to uphold our
[Code of Conduct](CODE_OF_CONDUCT.md).
