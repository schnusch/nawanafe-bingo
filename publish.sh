#!/usr/bin/env bash
set -euo pipefail

empty_index() {
	git read-tree --empty
}

add_to_index() {
	git update-index --add --cacheinfo "100644,$(git hash-object -w "$2"),$1"
}

tmp=$(mktemp -d)
trap 'git worktree remove -f "$tmp" || rm -fr "$tmp"' EXIT
git worktree add "$tmp" HEAD

(
	cd "$tmp"
	make TSC=true ESFLAGS='--minify' SASSFLAGS='--style compressed'
	empty_index
	add_to_index index.html build/index.xhtml
	add_to_index script.js  build/script.js
	add_to_index style.css  build/style.css
	tree=$(git write-tree)
	commit=$(git commit-tree -p HEAD -m 'publish to gh-pages' "$tree")
	git ls-tree "$commit"
	git push -f origin "${commit}:gh-pages"
)
