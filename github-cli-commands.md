# Common GitHub CLI Commands

## Authentication and configuration

```sh
gh auth login
gh auth status
gh auth logout
gh config set editor vim
```

## Repositories

```sh
gh repo create my-repo --public --clone
gh repo clone OWNER/REPOSITORY
gh repo view
gh repo view OWNER/REPOSITORY --web
gh repo fork OWNER/REPOSITORY --clone
```

## Pull requests

```sh
gh pr create --fill
gh pr list
gh pr view 123
gh pr view 123 --web
gh pr checkout 123
gh pr diff 123
gh pr review 123 --approve
gh pr review 123 --request-changes --body "Please address the comments."
gh pr merge 123 --squash --delete-branch
```

## Issues

```sh
gh issue create --title "Bug report" --body "Description of the problem"
gh issue list
gh issue view 123
gh issue view 123 --web
gh issue edit 123 --add-label bug
gh issue close 123
gh issue comment 123 --body "I am working on this."
```

## Releases

```sh
gh release create v1.0.0 --generate-notes
gh release list
gh release view v1.0.0
gh release download v1.0.0
gh release delete v1.0.0
```

## GitHub Actions

```sh
gh workflow list
gh workflow run build.yml
gh run list
gh run view RUN_ID
gh run watch RUN_ID
gh run rerun RUN_ID --failed
```

## Gists and API requests

```sh
gh gist create file.txt --public
gh gist list
gh gist view GIST_ID
gh api user
gh api repos/OWNER/REPOSITORY
```

Use `gh <command> --help` to view the full documentation for any command.
