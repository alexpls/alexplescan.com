---
layout: post
title: Development environment config overrides in Jekyll
description: How to use a separate config for running Jekyll in development and production environments.
---

While building this website using Jekyll I found that there were a few places where
I needed to override config variables when the site is running in a development
environment. Some examples of dev only overrides I wanted to do are:

- Skip minifying the SASS output so it's easily debuggable
- Show all draft posts by default
- Run the server on port 4000, accepting all incoming connections

The best way I found to do this was by having two config files; a base config
used in production (`_config.yml`), and an override config used only in
development (`_config_dev.yml`):

{% highlight yaml %}
# _config.yml - Base config used in production

sass:
  style: compressed

show_drafts: false
{% endhighlight %}

{% highlight yaml %}
# _config_dev.yml - Dev environment configs and overrides

show_drafts: true

# Accepts connections on port 4000 from any source
host: 0.0.0.0
port: 4000

# Don't compress SASS output
sass:
  style: full
{% endhighlight %}

As you can see, any dev-specific config options just need to go into the
`_config_dev.yml` file. This can be a Jekyll option you need to override,
or an option for any of your Jekyll plugins.

To launch the Jekyll server in a dev environment I then run the following command
- note that `_config_dev.yml` must be specified last so that
its config items override `_config.yml`.

{% highlight bash %}
$ jekyll serve --config "_config.yml,_config_dev.yml"
{% endhighlight %}

This command will first load in the normal config, and then the dev
only overrides. To make this even easier to launch I put the command
under a `script/dev` file so I can launch it without having to type
out the names of both the config files. You can see an example of this in my
[repo for this website](https://github.com/alexpls/alexpls.github.io/blob/master/script/dev).

Since I'm deploying this using GitHub pages I didn't need to do anything extra to
have this working in production. GitHub pages compiles Jekyll using the `_config.yml`
file by default and ignores all other config files, but if your deployment is slightly
different all you'd need to do is exclude the `_config_dev.yml` from the `jekyll build`
command when doing your Jekyll build, and you should be good to go!
