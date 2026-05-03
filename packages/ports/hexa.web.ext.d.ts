/// <reference path="./src/background/cookies/cookies.types.d.ts" />
/// <reference path="./src/background/tabs/tabs.types.d.ts" />
/// <reference path="./src/background/storage/storage.types.d.ts" />
/// <reference path="./src/background/notifications/notifications.types.d.ts" />
/// <reference path="./src/background/declarative-net-request/declarative-net-request.types.d.ts" />
/// <reference path="./src/background/downloads/downloads.types.d.ts" />
/// <reference path="./src/background/web-navigation/web-navigation.types.d.ts" />
/// <reference path="./src/background/management/management.types.d.ts" />
/// <reference path="./src/background/alarms/alarms.types.d.ts" />
/// <reference path="./src/background/action/action.types.d.ts" />
/// <reference path="./src/background/browser-action/browser-action.types.d.ts" />
/// <reference path="./src/background/bookmarks/bookmarks.types.d.ts" />
/// <reference path="./src/background/browsing-data/browsing-data.types.d.ts" />
/// <reference path="./src/background/commands/commands.types.d.ts" />
/// <reference path="./src/background/history/history.types.d.ts" />
/// <reference path="./src/background/identity/identity.types.d.ts" />
/// <reference path="./src/background/idle/idle.types.d.ts" />
/// <reference path="./src/background/menus/menus.types.d.ts" />
/// <reference path="./src/background/page-action/page-action.types.d.ts" />
/// <reference path="./src/background/permissions/permissions.types.d.ts" />
/// <reference path="./src/background/tab-groups/tab-groups.types.d.ts" />
/// <reference path="./src/background/user-scripts/user-scripts.types.d.ts" />
/// <reference path="./src/background/web-request/web-request.types.d.ts" />
/// <reference path="./src/general/runtime/runtime.types.d.ts" />
/// <reference path="./src/general/i18n/i18n.types.d.ts" />
/// <reference path="./src/general/extension/extension.types.d.ts" />
/// <reference path="./src/general/events/events.types.d.ts" />
/// <reference path="./src/general/types/types.types.d.ts" />
/// <reference path="./src/ui/devtools/devtools.types.d.ts" />

declare global {

	// ─── Shared primitive interfaces ──────────────────────────────────────────

	/** Cross-browser Port — identical shape in Chrome, Firefox and Safari. */
	interface HexaWebPort {
		name: string;
		postMessage(message: any): void;
		disconnect(): void;
		onMessage: { addListener(callback: (message: any, port: HexaWebPort) => void): void };
		onDisconnect: { addListener(callback: (port: HexaWebPort) => void): void };
	}

	/** Cross-browser Tab. */
	interface HexaWebTab {
		id?: number;
		url?: string;
		title?: string;
		active?: boolean;
		windowId?: number;
	}

	/** Cross-browser MessageSender. */
	interface HexaWebMessageSender {
		tab?: HexaWebTab;
		id?: string;
		origin?: string;
		url?: string;
		frameId?: number;
	}

	/**
	 * Cross-browser StorageArea.
	 * Each method is overloaded for both the Chrome callback-style and the
	 * Firefox / Safari Promise-style so code can use either pattern.
	 */
	interface HexaWebStorageArea {
		get(keys: string | string[] | { [key: string]: any } | null, callback: (items: { [key: string]: any }) => void): void;
		get(keys: string | string[] | { [key: string]: any } | null): Promise<{ [key: string]: any }>;
		set(items: { [key: string]: any }, callback?: () => void): void;
		set(items: { [key: string]: any }): Promise<void>;
		remove(keys: string | string[], callback?: () => void): void;
		remove(keys: string | string[]): Promise<void>;
		clear(callback?: () => void): void;
		clear(): Promise<void>;
	}

	// ─── Devtools types ───────────────────────────────────────────────────────

	/** A panel created via devtools.panels.create(). */
	interface HexaWebExtensionPanel {
		/** Fired when the panel becomes visible. Receives the panel's `window` object. */
		onShown: { addListener(callback: (panelWindow: Window) => void): void };
		/** Fired when the panel is hidden. */
		onHidden: { addListener(callback: () => void): void };
		/** Fired when the user presses a keyboard shortcut in the panel. */
		onSearch: { addListener(callback: (action: string, queryString?: string) => void): void };
		/** Create a toolbar button for this panel. */
		createStatusBarButton(iconPath: string, tooltipText: string, disabled: boolean): HexaWebButton;
	}

	/** A sidebar pane in the Elements panel. */
	interface HexaWebExtensionSidebarPane {
		setPage(pagePath: string): Promise<void>;
		setExpression(expression: string, rootTitle?: string): Promise<void>;
		setObject(jsonObject: any, rootTitle?: string): Promise<void>;
		onShown: { addListener(callback: (sidebarWindow: Window) => void): void };
		onHidden: { addListener(callback: () => void): void };
	}

	/** A toolbar button in a devtools panel. */
	interface HexaWebButton {
		update(iconPath: string, tooltipText: string, disabled: boolean): void;
		onClicked: { addListener(callback: () => void): void };
	}

	/** A resource (file) loaded by the inspected page. */
	interface HexaWebResource {
		url: string;
		getContent(callback: (content: string, encoding: string) => void): void;
		setContent(content: string, commit: boolean, callback?: (error?: any) => void): void;
	}

	/** HAR log returned by devtools.network.getHAR(). */
	interface HexaWebHARLog {
		version: string;
		creator: { name: string; version: string };
		entries: HexaWebHAREntry[];
		pages?: any[];
	}

	/** A single network request entry in a HAR log. */
	interface HexaWebHAREntry {
		request: { method: string; url: string; headers: any[]; postData?: any };
		response: { status: number; statusText: string; headers: any[]; content: any };
		startedDateTime: string;
		timings: { send: number; wait: number; receive: number };
		time: number;
		getContent(callback: (content: string, encoding: string) => void): void;
	}

	// ─── webExt — unified cross-browser namespace ─────────────────────────────
	/**
	 * Single unified extension API surface covering Chrome, Firefox and Safari.
	 * All product code should reference `webExt.<namespace>.<feature>`.
	 *
	 * Bootstrap (run once at extension startup):
	 *   (globalThis as any).webExt = (globalThis as any).browser ?? (globalThis as any).chrome;
	 *
	 * webExt.runtime  = chrome.runtime  | browser.runtime
	 * webExt.tabs     = chrome.tabs     | browser.tabs
	 * webExt.storage  = chrome.storage  | browser.storage
	 * webExt.i18n     = chrome.i18n     | browser.i18n
	 * webExt.devtools = chrome.devtools | browser.devtools
	 * webExt.action   = chrome.action   | browser.action
	 * webExt.windows  = chrome.windows  | browser.windows
	 */
	namespace webExt {

		// ── runtime ───────────────────────────────────────────────────────────
		namespace runtime {
			const id: string;
			/** Set on callback-based API calls if an error occurred. Check after calling callback methods. */
			const lastError: { message?: string } | undefined;
			function getURL(path?: string): string;
			/** Chrome-style (callback). */
			function sendMessage(message: any, responseCallback?: (response: any) => void): void;
			/** Firefox / Safari-style (Promise). */
			function sendMessage(message: any): Promise<any>;
			function connect(connectInfo?: { name?: string }): HexaWebPort;
			function connect(extensionId: string, connectInfo?: { name?: string }): HexaWebPort;
			const onMessage: {
				addListener(callback: (message: any, sender: HexaWebMessageSender, sendResponse: (response?: any) => void) => void | boolean): void;
				removeListener(callback: (...args: any[]) => void): void;
			};
			const onMessageExternal: {
				addListener(callback: (message: any, sender: HexaWebMessageSender, sendResponse: (response?: any) => void) => void | boolean): void;
				removeListener(callback: (...args: any[]) => void): void;
			};
			const onConnect: { addListener(callback: (port: HexaWebPort) => void): void };
			type MessageSender = HexaWebMessageSender;
			type Port = HexaWebPort;
		}

		// ── tabs ──────────────────────────────────────────────────────────────
		namespace tabs {
			type Tab = HexaWebTab;
			/** Chrome-style (callback). */
			function create(createProperties: { url?: string; active?: boolean; windowId?: number }, callback?: (tab: Tab) => void): void;
			/** Firefox / Safari-style (Promise). */
			function create(createProperties: { url?: string; active?: boolean; windowId?: number }): Promise<Tab>;
			/** Chrome-style (callback). */
			function query(queryInfo: { active?: boolean; currentWindow?: boolean; url?: string | string[] }, callback: (tabs: Tab[]) => void): void;
			/** Firefox / Safari-style (Promise). */
			function query(queryInfo: { active?: boolean; currentWindow?: boolean; url?: string | string[] }): Promise<Tab[]>;
			/** Chrome-style (callback). */
			function sendMessage(tabId: number, message: any, responseCallback?: (response: any) => void): void;
			/** Firefox / Safari-style (Promise). */
			function sendMessage(tabId: number, message: any): Promise<any>;
			/** Chrome-style (callback). */
			function get(tabId: number, callback: (tab: Tab) => void): void;
			/** Firefox / Safari-style (Promise). */
			function get(tabId: number): Promise<Tab>;
		}

		// ── storage ───────────────────────────────────────────────────────────
		namespace storage {
			type StorageArea = HexaWebStorageArea;
			const local: StorageArea;
			const sync: StorageArea;
			const session: StorageArea;
		}

		// ── i18n ──────────────────────────────────────────────────────────────
		namespace i18n {
			function getMessage(messageName: string, substitutions?: string | string[]): string;
			function getUILanguage(): string;
		}

		// ── extension ─────────────────────────────────────────────────────────
		namespace extension {
			function getURL(path?: string): string;
			const inIncognitoContext: boolean;
		}

		// ── devtools ──────────────────────────────────────────────────────────
		namespace devtools {
			namespace panels {
				/** The tab id of the inspected window — call via panels.themeName. */
				const themeName: 'default' | 'dark';
				/** Chrome-style (callback). */
				function create(title: string, iconPath: string, pagePath: string, callback?: (panel: HexaWebExtensionPanel) => void): void;
				/** Firefox / Safari-style (Promise). */
				function create(title: string, iconPath: string, pagePath: string): Promise<HexaWebExtensionPanel>;
				/** Add a sidebar pane to the Elements panel. */
				function openResource(url: string, lineNumber: number, callback?: () => void): void;
				const elements: {
					/** Create a sidebar pane in the Elements panel. */
					createSidebarPane(title: string, callback?: (result: HexaWebExtensionSidebarPane) => void): void;
					createSidebarPane(title: string): Promise<HexaWebExtensionSidebarPane>;
					onSelectionChanged: { addListener(callback: () => void): void };
				};
				const sources: {
					onSelectionChanged: { addListener(callback: (resource: HexaWebResource) => void): void };
				};
			}
			namespace inspectedWindow {
				/** The tab id of the inspected window. */
				const tabId: number;
				/** Evaluate a JavaScript expression in the context of the inspected page. */
				function eval(expression: string, options?: { frameURL?: string; useContentScriptContext?: boolean; contextSecurityOrigin?: string }, callback?: (result: any, exceptionInfo: { isException: boolean; value?: string; description?: string }) => void): void;
				function eval(expression: string, options?: { frameURL?: string; useContentScriptContext?: boolean; contextSecurityOrigin?: string }): Promise<[any, { isException: boolean; value?: string; description?: string }]>;
				/** Reload the inspected window (optionally bypass cache, inject script, etc.). */
				function reload(reloadOptions?: { ignoreCache?: boolean; userAgent?: string; injectedScript?: string }): void;
				/** Get all resources of the inspected page. */
				function getResources(callback: (resources: HexaWebResource[]) => void): void;
				function getResources(): Promise<HexaWebResource[]>;
				const onResourceAdded: { addListener(callback: (resource: HexaWebResource) => void): void };
				const onResourceContentCommitted: { addListener(callback: (resource: HexaWebResource, content: string) => void): void };
			}
			namespace network {
				/** Returns a HAR log of all requests since the page was opened. */
				function getHAR(callback: (harLog: HexaWebHARLog) => void): void;
				function getHAR(): Promise<HexaWebHARLog>;
				/** Fired when a network request is finished. */
				const onRequestFinished: { addListener(callback: (request: HexaWebHAREntry) => void): void; removeListener(callback: (request: HexaWebHAREntry) => void): void };
				/** Fired when devtools navigates to a new page. */
				const onNavigated: { addListener(callback: (url: string) => void): void; removeListener(callback: (url: string) => void): void };
			}
		}

		// ── action (MV3) ──────────────────────────────────────────────────────
		namespace action {
			function setIcon(details: { imageData?: any; path?: string | { [size: number]: string }; tabId?: number }): Promise<void>;
			function setTitle(details: { title: string; tabId?: number }): Promise<void>;
			function setBadgeText(details: { text: string; tabId?: number }): Promise<void>;
			function setBadgeBackgroundColor(details: { color: string; tabId?: number }): Promise<void>;
			const onClicked: { addListener(callback: (tab: HexaWebTab) => void): void };
		}

		// ── windows ───────────────────────────────────────────────────────────
		namespace windows {
			interface Window {
				id?: number;
				focused?: boolean;
				tabs?: HexaWebTab[];
				type?: 'normal' | 'popup' | 'panel' | 'devtools';
			}
			/** Chrome-style (callback). */
			function getCurrent(callback?: (window: Window) => void): void;
			/** Firefox / Safari-style (Promise). */
			function getCurrent(): Promise<Window>;
			/** Chrome-style (callback). */
			function create(createData: { url?: string; type?: string; width?: number; height?: number }, callback?: (window: Window) => void): void;
			/** Firefox / Safari-style (Promise). */
			function create(createData: { url?: string; type?: string; width?: number; height?: number }): Promise<Window>;
		}
	}

	/** Firefox / modern Safari global — same shape as `webExt`. */
	const browser: typeof webExt;
}

export {};
