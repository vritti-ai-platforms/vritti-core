# Contributing to VAP

Thanks for wanting to help. Two things to know before you open a pull request.

## The licence

VAP is licensed under the **GNU Affero General Public License v3.0** — see
`LICENSE`. Contributions are accepted under those terms.

## The Contributor Licence Agreement

**Every contributor must sign the CLA before their first pull request is
merged.** See `CLA.md`.

It is short, and here is the honest version of why it exists:

Vritti AI Platforms may offer VAP under separate commercial terms alongside the
AGPL. That is only possible if Vritti holds sufficient rights to *all* the code
— and under a plain AGPL-inbound model, it would not. Your contribution would
arrive licensed to the project under the AGPL and nothing more, which means
nobody, including Vritti, could offer it under any other licence.

The CLA fixes that. **You keep the copyright in your contribution.** You grant
Vritti a broad licence to it, including the right to sublicense — which is what
makes commercial licensing possible without having to track down and ask every
past contributor.

If you would rather not sign, that is a legitimate position and we would still
like your bug reports, issues and reviews. We just cannot merge code.

### Signing

Once the CLA Assistant app is installed on this repository, opening a pull
request will prompt you automatically; signing is a single comment on the PR
and is recorded against your GitHub account. You sign once, not per pull
request.

Contributing on behalf of an employer? Your employer likely owns the copyright
in work you do for them, so the **corporate** CLA has to be signed by someone
authorised to bind the company. Ask before you start work, not after.

## Before you open a pull request

```bash
pnpm install
pnpm lint          # Biome across all projects
pnpm typecheck
pnpm test
```

Conventions live in `.claude/rules/` and are worth reading first — particularly
`backend-module-structure.md`, `db-schema.md` and `comment-style.md`. A PR that
ignores the module dependency direction or adds JSDoc will get review comments
about the conventions rather than about the change.

Commits follow conventional-commit style (`feat:`, `fix:`, `refactor:`,
`chore:`), because `nx release` derives versions and the changelog from them.

## Reporting a security issue

Please do not open a public issue. Email **shashank@vrittiai.com** with the
details and give us a reasonable window to fix it before disclosing.
