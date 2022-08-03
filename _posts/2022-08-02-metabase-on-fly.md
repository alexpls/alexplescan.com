---
layout: post
title: "Deploying Metabase to Fly.io"
description: "Guide on how to deploy Metabase to Fly.io in minutes"
---

If you're reading this you probably already know what [Metabase][mb] and [Fly.io][fly] are.
This is guide on how to get the two working together in minutes.

[mb]: https://www.metabase.com/
[fly]: https://fly.io/

<img class="no-border" alt="Metabase screenshot" src="/assets/posts/metabase-on-fly/metabase-installed.png" srcset="/assets/posts/metabase-on-fly/metabase-installed.png 1x, /assets/posts/metabase-on-fly/metabase-installed@2x.png 2x">

1. Create your Fly app

   This'll be the app we'll configure to host your Metabase Docker image.

   ```bash
   # Choose your app's name here
   $ fly apps create my-metabase
   ```

2. Create a volume for the app

   By default Metabase will use the [H2 database engine](https://www.h2database.com/html/main.html) for a zero-config installation. This is where it stores all data for your installation (dashboards, questions you've created, configuration, etc).

   We want to make sure that any restarts of your app don't wipe all that stuff - so we'll create a persistent Fly volume to mount on the Docker container, and tell Metabase to store its H2 files on it.

   (While H2 is fine for small deployments it's recommended that you instead configure a standalone RDBS database as a more reliable store. You can read about how to do this [in Metabase's docs](https://www.metabase.com/docs/latest/operations-guide/running-metabase-on-docker.html#migrating-to-a-production-installation)).

   ```bash
   # App name must be the same from step 1 above
   # The size is denoted in gigabytes. You can start small and
   # use `fly extend` to increase its size later.
   $ fly volumes create --app my-metabase --size 1 metabase_data
   ```

   Fly will prompt you to select the region where your volume should live. Choose the one you're trying to deploy your application to (the closer this is geographically to the database you want to connect to Metabase, the better). When we get to deploying your app it'll automatically be placed in the same region as your volume.

3. Create the `fly.toml` config file

   If you haven't already, change to a directory you'd like to use to store config for this Fly app and put write this `fly.toml` file to it.

   The config declares that you want to deploy a Docker image, configures its mounts, exposes it to the internet, and sets up some healthchecks.

   For more info on `fly.toml` check out [Fly's reference](https://fly.io/docs/reference/configuration/).

   ```toml
   # Replace this with your app's name
   app = "my-metabase"

   kill_signal = "SIGTERM"
   kill_timeout = 5

   [build]
     # You might want to pin this version to a specific
     # tag in order to avoid surprising updates.
     image = "metabase/metabase:latest"

   # Mounts the Fly volume to the Metabase Docker image
   [mounts]
     source = "metabase_data"
     destination = "/metabase-data"

   [env]
     # Tells Metabse to store the H2 database on
     # the mounted volume.
     MB_DB_FILE = "/metabase-data/metabase.db"

   [[services]]
     internal_port = 3000
     processes = ["app"]
     protocol = "tcp"

     [[services.ports]]
       force_https = true
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443

     [[services.tcp_checks]]
       grace_period = "30s"
       interval = "15s"
       restart_limit = 0
       timeout = "2s"

     [[services.http_checks]]
       grace_period = "30s"
       interval = "15s"
       method = "get"
       path = "/api/health"
       protocol = "http"
       restart_limit = 3
   ```

4. Scale up memory

   Metabase runs on the JVM, and the JVM is hungry! I frequently saw out of memory (OOM) errors in logs when running with less than 1024MB.

   ```shell
   $ fly scale memory 1024
   ```

5. Deploy!

   Now that everything's configured let's push up the app! This will take longer the first time you do it as Metabase will need to initialise and run migrations on its database.

   ```bash
   $ fly deploy

   # And if you're curious you can follow your app's logs
   # in a separate terminal:
   $ fly logs
   ```

6. Done!

   Hooray - your deployment's done! Time to configure Metabase via its UI by opening your browser and visiting your new deployment:

   ```bash
   $ fly open
   ```

   <img class="no-border" alt="Metabase welcome screen" src="/assets/posts/metabase-on-fly/metabase-welcome.png" srcset="/assets/posts/metabase-on-fly/metabase-welcome.png 1x, /assets/posts/metabase-on-fly/metabase-welcome@2x.png 2x">

   Tip: If you're adding a datasource from within your Fly org, you can easily reference it by its internal network address: `[app-name].internal`.
