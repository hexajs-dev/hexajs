---
title: API Reference
sidebar_position: 1
description: Complete built-in ports reference grouped by context.
---

import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# API Reference

This section documents all built-in services exported by `@hexajs-dev/ports`.

## Context groups

<ApiReferenceAppendix title="General Context Ports">
- [RuntimePort](./general/runtime-port.md)
- [I18nPort](./general/i18n-port.md)
- [ExtensionPort](./general/extension-port.md)
</ApiReferenceAppendix>

<ApiReferenceAppendix title="Background Context Ports">
- [ActionPort](./background/action-port.md)
- [AlarmsPort](./background/alarms-port.md)
- [BookmarksPort](./background/bookmarks-port.md)
- [BrowserActionPort](./background/browser-action-port.md)
- [BrowsingDataPort](./background/browsing-data-port.md)
- [CommandsPort](./background/commands-port.md)
- [CookiesPort](./background/cookies-port.md)
- [DeclarativeNetRequestPort](./background/declarative-net-request-port.md)
- [DownloadsPort](./background/downloads-port.md)
- [HistoryPort](./background/history-port.md)
- [IdentityPort](./background/identity-port.md)
- [IdlePort](./background/idle-port.md)
- [ManagementPort](./background/management-port.md)
- [MenusPort](./background/menus-port.md)
- [NotificationsPort](./background/notifications-port.md)
- [PageActionPort](./background/page-action-port.md)
- [PermissionsPort](./background/permissions-port.md)
- [ScriptingPort](./background/scripting-port.md)
- [StoragePort](./background/storage-port.md)
- [TabGroupsPort](./background/tab-groups-port.md)
- [TabsPort](./background/tabs-port.md)
- [UserScriptsPort](./background/user-scripts-port.md)
- [WebNavigationPort](./background/web-navigation-port.md)
- [WebRequestPort](./background/web-request-port.md)
</ApiReferenceAppendix>

<ApiReferenceAppendix title="UI Context Ports">
- [DevtoolsPort](./ui/devtools-port.md)
</ApiReferenceAppendix>

<ApiReferenceAppendix title="Content Context Ports">
- Content context currently exports no built-in ports.
</ApiReferenceAppendix>

## Notes

- Deprecated ports are clearly marked in their pages.
- For architecture and routing patterns, see [Browser-Agnostic](../browser-agnostic-messaging/index.md).