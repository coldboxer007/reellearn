import type {
  BuildingContent,
  FeedItem,
  GameContent,
  PostContent,
  ReelContent,
  ShareContent,
  SignalContent,
} from '../../types';
import { BuildingCard } from './BuildingCard';
import { GameCover } from './GameCover';
import { PostCarousel } from './PostCarousel';
import { ReelCard } from './ReelCard';
import { ShareCard, SignalCard } from './ShareCard';

interface Props {
  item: FeedItem;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onGameActiveChange: (active: boolean) => void;
}

export function FeedCard({ item, active, muted, onToggleMute, onGameActiveChange }: Props) {
  switch (item.kind) {
    case 'reel':
      return (
        <ReelCard
          reel={item.content as ReelContent}
          active={active}
          muted={muted}
          onToggleMute={onToggleMute}
        />
      );
    case 'post':
      return <PostCarousel post={item.content as PostContent} active={active} />;
    case 'game':
      return (
        <GameCover
          game={item.content as GameContent}
          active={active}
          onActiveChange={onGameActiveChange}
        />
      );
    case 'building':
      return <BuildingCard job={item.content as BuildingContent} />;
    case 'share':
      return <ShareCard share={item.content as ShareContent} />;
    case 'signal':
      return <SignalCard signal={item.content as SignalContent} />;
    default:
      return null;
  }
}
