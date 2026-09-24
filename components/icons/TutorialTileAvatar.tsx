import React from 'react';
import { resolveAssetUrl } from '../../utils/assetUrl';

interface TutorialTileAvatarProps {
  className?: string;
}

/** QuickStart & Tutorials tile — raster icon aligned with coach avatar treatment. */
const TutorialTileAvatar: React.FC<TutorialTileAvatarProps> = ({ className = 'w-20 h-20' }) => (
  <img
    src={resolveAssetUrl('/avatars/tutorial-tile.png')}
    alt=""
    className={`${className} object-cover`}
    aria-hidden
    draggable={false}
  />
);

export default TutorialTileAvatar;
