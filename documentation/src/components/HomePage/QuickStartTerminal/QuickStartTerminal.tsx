import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './QuickStartTerminal.scss';

type TerminalLineType = 'command' | 'output';

type TerminalLine = {
  type: TerminalLineType;
  content: string;
  delay?: number;
};

type RenderedLine = {
  type: TerminalLineType;
  content: string;
};

const TERMINAL_LINES: TerminalLine[] = [
  { type: 'command', content: 'npm install -g @hexajs-dev/cli', delay: 420 },
  { type: 'output', content: 'added 1 package in 2s' },
  { type: 'command', content: 'hexa new my-extension', delay: 900 },
  { type: 'output', content: '? Project name: my-extension' },
  { type: 'output', content: '? Select project template: (Use arrow keys)' },
  { type: 'output', content: '> Basic Extension' },
  { type: 'output', content: '  Content Script Extension' },
  { type: 'output', content: '? Select package manager: npm' },
  { type: 'output', content: 'Installing dependencies...' },
  { type: 'output', content: 'Project created successfully!' },
  { type: 'command', content: 'cd my-extension', delay: 760 },
  { type: 'command', content: 'hexa build --platform chrome --watch', delay: 900 },
  { type: 'output', content: 'Initializing build environment' },
  { type: 'output', content: 'Loading TypeScript configuration' },
  { type: 'output', content: 'Store, Background, Content & Manifest generated & Managed Popup and Devtools' },
  { type: 'output', content: 'Starting watch mode' },
  { type: 'output', content: 'HMR active: Background, Content and Managed UI' },
  { type: 'output', content: 'Watching for changes...' },
];

const COMMAND_TYPING_SPEED_MS = 32;
const COMMAND_COMPLETION_PAUSE_MS = 430;
const OUTPUT_LINE_PAUSE_MS = 150;
const LOOP_RESTART_DELAY_MS = 5000;

export function QuickStartTerminal() {
  const [renderedLines, setRenderedLines] = useState<RenderedLine[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  const resetAnimation = useCallback(() => {
    setRenderedLines([]);
    setLineIndex(0);
    setCharIndex(0);
  }, []);

  useEffect(() => {
    if (lineIndex >= TERMINAL_LINES.length) {
      const restartTimer = window.setTimeout(() => {
        resetAnimation();
      }, LOOP_RESTART_DELAY_MS);

      return () => {
        window.clearTimeout(restartTimer);
      };
    }

    const line = TERMINAL_LINES[lineIndex];

    if (line.type === 'command') {
      if (charIndex === 0 && line.delay) {
        const delayedStartTimer = window.setTimeout(() => {
          setCharIndex(1);
        }, line.delay);

        return () => {
          window.clearTimeout(delayedStartTimer);
        };
      }

      if (charIndex < line.content.length) {
        const typingTimer = window.setTimeout(() => {
          setCharIndex((previousValue) => previousValue + 1);
        }, COMMAND_TYPING_SPEED_MS);

        return () => {
          window.clearTimeout(typingTimer);
        };
      }

      const commitCommandTimer = window.setTimeout(() => {
        setRenderedLines((previousLines) => [...previousLines, { type: line.type, content: line.content }]);
        setLineIndex((previousLineIndex) => previousLineIndex + 1);
        setCharIndex(0);
      }, COMMAND_COMPLETION_PAUSE_MS);

      return () => {
        window.clearTimeout(commitCommandTimer);
      };
    }

    const outputTimer = window.setTimeout(() => {
      setRenderedLines((previousLines) => [...previousLines, { type: line.type, content: line.content }]);
      setLineIndex((previousLineIndex) => previousLineIndex + 1);
      setCharIndex(0);
    }, OUTPUT_LINE_PAUSE_MS);

    return () => {
      window.clearTimeout(outputTimer);
    };
  }, [charIndex, lineIndex, resetAnimation]);

  useEffect(() => {
    if (!terminalBodyRef.current) {
      return;
    }

    terminalBodyRef.current.scrollTo({
      top: terminalBodyRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [charIndex, renderedLines]);

  const activeLine = TERMINAL_LINES[lineIndex];

  const activeCommandText = useMemo(() => {
    if (!activeLine || activeLine.type !== 'command') {
      return '';
    }

    return activeLine.content.slice(0, charIndex);
  }, [activeLine, charIndex]);

  return (
    <section className="quickStartTerminal" aria-label="Quick Start terminal setup flow">
      <div className="quickStartTerminalHeader">
        <h2 className="quickStartTerminalTitle">Quick Start</h2>
        <p className="quickStartTerminalSubtitle">Get up and running in seconds</p>
      </div>

      <div className="quickStartWindow" role="img" aria-label="Animated terminal showing Hexa CLI setup">
        <div className="quickStartWindowTopBar">
          <div className="quickStartWindowLights" aria-hidden="true">
            <span className="quickStartWindowLight quickStartWindowLightRed" />
            <span className="quickStartWindowLight quickStartWindowLightYellow" />
            <span className="quickStartWindowLight quickStartWindowLightGreen" />
          </div>
          <span className="quickStartWindowLabel">Terminal</span>
        </div>

        <div className="quickStartWindowBody" ref={terminalBodyRef}>
          {renderedLines.map((line, index) => {
            const isChoiceLine = line.type === 'output' && line.content.startsWith('> ');

            return (
              <div key={`${line.content}-${index}`} className="quickStartLine">
                {line.type === 'command' ? (
                  <>
                    <span className="quickStartPrompt" aria-hidden="true">
                      $
                    </span>
                    <span className="quickStartCommandText">{line.content}</span>
                  </>
                ) : (
                  <span className={isChoiceLine ? 'quickStartOutputText quickStartOutputTextActive' : 'quickStartOutputText'}>{line.content}</span>
                )}
              </div>
            );
          })}

          {activeLine?.type === 'command' && charIndex > 0 && (
            <div className="quickStartLine">
              <span className="quickStartPrompt" aria-hidden="true">
                $
              </span>
              <span className="quickStartCommandText">
                {activeCommandText}
                <span className="quickStartCursor" aria-hidden="true" />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}