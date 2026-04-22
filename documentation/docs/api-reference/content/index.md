---
title: Content Ports
sidebar_position: 5
description: Content script context port availability in @hexajs/ports.
---

# Content Ports

Content scripts communicate with the background service worker via [`RuntimePort`](../general/runtime-port.md) and receive targeted messages through [`TabsPort`](../background/tabs-port.md).

`@hexajs/ports` does not export dedicated content-context port classes. Direct browser API access from content scripts should be routed through background messaging.