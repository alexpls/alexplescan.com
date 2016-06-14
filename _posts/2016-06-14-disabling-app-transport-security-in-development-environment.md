---
layout: post
title: "Disabling App Transport Security in your development environment"
description: "How to disable App Transport Security in order to make unsecured HTTP requests in a local development environment"
---

iOS 9 introduced [App Transport Security](https://developer.apple.com/library/ios/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html#//apple_ref/doc/uid/TP40009251-SW33), which by default forces apps to communicate over HTTPS instead of HTTP. This is a great default for production apps, but it can get in the way of connecting to development servers which are less likely to be configured with a HTTPS connection, especially when running on your local machine.

To get around this an exception can be added for `localhost` (or any other known development environment domain) which will allow your app to send and receive unencrypted HTTP requests. In your `Info.plist` add the following:

```
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSExceptionDomains</key>
  <dict>
    <key>localhost</key>
    <dict>
      <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
      <true/>
      <key>NSIncludesSubdomains</key>
      <true/>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <true/>
    </dict>
  </dict>
</dict>
```

If you're editing your `Info.plist` visually in XCode, you should have these entries:

<img alt="App Transport Security info.plist screenshot" src="/assets/posts/app_transport_security/app_transport_security_info_plist.png" srcset="/assets/posts/app_transport_security/app_transport_security_info_plist.png 1x, /assets/posts/app_transport_security/app_transport_security_info_plist@2x.png 2x">
