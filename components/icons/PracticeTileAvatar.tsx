import React from 'react';
import { resolveAssetUrl } from '../../utils/assetUrl';

interface PracticeTileAvatarProps {
  className?: string;
}

/** Coach Practice hero tile — raster icon aligned with other Kommunikation utility avatars. */
const PracticeTileAvatar: React.FC<PracticeTileAvatarProps> = ({ className = 'w-20 h-20' }) => (
  <img
    src={resolveAssetUrl('/avatars/practice-tile.png')}
    alt=""
    className={`${className} object-cover`}
    aria-hidden
    draggable={false}
  />
);

export default PracticeTileAvatar;
