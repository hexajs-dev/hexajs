---
title: Background Ports
sidebar_position: 3
description: Full background context API surface provided by @hexajs-dev/ports.
---

# Background Ports

Background ports expose privileged browser APIs that are only available in the extension's service worker or background page context.

## Included Ports

| Port | Description |
|---|---|
| [ActionPort](./action-port.md) | Toolbar button badge, icon, and popup control |
| [AlarmsPort](./alarms-port.md) | Periodic and one-time background alarm scheduling |
| [BookmarksPort](./bookmarks-port.md) | Bookmark tree read, write, search, and delete |
| [BrowsingDataPort](./browsing-data-port.md) | Cache, cookie, and history clearing |
| [CommandsPort](./commands-port.md) | Keyboard shortcut registration and events |
| [CookiesPort](./cookies-port.md) | Full cookie lifecycle management |
| [DeclarativeNetRequestPort](./declarative-net-request-port.md) | MV3-native dynamic network interception rules |
| [DownloadsPort](./downloads-port.md) | File download initiation and queue management |
| [HistoryPort](./history-port.md) | Browser history search, addition, and deletion |
| [IdentityPort](./identity-port.md) | OAuth 2.0 flows and signed-in user profile |
| [IdlePort](./idle-port.md) | System idle state monitoring |
| [ManagementPort](./management-port.md) | Installed extension introspection and lifecycle |
| [MenusPort](./menus-port.md) | Context menu item creation and events |
| [NotificationsPort](./notifications-port.md) | OS-level browser notification display |
| [PermissionsPort](./permissions-port.md) | Optional permission request and revocation |
| [ScriptingPort](./scripting-port.md) | Runtime script injection into tabs |
| [StoragePort](./storage-port.md) | Unified access to all browser storage areas |
| [TabGroupsPort](./tab-groups-port.md) | Tab group query and management |
| [TabsPort](./tabs-port.md) | Tab query, messaging, and broadcast |
| [UserScriptsPort](./user-scripts-port.md) | Isolated-world user script registration |
| [WebNavigationPort](./web-navigation-port.md) | Navigation lifecycle event observation |
| [WebRequestPort](./web-request-port.md) | Network request interception and observation |

## Deprecated Ports

| Port | Replacement |
|---|---|
| [BrowserActionPort](./browser-action-port.md) | Use [ActionPort](./action-port.md) |
| [PageActionPort](./page-action-port.md) | Use [ActionPort](./action-port.md) |