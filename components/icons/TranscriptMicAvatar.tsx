import React from 'react';
import { resolveAssetUrl } from '../../utils/assetUrl';

interface TranscriptMicAvatarProps {
  className?: string;
}

/** Transcript tools tile — raster icon aligned with coach avatar treatment. */
const TranscriptMicAvatar: React.FC<TranscriptMicAvatarProps> = ({ className = 'w-20 h-20' }) => (
  <img
    src={resolveAssetUrl('/avatars/transcript-tile.png')}
    alt=""
    className={`${className} object-cover`}
    aria-hidden
    draggable={false}
  />
);

export default TranscriptMicAvatar;
