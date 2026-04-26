import { useEffect, useState } from 'react';
import { inject } from '@hexajs-dev/common';
import { RuntimePort } from '@hexajs-dev/ports';
import { HexaUIClient } from '@hexajs-dev/ui';
import { backgroundApi, devtoolsHandlesApi } from '@contract/api';
import { DevtoolsSyncThemeMessage, PopupGetRecentClipsMessage, PopupStartClippingMessage, RecentClipItem, RecentClipsMessage, StartClippingAckMessage } from '@contract/messages/messages';
import { areAllSelectedLanguagesBundled, DEFAULT_OCR_LANGUAGE, getOcrLanguageSummary, getOcrLanguageTag, OcrLanguageCode, OCR_LANGUAGE_SELECTION_STORAGE_KEY, parseOcrLanguageSelection, serializeOcrLanguageSelection } from '@contract/ocr-language';
import smartClipperLogoUrl from '../../../src/assets/smart-clipper.logo.svg';
import { LanguageSelect } from './components/language-select/LanguageSelect';
import { RecentSection } from './components/recent/RecentSection';
import { ShortcutSection } from './components/shortcut/ShortcutSection';
import { MoonIcon, SunIcon } from './components/shared/icons/Icons';
import './App.scss';

const POPUP_THEME_STORAGE_KEY = 'smart-clipper.popup.theme';
type ThemeMode = 'light' | 'dark';

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function App() {
  const runtimePort = inject(RuntimePort);
  const [status, setStatus] = useState<'idle' | 'sending' | 'armed' | 'error'>('idle');
  const [feedback, setFeedback] = useState('Click start, then drag on the webpage to select an area.');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    return window.localStorage.getItem(POPUP_THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  });
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [recentClips, setRecentClips] = useState<RecentClipItem[]>([]);
  const [ocrLanguages, setOcrLanguages] = useState(() => {
    if (typeof window === 'undefined') {
      return parseOcrLanguageSelection(DEFAULT_OCR_LANGUAGE);
    }
    return parseOcrLanguageSelection(window.localStorage.getItem(OCR_LANGUAGE_SELECTION_STORAGE_KEY) ?? DEFAULT_OCR_LANGUAGE);
  });
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  useEffect(() => {
    const loadRecentClips = async () => {
      try {
        const hexaUIClient = inject(HexaUIClient);
        const response = await hexaUIClient.sendMessage<PopupGetRecentClipsMessage, RecentClipsMessage>(backgroundApi.GetRecentClips, new PopupGetRecentClipsMessage(Date.now(), 'popup'));
        if ((response as any)?.__hexa_error__) {
          throw new Error((response as any).__hexa_error__);
        }
        setRecentClips(Array.isArray(response.clips) ? response.clips.slice(0, 4) : []);
      } catch (error) {
        console.warn('Failed to load recent clips:', error);
      }
    };
    loadRecentClips();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const serializedLanguages = serializeOcrLanguageSelection(ocrLanguages);
    window.localStorage.setItem(OCR_LANGUAGE_SELECTION_STORAGE_KEY, serializedLanguages);

    try {
      const extensionApi = (globalThis as any).chrome ?? (globalThis as any).browser;
      const setResult = extensionApi?.storage?.local?.set?.({ [OCR_LANGUAGE_SELECTION_STORAGE_KEY]: serializedLanguages });
      if (setResult && typeof setResult.catch === 'function') {
        setResult.catch((error: unknown) => {
          console.warn('Failed to persist OCR language selection.', error);
        });
      }
    } catch (error) {
      console.warn('Failed to persist OCR language selection.', error);
    }
  }, [ocrLanguages]);

  useEffect(() => {
    const unsubscribe = runtimePort.onMessage((message: any) => {
      if (!message || message.action !== devtoolsHandlesApi.SyncTheme) {
        return;
      }

      const payload = message.payload as Partial<DevtoolsSyncThemeMessage>;
      if (!isThemeMode(payload?.theme)) {
        return;
      }

      setTheme(payload.theme);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(POPUP_THEME_STORAGE_KEY, payload.theme);
      }
    });

    return () => unsubscribe();
  }, [runtimePort]);

  const selectedLanguageSummary = getOcrLanguageSummary(ocrLanguages);
  const selectedLanguagesBundled = areAllSelectedLanguagesBundled(ocrLanguages);
  const selectedLanguageTags = ocrLanguages.map(language => getOcrLanguageTag(language));

  const onToggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    window.localStorage.setItem(POPUP_THEME_STORAGE_KEY, nextTheme);
    runtimePort.sendMessage({ action: devtoolsHandlesApi.SyncTheme, payload: new DevtoolsSyncThemeMessage(nextTheme) }).catch((error) => {
      console.warn('Failed to sync popup theme to devtools.', error);
    });
  };

  const onToggleLanguageMenu = () => {
    setIsLanguageMenuOpen(open => !open);
  };

  const onCloseLanguageMenu = () => {
    setIsLanguageMenuOpen(false);
  };

  const onToggleLanguage = (languageCode: string) => {
    const normalizedLanguageCode = languageCode as OcrLanguageCode;
    const exists = ocrLanguages.includes(normalizedLanguageCode);
    const nextLanguages = exists ? ocrLanguages.filter(language => language !== normalizedLanguageCode) : [...ocrLanguages, normalizedLanguageCode];
    const normalizedLanguages = parseOcrLanguageSelection(nextLanguages.length > 0 ? nextLanguages : DEFAULT_OCR_LANGUAGE);
    setOcrLanguages(normalizedLanguages);
    setStatus('idle');
    setFeedback(areAllSelectedLanguagesBundled(normalizedLanguages) ? `${getOcrLanguageSummary(normalizedLanguages)} ready.` : `${getOcrLanguageSummary(normalizedLanguages)} selected. Missing models download on first use and are then cached.`);
  };

  const onStartClipping = async () => {
    if (status === 'sending') {
      return;
    }
    try {
      setStatus('sending');
      setFeedback(`Arming clip mode on the active tab for ${selectedLanguageSummary.toLowerCase()} OCR...`);
      const hexaUIClient = inject(HexaUIClient);
      const response = await hexaUIClient.sendMessage<PopupStartClippingMessage, StartClippingAckMessage>(backgroundApi.StartClipping, new PopupStartClippingMessage(Date.now(), 'popup', serializeOcrLanguageSelection(ocrLanguages)));
      if ((response as any)?.__hexa_error__) {
        throw new Error((response as any).__hexa_error__);
      }
      if (response.status === 'armed' || response.status === 'already-active') {
        setStatus('armed');
        setFeedback(selectedLanguagesBundled ? `Selection mode is active for ${selectedLanguageSummary.toLowerCase()}. Click and drag on the page. Press Esc or right-click to cancel.` : `Selection mode is active for ${selectedLanguageSummary.toLowerCase()}. Missing models download on first use and then stay cached.`);
        return;
      }
      setStatus('error');
      setFeedback(response.reason || 'Could not start clipping on the active tab.');
    } catch (error) {
      console.error('Failed to start clipping:', error);
      setStatus('error');
      setFeedback('Failed to start clipping. Ensure the current page allows content scripts.');
    }
  };

  return (
    <div className={`popup-root ${theme === 'dark' ? 'dark' : 'light'}`}>
      <div className='popup-shell'>
        <header className='popup-hero'>
          <div className='popup-brand'>
            <div className='popup-logo'>
              <img src={smartClipperLogoUrl} alt='' aria-hidden='true' />
            </div>
            <div>
              <h1>OCR Clipper</h1>
              <p>Capture text from screen</p>
            </div>
          </div>
          <button type='button' className='theme-toggle' onClick={onToggleTheme} aria-label='Toggle theme'>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        <main className='popup-main'>
          <LanguageSelect
            isLanguageMenuOpen={isLanguageMenuOpen}
            ocrLanguages={ocrLanguages}
            onToggleLanguage={onToggleLanguage}
            onCloseLanguageMenu={onCloseLanguageMenu}
            onToggleLanguageMenu={onToggleLanguageMenu}
            selectedLanguageSummary={selectedLanguageSummary}
            selectedLanguagesBundled={selectedLanguagesBundled}
          />

          <button onClick={onStartClipping} className={`popup-start-btn ${status}`} type='button' disabled={status === 'sending'}>
            {status === 'sending' ? 'Starting...' : 'Start Clipping'}
          </button>

          <ShortcutSection isMac={isMac} />

          <p className={`popup-feedback ${status}`}>{feedback}</p>

          <RecentSection recentClips={recentClips} selectedLanguageTags={selectedLanguageTags} />
        </main>
      </div>
    </div>
  );
}
