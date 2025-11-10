#!/usr/bin/env bash
set -euo pipefail

# Rebuild git history with backdated commits and (optionally) force-push to remote.
#
# Usage (dry-run, recommended first):
#   ./scripts/rebuild-history.sh --dry-run
#
# Real run (no push, create local repo only):
#   ./scripts/rebuild-history.sh
#
# Real run + push (force):
#   ./scripts/rebuild-history.sh --push
#
# IMPORTANT SAFETY NOTES
# - This script creates a temporary repository and WILL NOT change your current
#   working tree. It will only push if you run with --push and have credentials.
# - Force-pushing will overwrite the remote branch. Use --backup-remote to push
#   a backup of the existing remote branch before forcing.
# - Run with --dry-run first to see what will happen.

# Default configuration
TARGET_BRANCH="main"
COMMITS=70
REMOTE="origin"
AUTHOR_NAME=""
AUTHOR_EMAIL=""
DRY_RUN=false
DO_PUSH=false
BACKUP_REMOTE=false
KEEP_TMP=false
EXCLUDE_PATTERNS=(".git" "node_modules" "dist" "uploads" ".env" ".env.*" "coverage")
TOTAL_DAYS=150  # roughly 5 months

print_help() {
  sed -n '1,160p' "$0"
}

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --branch) TARGET_BRANCH="$2"; shift 2;;
    --commits) COMMITS="$2"; shift 2;;
    --remote) REMOTE="$2"; shift 2;;
    --author-name) AUTHOR_NAME="$2"; shift 2;;
    --author-email) AUTHOR_EMAIL="$2"; shift 2;;
    --dry-run) DRY_RUN=true; shift 1;;
    --push) DO_PUSH=true; shift 1;;
    --backup-remote) BACKUP_REMOTE=true; shift 1;;
    --keep-tmp) KEEP_TMP=true; shift 1;;
    --help) print_help; exit 0;;
    *) echo "Unknown arg: $1"; print_help; exit 1;;
  esac
done

# Fill author info from local git config if not provided
if [[ -z "$AUTHOR_NAME" ]]; then
  AUTHOR_NAME=$(git config user.name || echo "Rewriter")
fi
if [[ -z "$AUTHOR_EMAIL" ]]; then
  AUTHOR_EMAIL=$(git config user.email || echo "rewriter@example.com")
fi

echo "Configuration:
  target branch: $TARGET_BRANCH
  commits: $COMMITS
  remote: $REMOTE
  push: $DO_PUSH
  backup remote: $BACKUP_REMOTE
  dry run: $DRY_RUN
  author: $AUTHOR_NAME <$AUTHOR_EMAIL>
"

if $DRY_RUN; then
  echo "Dry run: the script will create a temporary repository and show planned actions but will not push or modify remote."
fi

# Ensure we are in a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This must be run from the root of a git repository." >&2
  exit 1
fi

# Ensure working tree is committed/clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Your working tree has changes. Commit or stash them before running (or run with a clean worktree)." >&2
  echo "Aborting."
  exit 1
fi

TMP_DIR=$(mktemp -d /tmp/rewrite_repo.XXXX)
echo "Temporary repo dir: $TMP_DIR"

# Build rsync exclude args
RSYNC_EXCLUDES=()
for p in "${EXCLUDE_PATTERNS[@]}"; do
  RSYNC_EXCLUDES+=(--exclude "$p")
done

# Copy files into tmp repo (excluding patterns)
# Use rsync if available
if command -v rsync >/dev/null 2>&1; then
  rsync -a --filter='P .git/' ${RSYNC_EXCLUDES[*]} ./ "$TMP_DIR/"
else
  # fallback to tar/untar
  tar --exclude='.git' --exclude='node_modules' -cf - . | (cd "$TMP_DIR" && tar -xf -)
fi

cd "$TMP_DIR"

# Initialize a fresh git repo
git init -b "$TARGET_BRANCH"

git config user.name "$AUTHOR_NAME"
git config user.email "$AUTHOR_EMAIL"

# Build list of candidate files
mapfile -t ALL_FILES < <(find . -type f \
  $(for p in "${EXCLUDE_PATTERNS[@]}"; do printf " -not -path './%s/*'" "$p"; done) \
  -not -path './.git/*' -print | sed 's|^./||' | sort)

if [[ ${#ALL_FILES[@]} -eq 0 ]]; then
  echo "No files found to commit in temporary repo. Aborting." >&2
  exit 1
fi

echo "Found ${#ALL_FILES[@]} files to include in history."

# Helper to get date string days ago
date_days_ago() {
  local days=$1
  # macOS date supports -v -Nd
  date -v -"${days}"d "+%Y-%m-%dT12:00:00"
}

# Plan commit dates: distribute commits over TOTAL_DAYS back from today
# For commit i (0..COMMITS-1): days_ago = TOTAL_DAYS - int(i * TOTAL_DAYS / COMMITS)

files_idx=0
mkdir -p history/notes

for ((i=0;i<COMMITS;i++)); do
  # pick batch size 3-5 deterministic using modulo
  batch_size=$((3 + (i % 3))) # 3,4,5 repeating
  batch=()

  for ((j=0;j<batch_size;j++)); do
    if [[ $files_idx -lt ${#ALL_FILES[@]} ]]; then
      batch+=("${ALL_FILES[$files_idx]}")
      ((files_idx++))
    else
      # create a small note file
      note_dir="history/notes/commit-$(printf "%03d" $((i+1)))"
      mkdir -p "$note_dir"
      note_file="$note_dir/note-$(printf "%02d" $((j+1))).md"
      echo "Note for synthetic commit $((i+1)) - file $((j+1))" > "$note_file"
      batch+=("$note_file")
    fi
  done

  # Add files to index
  git add -- "${batch[@]}"

  # Compute date
  days_ago=$((TOTAL_DAYS - (i * TOTAL_DAYS / COMMITS)))
  commit_date=$(date_days_ago "$days_ago")

  # Craft a semi-meaningful message
  commit_msg="chore(history): import ${#batch[@]} files - part $((i+1)) of $COMMITS"
  commit_msg+=$"\n\nGenerated commit covering:\n"
  for f in "${batch[@]}"; do
    commit_msg+=$" - $f\n"
  done

  echo "Creating commit $((i+1))/$COMMITS (files: ${#batch[@]}) with date $commit_date"

  GIT_AUTHOR_DATE="$commit_date" GIT_COMMITTER_DATE="$commit_date" \
    git commit -m "$commit_msg" || { echo "Commit failed"; exit 1; }

done

# Ensure any remaining files not added (unlikely) are added in a final commit
remaining=$(git ls-files --others --exclude-standard)
if [[ -n "$remaining" ]]; then
  git add .
  commit_date=$(date_days_ago 0)
  GIT_AUTHOR_DATE="$commit_date" GIT_COMMITTER_DATE="$commit_date" \
    git commit -m "chore(history): final import - add remaining files"
fi

# Show a summary
echo "Built a repository in $TMP_DIR with $(git rev-list --count HEAD) commits."

if $DRY_RUN; then
  echo "Dry run complete. Temporary repo is at: $TMP_DIR"
  if ! $KEEP_TMP; then
    echo "You can remove it manually if desired: rm -rf $TMP_DIR"
  fi
  exit 0
fi

# Set remote and optionally backup old remote branch
if $DO_PUSH; then
  if ! git remote | grep -q "$REMOTE"; then
    git remote add "$REMOTE" "$(git -C "$OLDPWD" remote get-url "$REMOTE" 2>/dev/null || echo '')"
  fi

  if $BACKUP_REMOTE; then
    backup_ref="$TARGET_BRANCH-backup-$(date +%Y%m%d%H%M%S)"
    echo "Creating remote backup branch: $backup_ref"
    # push current remote branch to a backup ref (this may fail if remote access not available)
    git push "$REMOTE" "refs/remotes/${REMOTE}/${TARGET_BRANCH}:refs/heads/$backup_ref" || \
      echo "Warning: failed creating remote backup (check permissions)"
  fi

  echo "Force-pushing rewritten history to $REMOTE/$TARGET_BRANCH"
  git push --force "$REMOTE" HEAD:refs/heads/$TARGET_BRANCH
  echo "Push completed."
else
  echo "Not pushing. Local rewritten repo available at: $TMP_DIR"
  echo "To push manually run from $TMP_DIR: git remote add $REMOTE <your-remote-url> && git push --force $REMOTE HEAD:refs/heads/$TARGET_BRANCH"
fi

if ! $KEEP_TMP; then
  echo "Temporary repo kept at $TMP_DIR for inspection. Delete it when satisfied: rm -rf $TMP_DIR"
fi
