import React from 'react';
import { resolveAssetUrl } from '../../utils/assetUrl';

interface ConnectorTileAvatarProps {
  className?: string;
}

/** The Connector discovery tile — raster icon aligned with coach avatar treatment. */
const ConnectorTileAvatar: React.FC<ConnectorTileAvatarProps> = ({ className = 'w-20 h-20' }) => (
  <img
    src={resolveAssetUrl('/avatars/connector-tile.png')}
    alt=""
    className={`${className} object-cover`}
    aria-hidden
    draggable={false}
  />
);

export default ConnectorTileAvatar;
