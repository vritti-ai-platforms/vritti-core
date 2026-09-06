# vritti-core — mobile task runner (install: `brew install just`).
# Bare `just` lists every recipe.
#
# SCOPE: this file owns the MOBILE stack only — core-app (the host shell) and commerce-ma (its
# micro-app). Neither has an nx project.json, so they sit outside `nx run-many` and their commands
# have lived as ad-hoc pnpm scripts + tribal knowledge. Everything else in this repo (core-server,
# core-web, the web MFs, db:*, lint, build, test) stays with pnpm/nx — a wrapper here would just be
# a second place to update.
#
# ENV: core-app reads its config from Infisical at /core-app. Three environments, and every recipe
# that needs one takes it as the first arg — omit it for a picker menu:
#   local      → API on local.vrittiai.com  (loopback; simulator only)
#   dev-local  → API on dev.vrittiai.com
#   apw1-local → API on apw1.vrittiai.com
#
# DAY TO DAY: `just app-start` (multi-select the bundlers) then `just app-build` (pick ios/android,
# device/simulator). Both preflight via app-doctor. New machine? `just app-bootstrap` first.

app_envs := "local dev-local apw1-local"
quantum := "../quantum-ui-native"
app := "apps/core-app"
ma := "apps/micro-apps/commerce-ma"

# Every folder under apps/micro-apps/ — auto-discovered, so a new micro-app shows up in the
# `app-start` menu the moment it exists. Relies on dir name == pnpm package name, which is the
# convention today (commerce-ma) and what the pnpm-workspace glob already assumes.
micro_apps := `ls -d apps/micro-apps/*/ 2>/dev/null | xargs -n1 basename | sort | tr '\n' ' '`

_default:
    @just --list

# ============================== preflight ==============================

# Check every known core-app blocker before you burn time on a build; picker if env omitted
app-doctor env="":
    #!/usr/bin/env bash
    set -uo pipefail
    sel="{{env}}"; sel="${sel#env=}"
    if [ -z "$sel" ]; then
      echo "Select a core-app env:" >&2; PS3="> "
      select sel in {{app_envs}}; do [ -n "$sel" ] && break; done
    fi
    case "$sel" in local|dev-local|apw1-local) ;; *) echo "app-doctor: env must be one of: {{app_envs}} (got '$sel')" >&2; exit 1;; esac

    fail=0
    ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
    bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; fail=1; }
    warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }

    echo "── env ($sel) ──"
    # Read through `infisical run` so personal overrides resolve exactly as the bundler will see them.
    # `.env*` files are loaded by rspack with override:false, so they only FILL GAPS — Infisical always
    # wins. That asymmetry is why GRAPHQL_PATH is fixable in .env.local but DEV_HOST is not.
    envdump=$(cd {{app}} && infisical run --env="$sel" --path=/core-app --silent -- \
      bash -c 'printf "%s\n%s\n%s\n%s\n" "${GRAPHQL_PATH:-}" "${DEV_HOST:-}" "${API_BASE_URL:-}" "${DEPLOYMENTS_API_BASE_URL:-}"' 2>/dev/null)
    gql=$(sed -n 1p <<<"$envdump"); devhost=$(sed -n 2p <<<"$envdump")
    api=$(sed -n 3p <<<"$envdump"); deployments=$(sed -n 4p <<<"$envdump")

    # rspack validates with zod at startup — a missing key is a hard stop, not a warning.
    if [ -n "$gql" ]; then ok "GRAPHQL_PATH=$gql"
    elif grep -qs '^GRAPHQL_PATH=' {{app}}/.env.local; then ok "GRAPHQL_PATH from .env.local (gap-filled)"
    else bad "GRAPHQL_PATH unset — Metro dies on zod validation before it serves anything. Fix: just app-bootstrap"; fi

    # DEV_HOST has TWO independent consumers that read it from different places, so it gets two checks:
    #   core-app    — started under `infisical run`; its rspack loads .env* with override:false, so the
    #                 Infisical value always wins and a file can never correct it.
    #   commerce-ma — NO infisical wrapper at all. Its rspack reads apps/core-app/.env* directly
    #                 ("shares core-app's .env as single source of truth") and HARD-THROWS if unset.
    # One of them being right tells you nothing about the other. `just app-ip` writes both.
    lan=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
    filehost=""
    for f in .env .env.development .env.local .env.development.local; do
      [ -f "{{app}}/$f" ] || continue
      v=$(grep -m1 '^DEV_HOST=' "{{app}}/$f" 2>/dev/null | cut -d= -f2- | tr -d "\"'" | xargs || true)
      [ -n "$v" ] && { filehost="$v"; break; }
    done
    if [ -z "$lan" ]; then
      warn "no LAN address on en0/en1 — a physical device cannot reach this machine"
    else
      [ "$devhost" = "$lan" ] \
        && ok "DEV_HOST=$devhost (core-app, via Infisical) matches this machine" \
        || bad "core-app DEV_HOST=${devhost:-unset} but this Mac is $lan — Metro connects, then every feature tab 404s fetching the remote. Fix: just app-ip $sel"
      if [ -z "$filehost" ]; then
        bad "commerce-ma has no DEV_HOST — it reads {{app}}/.env* (never Infisical) and throws on startup without it. Fix: just app-ip $sel"
      elif [ "$filehost" = "$lan" ]; then
        ok "DEV_HOST=$filehost (commerce-ma, via {{app}}/.env*) matches this machine"
      else
        bad "commerce-ma DEV_HOST=$filehost in {{app}}/.env* but this Mac is $lan. Fix: just app-ip $sel"
      fi
    fi

    # A loopback API host is correct for the simulator and fatal on a real phone, so this is a warning
    # with the distinction spelled out rather than a pass/fail the recipe can't actually judge.
    apihost=$(sed -E 's#^https?://([^:/]+).*#\1#' <<<"$api")
    if [[ "$apihost" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then resolved="$apihost"
    else resolved=$(dig +short "$apihost" 2>/dev/null | grep -E '^[0-9]' | head -1); fi
    case "$resolved" in
      127.*)  warn "API_BASE_URL=$api resolves to $resolved — simulator OK, unreachable from a physical iPhone" ;;
      "")     bad "API_BASE_URL host '$apihost' does not resolve at all — nothing will reach the backend" ;;
      *)      ok "API_BASE_URL → $resolved" ;;
    esac
    [ -n "$deployments" ] && ok "DEPLOYMENTS_API_BASE_URL set" || bad "DEPLOYMENTS_API_BASE_URL unset — the deployment picker has nothing to list"

    echo "── workspace ──"
    # commerce-ma's src/gql is gitignored client-preset output; its graphql/* files import it at
    # RUNTIME, so an empty dir is a bundler resolve failure, not just a type error.
    [ -n "$(ls -A {{ma}}/src/gql 2>/dev/null)" ] \
      && ok "commerce-ma gql generated" \
      || bad "commerce-ma/src/gql is empty — the bundler cannot resolve '../../gql'. Fix: just app-codegen"

    diff -q {{app}}/ios/Podfile.lock {{app}}/ios/Pods/Manifest.lock >/dev/null 2>&1 \
      && ok "Pods in sync" \
      || bad "Pods out of sync with Podfile.lock. Fix: just app-pods"

    # WARNING, never a failure: rspack aliases quantum-ui-native to lib/ SOURCE, so a stale dist only
    # ever breaks tsc. Failing the run over it would send you building a package you don't need built.
    if [ ! -d {{quantum}} ]; then
      bad "{{quantum}} not checked out — rspack aliases every quantum subpath into it; nothing will bundle"
    elif [ {{quantum}}/dist/typescript/lib/utils/index.d.ts -nt {{quantum}}/lib/utils/index.ts ]; then
      ok "quantum-ui-native dist current"
    else
      warn "quantum-ui-native dist is older than its source — typecheck reports phantom errors; RUNTIME IS FINE. Fix: just app-types"
    fi

    echo
    if [ $fail -eq 0 ]; then echo "✓ ready — next: just app-start $sel, then just app-build"; else echo "✗ fix the ✗ lines above, then re-run"; exit 1; fi

# One-time machine setup — gap-fill GRAPHQL_PATH, pin DEV_HOST, install pods, run codegen; picker if omitted
app-bootstrap env="":
    #!/usr/bin/env bash
    set -euo pipefail
    sel="{{env}}"; sel="${sel#env=}"
    if [ -z "$sel" ]; then
      echo "Select a core-app env to bootstrap:" >&2; PS3="> "
      select sel in {{app_envs}}; do [ -n "$sel" ] && break; done
    fi
    # GRAPHQL_PATH is absent from every Infisical env, so .env.local (gitignored, loaded by rspack,
    # gap-fill only) is the right home for it until someone adds it upstream.
    if ! grep -qs '^GRAPHQL_PATH=' {{app}}/.env.local; then
      echo "── writing GRAPHQL_PATH to {{app}}/.env.local ──"
      echo 'GRAPHQL_PATH=/mobile-graphql' >> {{app}}/.env.local
    fi
    just app-ip "$sel"
    just app-pods
    just app-codegen
    echo "✓ bootstrapped — run: just app-doctor $sel"

# Pin DEV_HOST to this machine's LAN IP for BOTH bundlers (Infisical override + .env.local); picker if omitted
app-ip env="":
    #!/usr/bin/env bash
    set -euo pipefail
    sel="{{env}}"; sel="${sel#env=}"
    if [ -z "$sel" ]; then
      echo "Select a core-app env:" >&2; PS3="> "
      select sel in {{app_envs}}; do [ -n "$sel" ] && break; done
    fi
    lan=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null) \
      || { echo "no LAN address on en0/en1 — are you on Wi-Fi?" >&2; exit 1; }
    echo "This machine: $lan"
    echo
    echo "Two writes, because the bundlers read DEV_HOST from different places:"
    echo "  1. Infisical PERSONAL override on '$sel'  → core-app (runs under infisical run; its value wins over any file)"
    echo "  2. {{app}}/.env.local                     → commerce-ma (reads these files directly, never Infisical)"
    echo
    # Personal, never shared: DEV_HOST is per-developer, and the shared value is whichever teammate
    # set it last. A personal override changes nothing for anyone else. The .env.local write is
    # gitignored, so it is per-machine too.
    read -r -p "Set DEV_HOST=$lan in both (shared Infisical value untouched)? [y/N] " ok
    [ "$ok" = y ] || [ "$ok" = Y ] || { echo "aborted (no changes)"; exit 0; }
    echo "── infisical (personal, $sel) ──"
    (cd {{app}} && infisical secrets set "DEV_HOST=$lan" --type=personal --env="$sel" --path=/core-app)
    echo "── {{app}}/.env.local ──"
    touch {{app}}/.env.local
    # Rewrite in place rather than append, so re-running on a new network doesn't stack stale entries.
    tmp=$(mktemp); grep -v '^DEV_HOST=' {{app}}/.env.local > "$tmp" || true
    echo "DEV_HOST=$lan" >> "$tmp"
    mv "$tmp" {{app}}/.env.local
    echo "✓ restart both bundlers to pick it up — DEV_HOST is a DefinePlugin value, no native rebuild needed"

# ============================ codegen / types ==========================

# Regenerate GraphQL artefacts for BOTH apps against core-server's schema.mobile.gql
app-codegen:
    #!/usr/bin/env bash
    set -euo pipefail
    # Two different setups, both pointed at apps/core-server/src/schema.mobile.gql: core-app emits
    # plain types (its ops use gql`` + explicit generics), commerce-ma uses the client-preset and
    # writes a whole gitignored src/gql/ tree. Running only one is the usual mistake.
    echo "── core-app (typescript plugin) ──"
    pnpm --filter vritti-core-app codegen
    echo "── commerce-ma (client-preset → src/gql/) ──"
    pnpm --filter commerce-ma codegen
    echo "✓ codegen complete"

# Typecheck both mobile apps — builds quantum-ui-native's dist first (tsc reads it, rspack does not)
app-types: app-codegen
    #!/usr/bin/env bash
    set -euo pipefail
    # The split that causes the phantom errors: rspack aliases @vritti/quantum-ui-native to the local
    # repo's lib/ source, while tsconfig paths resolve to that repo's dist/typescript. Build first or
    # you typecheck against whatever the package looked like the last time someone ran `bob build`.
    echo "── building {{quantum}} dist ──"
    (cd {{quantum}} && pnpm build)
    echo "── core-app ──"
    npx tsc --noEmit --incremental false -p {{app}}/tsconfig.json
    echo "── commerce-ma ──"
    npx tsc --noEmit --incremental false -p {{ma}}/tsconfig.json
    echo "✓ both apps typecheck"

# ============================== dev servers ============================

# Start the bundlers you pick — core-app and/or any micro-app. Full raw logs, cache reset; Ctrl-C stops all
app-start env="":
    #!/usr/bin/env bash
    set -euo pipefail
    # Job control, so each bundler becomes its own process group leader. That is what lets one Ctrl-C
    # take down pnpm AND the node it spawned, instead of orphaning a bundler holding :8081 / :9002.
    set -m

    all=(core-app {{micro_apps}})
    echo "Select what to start — numbers separated by space or comma, or 'all':" >&2
    for i in "${!all[@]}"; do printf "  %d) %s\n" "$((i+1))" "${all[$i]}" >&2; done
    read -r -p "> " picks
    [ -n "$picks" ] || { echo "nothing selected"; exit 0; }

    chosen=()
    if [ "$picks" = all ]; then
      chosen=("${all[@]}")
    else
      for n in ${picks//,/ }; do
        case "$n" in ''|*[!0-9]*) echo "app-start: '$n' is not a number" >&2; exit 1;; esac
        idx=$((n - 1))
        { [ "$idx" -ge 0 ] && [ "$idx" -lt "${#all[@]}" ]; } || { echo "app-start: $n is out of range" >&2; exit 1; }
        chosen+=("${all[$idx]}")
      done
    fi

    # Only core-app is env-scoped; micro-apps take their config from the host at runtime.
    sel="{{env}}"; sel="${sel#env=}"
    needs_env=0
    for c in "${chosen[@]}"; do [ "$c" = core-app ] && needs_env=1; done
    if [ "$needs_env" = 1 ]; then
      if [ -z "$sel" ]; then
        echo "Select a core-app env:" >&2; PS3="> "
        select sel in {{app_envs}}; do [ -n "$sel" ] && break; done
      fi
      # Preflight inline rather than as a just dependency: a dependency is resolved before this body
      # runs, so it would pop its own env menu instead of reusing the one just chosen above.
      just app-doctor "$sel"
      case "$sel" in
        local)      script=start;;
        dev-local)  script=start:dev;;
        apw1-local) script=start:apw1;;
        *) echo "app-start: env must be one of: {{app_envs}} (got '$sel')" >&2; exit 1;;
      esac
    fi

    # Only ONE process group can be the terminal's foreground, and Re.Pack puts stdin in raw mode for
    # its r/d/j/a keys. A server in a background process group that reaches for the terminal gets
    # SIGTTIN and STOPS — which is exactly why output used to die at the banner, the line immediately
    # before the keys menu. So one server holds the foreground with full interactivity, and the rest
    # run with stdin detached from /dev/null: full logs, just no keybindings.
    #
    # Deliberately NO `set -m` here. Without job control the background children stay in this shell's
    # process group, which is the terminal's foreground group — so one Ctrl-C signals all of them.
    fg=""; bg=()
    for c in "${chosen[@]}"; do
      if [ "$c" = core-app ]; then fg="$c"; else bg+=("$c"); fi
    done
    # No core-app selected — promote the last micro-app to the foreground so something owns the keys.
    if [ -z "$fg" ]; then
      fg="${bg[$((${#bg[@]} - 1))]}"
      unset "bg[$((${#bg[@]} - 1))]"
    fi

    # macOS ships bash 3.2, where "${arr[@]}" on an EMPTY array is an unbound-variable error under
    # `set -u`. Selecting core-app alone leaves both arrays empty, so every expansion is count-guarded.
    pids=()
    stop() {
      trap - INT TERM EXIT
      echo; echo "── stopping ──"
      if [ ${#pids[@]} -gt 0 ]; then
        for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done
      fi
    }
    trap stop INT TERM EXIT

    # --reset-cache every time: both bundlers alias @vritti/quantum-ui-native to that repo's lib/
    # SOURCE, which lives outside this workspace and is NOT watched, so without a reset you keep
    # bundling the last-cached copy and edits there silently do nothing.
    #
    # No `--` before the flag. pnpm >=8 forwards `--` through as a literal argument, so
    # `start -- --reset-cache` lands as a positional the RN CLI ignores (verified: it stayed on :9002
    # when told --port 9111). Bare `--reset-cache` is what actually reaches react-native start.
    #
    # stdout/stderr are inherited, never piped. An earlier version piped through awk to label each
    # line and that silently ate the build: Re.Pack draws progress with carriage returns and no
    # newline, so every spinner frame piled into one unterminated record and nothing printed between
    # the banner and the first "Compiled" line.
    script="${script:-}"
    launch() {
      if [ "$1" = core-app ]; then
        pnpm --filter vritti-core-app "$script" --reset-cache
      else
        pnpm --filter "$1" start --reset-cache
      fi
    }

    echo
    # Background everything except the foreground one, with stdin detached so it never trips SIGTTIN.
    if [ ${#bg[@]} -gt 0 ]; then
      for c in "${bg[@]}"; do
        launch "$c" </dev/null &
        pids+=("$!")
        printf '→ %-12s background (pid %s) — full logs, no keybindings\n' "$c" "$!"
      done
    fi
    printf '→ %-12s foreground — r/d/j keys land here\n' "$fg"
    echo "── Ctrl-C stops everything ──"
    echo
    # Foreground, not backgrounded: this one owns the terminal, so Re.Pack can raw-mode stdin and
    # prints its full output — banner, keys menu, "Server listening", compile progress and all.
    launch "$fg"

# core-app host bundler on :8081 alone — live TTY, warm cache (no reset); picker if env omitted
app-metro env="":
    #!/usr/bin/env bash
    set -euo pipefail
    sel="{{env}}"; sel="${sel#env=}"
    if [ -z "$sel" ]; then
      echo "Select a core-app env:" >&2; PS3="> "
      select sel in {{app_envs}}; do [ -n "$sel" ] && break; done
    fi
    case "$sel" in
      local)      script=start;;
      dev-local)  script=start:dev;;
      apw1-local) script=start:apw1;;
      *) echo "app-metro: env must be one of: {{app_envs}} (got '$sel')" >&2; exit 1;;
    esac
    exec pnpm --filter vritti-core-app "$script"

# commerce-ma bundler on :9002 alone — live TTY, warm cache (no reset)
app-remote:
    exec pnpm --filter commerce-ma start

# ================================ build ================================

# Build + install core-app — pick ios | android, then device or simulator. Preflights first
app-build platform="" target="" env="":
    #!/usr/bin/env bash
    set -euo pipefail
    p="{{platform}}"; p="${p#platform=}"
    if [ -z "$p" ]; then
      echo "Select a platform:" >&2; PS3="> "
      select p in ios android; do [ -n "$p" ] && break; done
    fi
    case "$p" in ios|android) ;; *) echo "app-build: platform must be ios | android (got '$p')" >&2; exit 1;; esac

    # Same idea either way; the word just differs by platform, so the menu uses the native one.
    [ "$p" = ios ] && virtual=simulator || virtual=emulator
    t="{{target}}"; t="${t#target=}"
    if [ -z "$t" ]; then
      echo "Select a target:" >&2; PS3="> "
      select t in device "$virtual"; do [ -n "$t" ] && break; done
    fi
    case "$t" in device|simulator|emulator) ;; *) echo "app-build: target must be device | $virtual (got '$t')" >&2; exit 1;; esac

    sel="{{env}}"; sel="${sel#env=}"
    if [ -z "$sel" ]; then
      echo "Select a core-app env:" >&2; PS3="> "
      select sel in {{app_envs}}; do [ -n "$sel" ] && break; done
    fi
    just app-doctor "$sel"

    if [ "$p" = ios ] && [ "$t" = device ]; then
      echo "── reminder: the phone needs the mkcert CA trusted (just app-ca) to reach an https API ──"
    fi

    # --no-packager throughout: the bundler comes from `just app-start`. Without it the CLI spawns a
    # second one on :8081 that races the running one and serves a different DEV_HOST.
    # --list-devices is the CLI's own picker — better than parsing xctrace/adb, since it already
    # knows which targets are actually reachable.
    cd {{app}}
    if [ "$t" = device ]; then
      exec npx react-native "run-$p" --no-packager --list-devices
    fi
    exec npx react-native "run-$p" --no-packager

# pod install for core-app — no-ops when Podfile.lock and Manifest.lock already agree
app-pods:
    #!/usr/bin/env bash
    set -euo pipefail
    if diff -q {{app}}/ios/Podfile.lock {{app}}/ios/Pods/Manifest.lock >/dev/null 2>&1; then
      echo "✓ Pods already in sync — nothing to do (force with: cd {{app}}/ios && pod install)"
      exit 0
    fi
    cd {{app}}/ios && pod install

# ============================== device TLS =============================

# Stage the mkcert root CA for AirDrop and print the two-step iPhone trust flow
app-ca:
    #!/usr/bin/env bash
    set -euo pipefail
    caroot=$(mkcert -CAROOT 2>/dev/null) || { echo "mkcert not installed — brew install mkcert" >&2; exit 1; }
    src="$caroot/rootCA.pem"
    [ -f "$src" ] || { echo "no rootCA.pem in $caroot — run: mkcert -install" >&2; exit 1; }
    dest="$HOME/Desktop/vritti-rootCA.crt"
    # .crt, not .pem: iOS will not offer to install a profile for a .pem attachment.
    cp "$src" "$dest"
    echo "✓ copied to $dest"
    echo
    echo "Certificate: $(openssl x509 -in "$src" -noout -subject | sed 's/^subject=//')"
    echo
    cat <<'EOF'
    AirDrop that file to the iPhone, then BOTH of these — the second is the one people miss:

      1. Settings > General > VPN & Device Management > install the downloaded profile
      2. Settings > General > About > Certificate Trust Settings > enable full trust for it

    Step 1 alone installs the CA but leaves it untrusted, and TLS still fails.
    The server cert covers local.vrittiai.com, *.local.vrittiai.com, localm.vrittiai.com and
    *.localm.vrittiai.com — the wildcards matter, because the app appends the org subdomain.
    EOF

# ================================ clean ================================

# Drop caches — metro | ios | pods | all; picker if omitted (confirms)
app-clean scope="":
    #!/usr/bin/env bash
    set -euo pipefail
    s="{{scope}}"; s="${s#scope=}"
    if [ -z "$s" ]; then
      echo "Select what to clean:" >&2; PS3="> "
      select s in metro ios pods all; do [ -n "$s" ] && break; done
    fi
    case "$s" in metro|ios|pods|all) ;; *) echo "app-clean: scope must be metro | ios | pods | all (got '$s')" >&2; exit 1;; esac
    read -r -p "Clean '$s'? [y/N] " ok
    [ "$ok" = y ] || [ "$ok" = Y ] || { echo "aborted (no changes)"; exit 0; }
    if [ "$s" = metro ] || [ "$s" = all ]; then
      echo "── metro / rspack ──"
      rm -rf {{app}}/build "${TMPDIR:-/tmp}"/metro-* "${TMPDIR:-/tmp}"/react-* 2>/dev/null || true
    fi
    if [ "$s" = ios ] || [ "$s" = all ]; then
      echo "── xcode ──"
      rm -rf {{app}}/ios/build ~/Library/Developer/Xcode/DerivedData/coreapp-* 2>/dev/null || true
    fi
    if [ "$s" = pods ] || [ "$s" = all ]; then
      echo "── pods (reinstalling) ──"
      rm -rf {{app}}/ios/Pods
      (cd {{app}}/ios && pod install)
    fi
    echo "✓ cleaned $s — Metro needs a restart with --reset-cache after a metro clean"
