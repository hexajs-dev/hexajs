import type { LucideIcon } from 'lucide-react';
import { Circle, Cog, Compass, Cpu, Database, Flame, Globe, Orbit, Paintbrush2, PanelsTopLeft, Puzzle, RefreshCw, Rocket, Shield, Shuffle, Waves, Waypoints, Workflow, Wrench } from 'lucide-react';

export type DocIconKey =
  | 'rocket'
  | 'puzzle'
  | 'database'
  | 'globe'
  | 'paintbrush'
  | 'compass'
  | 'shuffle'
  | 'cog'
  | 'wrench'
  | 'cpu'
  | 'workflow'
  | 'panels'
  | 'waypoints'
  | 'refresh'
  | 'chrome'
  | 'firefox'
  | 'safari'
  | 'opera'
  | 'edge'
  | 'brave';

export const DOC_ICONS: Record<DocIconKey, LucideIcon> = {
  rocket: Rocket,
  puzzle: Puzzle,
  database: Database,
  globe: Globe,
  paintbrush: Paintbrush2,
  compass: Compass,
  shuffle: Shuffle,
  cog: Cog,
  wrench: Wrench,
  cpu: Cpu,
  workflow: Workflow,
  panels: PanelsTopLeft,
  waypoints: Waypoints,
  refresh: RefreshCw,
  chrome: Orbit,
  firefox: Flame,
  safari: Compass,
  opera: Circle,
  edge: Waves,
  brave: Shield,
};