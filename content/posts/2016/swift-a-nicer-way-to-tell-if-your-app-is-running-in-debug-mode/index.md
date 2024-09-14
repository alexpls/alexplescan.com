+++
date = '2016-05-03T00:00:00Z'
description = "Use Swift's built in _isDebugAssertConfiguration() function to determine at runtime whether your app is running in Debug or Release mode."
title = 'Swift: A nicer way to tell if your app is running in Debug mode'
tags = ['ios']
+++

Often while working on an iOS app there's functionality that you want exposed only when the app is running in a Debug build configuration. Previously I would use build environment variables and preprocessor macros to determine this, but thanks to the great answer on [this Stack Overflow question](http://stackoverflow.com/a/34532569/1432982) I now use a runtime check to tell whether the app is running in Debug or Release mode:

```swift
// Returns true if the app is running in a Debug build
_isDebugAssertConfiguration() -> Bool

// Returns true if the app is running in a Release build
_isReleaseAssertConfiguration() -> Bool

// Example usage: only printing to the log when the app is running in Debug
if _isDebugAssertConfiguration() {
  print("Log: User \(user) logged in")
}
```

Note: these functions aren't publicly documented in Swift's API, and are only available from Swift 2.1 onwards. As kennytm says in his Stack Overflow answer, there is a risk of this function being removed in a future update.

If you do want to use this in your codebase, I have created a convenient helper around the function in my Swift helper library: [APSwiftHelpers](https://github.com/alexpls/APSwiftHelpers).
