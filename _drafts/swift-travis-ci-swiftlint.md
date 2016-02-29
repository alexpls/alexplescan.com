---
layout: post
title: Swift continuous integration with Travis CI and SwiftLint
---


##### Setting up Travis CI

###### Enable shared schemes in XCode

Before you get started, make sure to enable shared schemes in XCode. This will let
`xctool` run your tests via the command line.

![enable shared schemes in XCode](http://placehold.it/600x200)

###### Create the Travis CI config file

The Travis CI config file `.travis.yml` sits in your repository's root and lets
you configure how you want your Travis CI to run.

{% highlight yaml linenos %}
language: objective-c
osx_image: xcode7.2

script:
  - xctool test -project APSwiftHelpers.xcodeproj -scheme APSwiftHelpers -sdk iphonesimulator
{% endhighlight %}

The `language` parameter tells Travis CI what language the
project is written in. At the time of writing this Swift isn't explicitly listed
as a supported language on the Travis CI site, but setting `objective-c` as the
language works fine even for Swift code.

The `osx_image` parameter should be configured to match the version of XCode
running on your local machine. In my case this was `xcode7.2`. For a full list of
supported XCode versions [see the Travis CI documentation here](https://docs.travis-ci.com/user/languages/objective-c#Supported-OS-X-iOS-SDK-versions).

Finally the `script` parameter is where you define the scripts that will run
as part of the CI build. As long as these scripts return with a status of `0`,
the build is happy however as soon as something returns another status the build
will fail. As far as we're concerned `xctool` will return `0` when your tests run
successfully and `1` when they fail, so this isn't an issue, however it may be an
important point to bear in mind if you end up writing adding your own scripts to
for the build to run.

###### Push and pray

You can now do a `git push` to Github, and within seconds you should see your
new build appear in the Travis CI dashboard. In my experience it can take about two minutes for
a build to start running (though at times it's taken as long as ten minutes), after
which your build should complete pretty quickly depending on how many tests you have.

When your build finishes running it should hopefully be successful, if not
check the build log for any information about why it may have failed.

##### Time for SwiftLint

[SwiftLint](https://github.com/realm/SwiftLint) is a great tool which helps enforce
code quality constraints in your source code. Although you can use it locally as you
build your code in XCode, I find that having it as part of the Travis CI build process
makes me take it even more seriously. After all if SwiftLint fails during the CI
build the whole build is marked as bad.

###### Install SwiftLint locally

SwiftLint is available through Homebrew by simple `brew install swiftlint`, however
at the time of writing the Homebrew version is outdated compared to the latest
release on Github, so I would recommend grabbing the latest SwiftLint .pkg file
[from Github](https://github.com/realm/SwiftLint/releases) and installing it manually.

Once you've done this you should be able to verify that SwiftLint works by opening
your terminal, `cd`-ing to your repo's root directory and running `$ swiftlint`.

This scans your source code and suggests places where it can be improved, once
the scan is complete you'll see something like this:

{% highlight bash linenos %}
Linting Swift files in current working directory
Linting 'App.swift' (1/15)
Linting 'CATransaction+Helpers.swift' (2/15)
Linting 'DebugLogging.swift' (3/15)
/Users/alex/Dropbox/Work/Soonlist/Source/app/APSwiftHelpers/APSwiftHelpers/DebugLogging.swift:28: warning: Length Violation: Line should be 100 characters or less: currently 106 characters
Linting 'Dispatch.swift' (4/15)
Linting 'NSCoding+Helpers.swift' (5/15)
Linting 'NSLocale+Helpers.swift' (6/15)
Linting 'AppTests.swift' (7/15)
Linting 'CATransaction+HelpersTests.swift' (8/15)
/Users/alex/Dropbox/Work/Soonlist/Source/app/APSwiftHelpers/APSwiftHelpersTests/CATransaction+HelpersTests.swift:16:78: error: Force Cast Violation: Force casts should be avoided
/Users/alex/Dropbox/Work/Soonlist/Source/app/APSwiftHelpers/APSwiftHelpersTests/CATransaction+HelpersTests.swift:24:78: error: Force Cast Violation: Force casts should be avoided
/Users/alex/Dropbox/Work/Soonlist/Source/app/APSwiftHelpers/APSwiftHelpersTests/CATransaction+HelpersTests.swift:32:78: error: Force Cast Violation: Force casts should be avoided
Linting 'DebugLoggingTests.swift' (9/15)
Linting 'DispatchTests.swift' (10/15)
Linting 'Note.swift' (11/15)
Linting 'NSCoding+HelpersTests.swift' (12/15)
Linting 'NSLocale+HelpersTests.swift' (13/15)
Linting 'PlistStub.swift' (14/15)
Linting 'Printable.swift' (15/15)
Done linting! Found 4 violations, 3 serious in 15 files.
{% endhighlight %}

This command line output is good, but what's better is getting these hints inline
in XCode. To do this you can add a new "Run Script Phase" to your XCode build process
with the following:

{% highlight bash linenos %}
if which swiftlint >/dev/null; then
  swiftlint
else
  echo "warning: SwiftLint not installed, download from https://github.com/realm/SwiftLint"
fi
{% endhighlight %}

Then next time you build your code you should see your lint hints inline in XCode
like this:
![lint hints](http://placehold.it/600x200)

Go ahead and do what the hints suggest, however you don't have to take their
advise as gospel. If you want to ignore a particular hint SwiftLint gives you several
ways of doing this, [outlined here](https://github.com/realm/swiftlint#disable-a-rule-in-code).

###### Setting up SwiftLint on Travis CI

Now that your code has been de-linted locally, it's time to add the SwiftLint to Travis CI
so your code rules are enforced for future additions to your code too.

Let's go back to the `.travis.yml` config file and update it to call SwiftLint:

{% highlight yaml linenos %}
language: objective-c
osx_image: xcode7.2

install:
  - ./install_swiftlint.sh

script:
  - swiftlint
  - xctool test -project APSwiftHelpers.xcodeproj -scheme APSwiftHelpers -sdk iphonesimulator
{% endhighlight %}

You can see the `script` parameter has a new `swiftlint` call added to it, and a new
`install` parameter has been added with a call to the shell script `install_swiftlint.sh`.
Travis CI allows calling of bash scripts like this, and I recommend moving off the installation
procedure to SwiftLint to an external file so as to keep the main Travis config lightweight.

I tried several approaches to installing SwiftLint during a Travis CI build:

{% highlight bash linenos %}
# Approach 1: Installing via Homebrew
# TODO update with how long it took in Travis CI build
$ brew update && brew install swiftlint

# Approach 2: Compiling from source
# TODO update with how long it took in Travis CI build
$ git clone https://github.com/realm/SwiftLint.git /tmp/SwiftLint &&
  cd /tmp/SwiftLint &&
  git submodule update --init --recursive &&
  sudo make install

# Approach 3: Installing from precompiled .pkg file
# TODO update with how long it took in Travis CI build
$ wget --output-document /tmp/SwiftLint.pkg https://github.com/realm/SwiftLint/releases/download/0.9.1/SwiftLint.pkg &&
  sudo installer -pkg /tmp/SwiftLint.pkg -target /
{% endhighlight %}

Of these approaches the downloading and installing the precompiled pkg file was the
fastest by far, so in the end that's the main installation method I used. The
`install_swiftlint.sh` file looks like this:

{% highlight bash linenos %}
#!/bin/bash

# Installs the SwiftLint package.
# Tries to get the precompiled .pkg file from Github, but if that
# fails just recompiles from source.

set -e

SWIFTLINT_PKG_PATH="/tmp/SwiftLint.pkg"

wget --output-document=$SWIFTLINT_PKG_PATH https://github.com/realm/SwiftLint/releases/download/0.9.1/SwiftLint.pkg

if [ -f $SWIFTLINT_PKG_PATH ]; then
  echo "SwiftLint package exists! Installing it..."
  sudo installer -pkg $SWIFTLINT_PKG_PATH -target /
else
  echo "SwiftLint package doesn't exist. Compiling from source..." &&
  git clone https://github.com/realm/SwiftLint.git /tmp/SwiftLint &&
  cd /tmp/SwiftLint &&
  git submodule update --init --recursive &&
  sudo make install
fi
{% endhighlight %}

###### Push and Pray (part 2)
Now that you've got your SwitLint config set up for Travis CI, it's time to commit and
push again. Same as before, the new Travis CI build should appear immediately, but
may take a few minutes to start up. If all goes well it should exit successfully with
a `0` status.

##### More reading...
- Travis CI Obj-C guide (applies well to Swift)
- SwitLint package page (has great info on how to set up SwiftLint)
