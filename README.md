# anixir.com

The personal site of Aman Singh: principal distributed systems engineer, ink artist, and game designer.

The site is plain HTML and CSS with Markdown sources under `content/writing`. It is generated and reviewed locally, then published directly to GitHub Pages without CI/CD.

## Run the site locally

### Prerequisite

Install Go 1.25.1 or newer. Caddy does not need to be installed separately: the
repository pins Caddy in `tools/go.mod` and makes it available through
`go.work`.

### Start the server

From the repository root, run:

```sh
go tool preview
```

The first run downloads and compiles the pinned Caddy version. Later runs reuse
Go's module and build caches. The preview command starts Caddy, waits for the
site to respond on port `8080`, and opens it in your default browser.

Open <http://127.0.0.1:8080/>. Clean directory routes work locally just as they
do on GitHub Pages, for example:

- <http://127.0.0.1:8080/work/>
- <http://127.0.0.1:8080/writing/>
- <http://127.0.0.1:8080/about/>

The checked-in `Caddyfile` serves the repository root only on port `8080`,
disables Caddy's separate admin listener on port `2019`, and sends
`Cache-Control: no-store` so browser refreshes show current edits.

Stop the foreground server with `Ctrl+C`.

To start it without opening a browser, run:

```sh
go tool preview --no-open
```

You can also invoke Caddy directly:

```sh
go tool caddy run --config Caddyfile
```

### Validate the Caddy configuration

To check the configuration without starting the server:

```sh
go tool caddy validate --config Caddyfile
```

Run these commands from the repository root so Go discovers `go.work` and its
local tool module.

## Publishing

The generated site is pushed directly to the `master` branch for GitHub Pages.
There is no CI/CD build. The `CNAME` file configures `anixir.com`, and
`favicon.ico` is the preserved Anixir favicon.
