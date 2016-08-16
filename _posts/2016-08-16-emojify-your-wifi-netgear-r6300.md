---
layout: post
title: Emojify your Wi-Fi (Netgear R6300 edition)
description: Adding emoji to the Wi-Fi SSID on a Netgear R6300 router.
---

After reading Brian Jordan's post [Emojify your Wi-Fi](https://medium.com/@bcjordan/emojify-your-wi-fi-c01f4ac0b0ab#.w7pul5myi) where he adds emoji to his Wi-Fi SSID, <strike>I decided to blatantly rip him off</strike> I got inspired to do the same on my Netgear R6300 router.

Adding the emoji directly from the admin panel didn't work though, when I tried to I got this alert:

<img alt="Character not allowed alert dialog" class="no-border" src="/assets/posts/emojify_wifi/not-allowed-alert@2x.png" srcset="/assets/posts/emojify_wifi/not-allowed-alert.png 1x, /assets/posts/emojify_wifi/not-allowed-alert@2x.png 2x">

Following in Brian's footsteps, I found the Javascript function which validates the characters in an SSID and overrode it to always return true. This was enough to get an emoji character accepted as part of the SSID!

To do this yourself you can follow these steps:

1. Go to your Netgear admin panel and craft your beautiful emoji-enriched SSID
<img alt="Wi-Fi admin panel" class="no-border" src="/assets/posts/emojify_wifi/admin-panel@2x.png" srcset="/assets/posts/emojify_wifi/admin-panel.png 1x, /assets/posts/emojify_wifi/admin-panel@2x.png 2x">
1. Open up the developer console
1. Override the validation function by typing in `window.checkData = function() { return true; }` (and then pressing Return)
<img alt="Dev console" class="no-border" src="/assets/posts/emojify_wifi/dev-console@2x.png" srcset="/assets/posts/emojify_wifi/dev-console.png 1x, /assets/posts/emojify_wifi/dev-console@2x.png 2x">
1. Craft your beautiful emoji-enriched SSID
1. Save and enjoy your new SSID... you finally fit in with the neighbours
<br><br>
<img alt="New SSID updated" src="/assets/posts/emojify_wifi/wifi-ssids@2x.png" srcset="/assets/posts/emojify_wifi/wifi-ssids.png 1x, /assets/posts/emojify_wifi/wifi-ssids@2x.png 2x">
