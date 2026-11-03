# SixStar repository watch

Watch a private repository's dependencies with SixStar, without giving us your code or GitHub access.

This Action runs in your own GitHub Actions runner. It reads your lockfiles there, turns each into a list of package
names and versions, and sends only that list to SixStar. SixStar then tells your team when:

* a dependency published only hours ago is added,
* a dependency's maintainers change,
* a package in the list is known to be malicious,
* a package in the list has a security advisory.

## What is sent, and what is not

Sent: the repository's name, the commit, and for each lockfile its path and its package names and versions.

Not sent: your code, any lockfile's text, download addresses, integrity hashes, or any GitHub token. The Action asks
GitHub for nothing, and the job needs only read access to its own checkout.

## Set it up

1. On your SixStar Account page, list the repository (for example `your-org/your-repo`) under repositories.
2. In the API keys section, make a key with "Send private repository package lists". Copy it; it is shown once.
3. In the repository, add the key as a secret named `SIXSTAR_REPO_KEY` (Settings, Secrets and variables, Actions).
4. Add the workflow your Account page shows under "Watch a private repository from GitHub Actions" as
   `.github/workflows/sixstar-repo-watch.yml`. It looks like this, with your site address filled in:

```yaml
name: SixStar repository watch
on:
  push:
    branches: [main]
  schedule:
    - cron: "17 6 * * *"
  workflow_dispatch:
permissions:
  contents: read
jobs:
  packages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: sixstarlab/repo-watch-action@v1
        with:
          key: ${{ secrets.SIXSTAR_REPO_KEY }}
          site: "<your site address, as your Account page shows it>"
```

If your default branch is not `main`, change `branches: [main]` to its name. Only the default branch is sent: a run on
any other branch sends nothing and says so.

## Inputs

| input | required | what it is |
|---|---|---|
| `key` | yes | the key from step 2, from a secret |
| `site` | yes | the SixStar site address, as your Account page's example gives it |
| `lockfiles` | no | lockfiles to read, relative to the repository root, separated by commas. Default: `package-lock.json`, `pnpm-lock.yaml` and `yarn.lock` at the root. Each must end in one of those three names. |

## What the log says

The step prints one line saying how many packages it sent from how many lockfiles at which commit, or why it sent
nothing. It never prints the key or a package name. The step fails when a lockfile cannot be read, when the site refuses
the list, or when the site cannot be reached after one retry; the next run tries again.
