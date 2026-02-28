#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_name="${PROJECT_NAME:-$(basename "$root_dir")}"
out_dir="$root_dir/output"
bin_src="$root_dir/build/router"
env_template="$root_dir/.env.template"
starter_src="$root_dir/scripts/starter.sh"
remote_name="${PACKAGE_REMOTE:-origin}"
tag_arg="${1:-}"

usage() {
  echo "Usage: $(basename "$0") [v<major>.<minor>.<patch>]" >&2
}

is_semver_tag() {
  [[ "$1" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

extract_max_tag() {
  git -C "$root_dir" tag -l 'v[0-9]*.[0-9]*.[0-9]*' | sort -V | tail -n 1
}

increment_patch_tag() {
  local tag="$1"
  local major minor patch
  major="${tag#v}"
  major="${major%%.*}"
  minor="${tag#v${major}.}"
  minor="${minor%%.*}"
  patch="${tag##*.}"
  echo "v${major}.${minor}.$((patch + 1))"
}

resolve_web_build_dir() {
  if [[ -d "$root_dir/web/build" ]]; then
    echo "$root_dir/web/build"
    return 0
  fi
  if [[ -d "$root_dir/web/dist" ]]; then
    echo "$root_dir/web/dist"
    return 0
  fi
  return 1
}

verify_artifacts() {
  local web_build_dir="$1"
  if [[ ! -x "$bin_src" ]]; then
    echo "Missing binary: $bin_src" >&2
    echo "Build first: mkdir -p build && go build -o build/router ./cmd/router" >&2
    exit 1
  fi
  if [[ ! -d "$web_build_dir" ]]; then
    echo "Missing frontend build: $web_build_dir" >&2
    echo "Build first: npm run build --prefix web" >&2
    exit 1
  fi
  if [[ ! -f "$env_template" ]]; then
    echo "Missing config template: $env_template" >&2
    exit 1
  fi
  if [[ ! -f "$starter_src" ]]; then
    echo "Missing starter script: $starter_src" >&2
    exit 1
  fi
}

original_ref="$(git -C "$root_dir" symbolic-ref --quiet --short HEAD || true)"
if [[ -z "$original_ref" ]]; then
  original_ref="$(git -C "$root_dir" rev-parse --short=12 HEAD)"
fi
switched_ref=0

restore_ref() {
  if [[ "$switched_ref" -eq 1 ]]; then
    git -C "$root_dir" checkout -q "$original_ref"
  fi
}
trap restore_ref EXIT

target_tag=""

if [[ -n "$tag_arg" ]]; then
  if ! is_semver_tag "$tag_arg"; then
    usage
    exit 1
  fi
  if ! git -C "$root_dir" rev-parse -q --verify "refs/tags/$tag_arg" >/dev/null; then
    echo "Tag not found, skip package: $tag_arg"
    exit 0
  fi
  target_tag="$tag_arg"
  current_head="$(git -C "$root_dir" rev-parse HEAD)"
  tag_head="$(git -C "$root_dir" rev-list -n 1 "$target_tag")"
  if [[ "$current_head" != "$tag_head" ]]; then
    git -C "$root_dir" checkout -q "$target_tag"
    switched_ref=1
  fi
else
  if ! git -C "$root_dir" rev-parse -q --verify refs/heads/main >/dev/null; then
    echo "Missing local branch: main" >&2
    exit 1
  fi

  max_tag="$(extract_max_tag)"
  main_hash_full="$(git -C "$root_dir" rev-parse main)"
  max_tag_hash_full=""
  if [[ -n "$max_tag" ]]; then
    max_tag_hash_full="$(git -C "$root_dir" rev-list -n 1 "$max_tag")"
  fi

  if [[ -n "$max_tag_hash_full" && "$max_tag_hash_full" == "$main_hash_full" ]]; then
    echo "Latest tag $max_tag already matches main HEAD, skip package."
    exit 0
  fi

  if [[ -z "$max_tag" ]]; then
    target_tag="v0.0.1"
  else
    target_tag="$(increment_patch_tag "$max_tag")"
  fi

  if git -C "$root_dir" rev-parse -q --verify "refs/tags/$target_tag" >/dev/null; then
    echo "Tag already exists, refuse to overwrite: $target_tag" >&2
    exit 1
  fi

  if ! git -C "$root_dir" remote get-url "$remote_name" >/dev/null 2>&1; then
    echo "Remote not found: $remote_name" >&2
    exit 1
  fi

  git -C "$root_dir" tag "$target_tag" "$main_hash_full"
  if ! git -C "$root_dir" push "$remote_name" "$target_tag"; then
    git -C "$root_dir" tag -d "$target_tag" >/dev/null 2>&1 || true
    echo "Failed to push tag to remote: $target_tag" >&2
    exit 1
  fi

  current_head="$(git -C "$root_dir" rev-parse HEAD)"
  if [[ "$current_head" != "$main_hash_full" ]]; then
    git -C "$root_dir" checkout -q "$target_tag"
    switched_ref=1
  fi
fi

target_hash="$(git -C "$root_dir" rev-parse --short=7 HEAD)"
pkg_name="${project_name}-${target_tag}-${target_hash}"
stage_dir="$out_dir/$pkg_name"
archive_path="$out_dir/${pkg_name}.tar.gz"

web_build_dir="$(resolve_web_build_dir || true)"
if [[ -z "$web_build_dir" ]]; then
  echo "Missing frontend build: $root_dir/web/build or $root_dir/web/dist" >&2
  echo "Build first: npm run build --prefix web" >&2
  exit 1
fi

verify_artifacts "$web_build_dir"

mkdir -p "$out_dir"
rm -rf "$stage_dir"
mkdir -p "$stage_dir/build" "$stage_dir/scripts" "$stage_dir/web"

cp "$bin_src" "$stage_dir/build/"
cp "$env_template" "$stage_dir/"
cp "$starter_src" "$stage_dir/scripts/"
cp -R "$web_build_dir" "$stage_dir/web/"

rm -f "$archive_path"
tar -czf "$archive_path" -C "$out_dir" "$pkg_name"

if [[ "${KEEP_STAGE:-0}" != "1" ]]; then
  rm -rf "$stage_dir"
fi

echo "Package created: $archive_path"
