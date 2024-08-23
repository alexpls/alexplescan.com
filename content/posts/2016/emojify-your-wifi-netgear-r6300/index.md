---
date: "2016-08-16T00:00:00Z"
description: Adding emoji to the Wi-Fi SSID on a Netgear R6300 router.
title: Emojify your Wi-Fi (Netgear R6300 edition)
---

After reading Brian Jordan's post [Emojify your Wi-Fi](https://medium.com/@bcjordan/emojify-your-wi-fi-c01f4ac0b0ab#.w7pul5myi) where he adds emoji to his Wi-Fi SSID, <strike>I decided to blatantly rip him off</strike> I got inspired to do the same on my Netgear R6300 router.

Adding the emoji directly from the admin panel didn't work though, when I tried to I got this alert:

![Character not allowed alert dialog](not-allowed-alert.png)

Following in Brian's footsteps, I found the Javascript function which validates the characters in an SSID and overrode it to always return true. This was enough to get an emoji character accepted as part of the SSID!

To do this yourself you can follow these steps:

1. Go to your Netgear admin panel and craft your beautiful emoji-enriched SSID
![Wi-fi admin panel](admin-panel.png)
1. Open up the developer console
1. Override the validation function by typing in `window.checkData = function() { return true; }` (and then pressing Return)
![Dev console](dev-console.png)
1. Craft your beautiful emoji-enriched SSID
1. Save and enjoy your new SSID... you finally fit in with the neighbours
<br><br>
![New SSID updated](wifi-ssids.png)