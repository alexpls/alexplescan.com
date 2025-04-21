+++
date = '2025-04-21T00:00:00Z'
description = "Naming things is hard. Placeholder names shouldn't be. A couple of tips on how to do it right."
title = 'Placeholder names should be bad and unique'
tags = ['Practices']
+++

I use placeholder names often in my projects. They let me make fast upfront progress without needing to stop and think of the perfect name for something.

And since most of the things I experiment with end up getting abandoned after a few hours' work has revealed they're not worth pursuing, I'm often glad that I didn't spend too much time dwelling on their names.

So when it comes to assigning a placeholder name to something, can you just use whatever you want? Well, yeah - but I'd like to suggest a couple of tips:

## Use an awful name

This one helps to avoid "Temp Love", a term from the film industry where temporary soundtracks get used in the final cut because everyone's grown attached. The same thing can happen in code: give something a decent enough name and it might just sneak into production before you rethink it.

If you want to force yourself to revisit the name later, pick something so awful that you're *guaranteed* to reconsider it.

I was working on an exception aggregator recently, unsure of what to call it I went with the placeholder name "vomitbag". Perfect. Definitely changing that before shipping it to production.

## Use a name that's unique across your project

Eventually you'll need to do a sweeping find and replace to change out the temp name for the final one. That's much easier when the placeholder name only returns exact matches. If you use something too generic it turn up more hits in your project, which'll make what should be an easy bit of renaming much harder.

For example, if I'd called the exception aggregator "exceptions", a find and replace could've hit matches wherever I'd used the term "exception", and I would've needed to manually check each one.

<br>

So yeah... name it "vomitbag". Name it "trashcastle", or "goblinhole" if you have to. Just don't let a placeholder name make you fall in love with it!
