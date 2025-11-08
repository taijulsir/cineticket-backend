Rebuild history script

This folder contains a script to build a new git repository in a temporary directory using the current workspace files and a sequence of backdated commits.

Why use it
- You wanted to replace the remote repo with the current code and present a series of historical commits (60–80) backdated over ~5 months.
- The script avoids modifying your working tree and prepares a new repository that can be force-pushed to the remote.

How it works (summary)
1. Copies the current workspace (excluding .git, node_modules, dist, uploads, .env*) into a temp directory.
2. Initializes a git repository there, sets user.name/email (from local git config by default).
3. Commits files in batches of 3–5 files, creating a total of N commits (default 70).
4. If files are exhausted before the commit count, the script creates small note files to reach the target count.
5. Each commit is backdated using GIT_AUTHOR_DATE and GIT_COMMITTER_DATE spread across ~150 days (5 months).
6. Optionally, the script can force-push the new history to your remote branch (requires network access and credentials).

Safety & recommendations
- Run with --dry-run first to create the temp repo and inspect it without pushing.
- Review the temporary repo: the script prints its path.
- Keep a remote backup if you need the old remote branch preserved (use --backup-remote).
- Force-pushing will rewrite history; collaborators must re-clone or reset local branches.

Examples
- Dry run (recommended):
  ./scripts/rebuild-history.sh --dry-run

- Create local rewritten repo and inspect:
  ./scripts/rebuild-history.sh

- Create local repo and push to remote (force):
  ./scripts/rebuild-history.sh --push --backup-remote

Notes
- The script tries to avoid committing ignored/unnecessary files by copying only a filtered set of files into the temp repo.
- You can adjust the commit count and target branch via --commits and --branch.
