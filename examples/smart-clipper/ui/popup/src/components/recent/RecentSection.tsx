import { RecentClipItem } from '@contract/messages/messages';
import { RECENT_SECTION_TEXT } from './constants';
import { RecentCard } from './card/RecentCard';
import './RecentSection.scss';

type RecentSectionProps = {
  recentClips: RecentClipItem[];
  selectedLanguageTags: string[];
};

export function RecentSection({ recentClips, selectedLanguageTags }: RecentSectionProps) {
  return (
    <section className='recent-section'>
      <div className='section-head'>
        <h2>{RECENT_SECTION_TEXT.title}</h2>
        <span>{recentClips.length}</span>
      </div>
      <div className='recent-list'>
        {recentClips.length === 0 ? (
          <div className='recent-card empty'>
            <p className='recent-title'>{RECENT_SECTION_TEXT.emptyTitle}</p>
            <p className='recent-copy'>{RECENT_SECTION_TEXT.emptyCopy}</p>
            <div className='recent-tags'>
              {selectedLanguageTags.map(tag => <span key={tag} className='recent-tag'>{tag}</span>)}
            </div>
          </div>
        ) : recentClips.map((clip, index) => <RecentCard key={`${clip.capturedAt}-${index}`} clip={clip} emptyOcrText={RECENT_SECTION_TEXT.emptyOcrText} />)}
      </div>
    </section>
  );
}
