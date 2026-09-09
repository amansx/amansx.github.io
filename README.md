# anixir.com

The personal site of Aman Singh: principal distributed systems engineer, ink artist, and game designer.

The site is plain HTML and CSS with Markdown sources under `content/writing`. It is generated and reviewed locally, then published directly to GitHub Pages without CI/CD.

## Local preview

Caddy is pinned as a repository-local Go tool through `go.work` and
`tools/go.mod`. With Go 1.25.1 or newer installed, run this from the repository
root:

```sh
go tool caddy run --config Caddyfile
```

Open `http://127.0.0.1:8080/`. Caddy serves the repository root using the checked-in `Caddyfile` and disables browser caching for local edits.

Stop the server with `Ctrl+C`.

The `CNAME` file configures `anixir.com`; `favicon.ico` is the preserved Anixir favicon.
