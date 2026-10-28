#!/bin/sh
set -e
cd "$(dirname "$0")"
N=$(grep -n '^</style>' shell.html | head -1 | cut -d: -f1)
{
  cat web_head.html
  head -n "$N" shell.html
  printf '</head>\n<body>\n'
  tail -n +"$((N+1))" shell.html
  cat web_start.html
  printf '\n<script>\n'
  sed '/^if (typeof module/d' gen.js
  cat data.js rules.js injuries.js core.js audio.js
  sed '/^if (typeof module/d' mp4wrap.js
  cat dice3d.js map.js fx.js actions.js net.js roles.js save.js music.js
  sed '/^boot();$/d' ui.js
  cat fb.js
  printf '\n</script>\n</body>\n</html>\n'
} > ../index.html
[ -f ../firebase-config.js ] || cp firebase-config.example.js ../firebase-config.js
