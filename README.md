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

## Check pull requests

The same Action can check each pull request before it is merged. Add `pull_request` to the workflow's `on:` list and
`pr_check: "on"` to the step:

```yaml
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "17 6 * * *"
  workflow_dispatch:
```

```yaml
      - uses: sixstarlab/repo-watch-action@v1
        with:
          key: ${{ secrets.SIXSTAR_REPO_KEY }}
          site: "<your site address, as your Account page shows it>"
          pr_check: "on"
```

Keep the quotes around `"on"`: without them YAML reads it as true.

On a pull request the Action reads, in your runner, the pull request's lockfiles, its workflows in
`.github/workflows/`, the Dockerfiles and compose files at the repository root, and any AI tool server config
(`.cursor/mcp.json`, `.vscode/mcp.json`, `.mcp.json`, `mcp.json`, `claude_desktop_config.json`). It sends SixStar only
what it found in them: package names and versions, actions and images by name, and each finding with its file and
line. No file's text is sent, and a secret in an AI tool server config is named by its field only, never its value.

It looks for:

* a package listed as malicious, or with a published advisory,
* a package published less than 48 hours ago,
* a package new in the pull request that runs an install script,
* an action whose tags were moved to malicious code, or an action used by tag and not by commit,
* a workflow that starts on a pull request and checks out its code, so anyone who opens one can run code with your
  secrets,
* a container image published as malicious, or used by tag and not pinned to a digest,
* an AI tool server config with a secret written into it, a script it downloads and runs, a plain http address, a
  package with no fixed version, or a server on another host.

Each finding is printed as one line, marked URGENT or Notice. The check fails when anything is urgent, and also when
it could not be made (the site refused it or could not be reached), so that a check that did not run never reads as
a pass. Run the job again in that case. The install script check needs your default branch's list, which this Action
sends from the push and schedule runs above.

## Inputs

| input | required | what it is |
|---|---|---|
| `key` | yes | the key from step 2, from a secret |
| `site` | yes | the SixStar site address, as your Account page's example gives it |
| `lockfiles` | no | lockfiles to read, relative to the repository root, separated by commas. Default: `package-lock.json`, `pnpm-lock.yaml` and `yarn.lock` at the root. Each must end in one of those three names. |
| `pr_check` | no | `"on"` checks each pull request, as described below. Leave it out to send only your default branch's list. |

## What the log says

The step prints one line saying how many packages it sent from how many lockfiles at which commit, or why it sent
nothing. It never prints the key or a package name. The step fails when a lockfile cannot be read, when the site refuses
the list, or when the site cannot be reached after one retry; the next run tries again.

On a pull request it prints one line with what it checked, then one line per finding.
