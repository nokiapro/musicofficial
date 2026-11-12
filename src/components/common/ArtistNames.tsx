import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { formatArtistName } from '../../utils/artistUtils';

interface ArtistNamesProps {
  artists: string;
  className?: string;
  linkClassName?: string;
  separator?: string;
  onArtistClick?: (artistName: string) => void;
}

export const ArtistNames: React.FC<ArtistNamesProps> = ({
  artists,
  className = '',
  linkClassName = '',
  separator = ', ',
  onArtistClick,
}) => {
  const { navigateToArtist } = useMusic();

  if (!artists || !artists.trim()) {
    return <span className={className}>Nhiều ca sĩ</span>;
  }

  // Split multiple artists separated by commas
  const artistList = artists
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);

  if (artistList.length === 0) {
    return <span className={className}>Nhiều ca sĩ</span>;
  }

  const handleClick = (e: React.MouseEvent, artistName: string) => {
    e.stopPropagation();
    if (onArtistClick) {
      onArtistClick(artistName);
    } else {
      navigateToArtist(artistName);
    }
  };

  return (
    <span className={`inline-flex flex-wrap items-center gap-0.5 ${className}`}>
      {artistList.map((artist, index) => {
        const displayName = formatArtistName(artist);
        return (
          <React.Fragment key={`${artist}-${index}`}>
            <button
              type="button"
              onClick={(e) => handleClick(e, artist)}
              className={`inline text-left font-normal transition-colors hover:text-purple-300 hover:underline cursor-pointer focus:outline-none ${linkClassName}`}
              title={`Xem tiểu sử ca sĩ: ${displayName}`}
            >
              {displayName}
            </button>
            {index < artistList.length - 1 && (
              <span className="text-white/40 select-none mr-0.5">{separator}</span>
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
};
