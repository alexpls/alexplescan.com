---
date: "2022-04-17T00:00:00Z"
description: A quick, zero-dependency way to manage private files in a git repository
title: The ".x" Files
---

<div class="callout">
  💁‍♂️ Here's a tip for a quick way to manage private files in a git repository, using nothing but your shell and git.
</div>

In the projects I work on I usually want to have some private files on my local machine that don't get committed and pushed up to git remotes (i.e. Github) to be seen by my teammates.

These are usually rough little scripts I use during development. For example, I might have this in the root of my repo:

```bash
echo "git stash && git checkout main && git pull && npm install && npm dev" > dev.sh
```

And then add it to the `.gitignore` :

```bash
echo "dev.sh" >> .gitignore
```

But there's friction here in a couple of places:

- I need to remember to add new scripts to the `.gitignore` each time
- I'm not being a great teammate by polluting the  `.gitignore` with files that are only relevant on _my_ machine


## Enter the ".x" Folder

To improve on that, I've started creating an `.x` folder in my repos' root and putting all my local-only files there.

I then configure git to ignore any paths matching `.x`  across all repos on my machine.

That means I can put my scripts - or other private files - in the repository's `.x` folder, and invoke them like this:

```bash
.x/dev.sh
```


## How-to, in detail...

### 1. Globally ignore ".x" folders from git

Create a `.gitignore` file in your home directory, and configure git to use it as the default "excludesfile" ([git docs](https://git-scm.com/docs/gitignore#_configuration)).

This will make git apply the exclusions in  `~/.gitignore` to all repos on your machine.

```bash
echo ".x" > ~/.gitignore
git config --global core.excludesfile ~/.gitignore
```

### 2. Add local-only files to your repos' ".x" folders

Add your scripts or anything else you don't want to commit to the project to the `.x` folder in your repo.

To implement the example that I gave at the top of this post you could do:

```bash
mkdir .x
echo "git stash && git checkout main && git pull && npm install && npm dev" > .x/dev.sh
chmod u+x .x/dev.sh
```

Scripts tend to be the bulk of what I store in my `.x` folders, but anything else you don't want to push up to git remotes can go in there as well.

---

All done! You can now add all kinds of private files to your `.x` folder without worrying about them accidentally being uploaded to your git remote!
