// src/utils/cachedMapboxSource.js
// Custom OpenLayers source that uses Mapbox with caching

import { XYZ } from 'ol/source';
import { mapboxCacheService } from '../services/mapboxCacheService';
import { MAPBOX_CONFIG } from '../config/mapbox';

export class CachedMapboxSource extends XYZ {
  constructor(options = {}) {
    const {
      style = 'satellite_streets',
      enableCaching = true,
      preloadArea = false,
      ...xyzOptions
    } = options;

    // Create the base URL template
    const baseUrl = MAPBOX_CONFIG.TILE_URLS[style.toUpperCase()];
    if (!baseUrl) {
      throw new Error(`Unknown Mapbox style: ${style}`);
    }

    super({
      url: baseUrl,
      attributions: MAPBOX_CONFIG.ATTRIBUTION,
      maxZoom: 22,
      crossOrigin: 'anonymous',
      ...xyzOptions
    });

    this.mapboxStyle = style;
    this.enableCaching = enableCaching;
    this.cacheService = mapboxCacheService;
    this.requestCount = 0;
    this.cacheHits = 0;

    // Override the tile loading function if caching is enabled
    if (this.enableCaching) {
      this.setTileLoadFunction(this.cachedTileLoadFunction.bind(this));
    }

    // Preload area if requested
    if (preloadArea) {
      this.preloadNairobiArea();
    }

    console.log(`🗺️ CachedMapboxSource initialized for style: ${style}, caching: ${enableCaching}`);
  }

  async cachedTileLoadFunction(tile, src) {
    this.requestCount++;
    
    try {
      // Parse tile coordinates from URL
      const tileCoords = this.parseTileCoordinates(src);
      if (!tileCoords) {
        // Fallback to default loading
        return this.defaultTileLoadFunction(tile, src);
      }

      const { z, x, y } = tileCoords;

      // Try to get tile from cache
      const cachedResponse = await this.cacheService.getTile(
        this.mapboxStyle, 
        z, 
        x, 
        y, 
        { 
          highDPI: window.devicePixelRatio > 1,
          format: 'webp' // Use WebP for better compression
        }
      );

      if (cachedResponse) {
        this.cacheHits++;
        
        // Convert response to blob URL
        const blob = await cachedResponse.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Set the tile source
        const image = tile.getImage();
        image.onload = () => {
          // Clean up blob URL after loading
          URL.revokeObjectURL(blobUrl);
        };
        image.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          // Fallback to original URL on error
          this.defaultTileLoadFunction(tile, src);
        };
        image.src = blobUrl;
      } else {
        // Cache miss, load normally
        this.defaultTileLoadFunction(tile, src);
      }
    } catch (error) {
      console.error('Error in cached tile loading:', error);
      // Fallback to default loading on error
      this.defaultTileLoadFunction(tile, src);
    }
  }

  defaultTileLoadFunction(tile, src) {
    const image = tile.getImage();
    image.crossOrigin = 'anonymous';
    image.src = src;
  }

  parseTileCoordinates(url) {
    try {
      // Extract z, x, y from URL pattern
      const match = url.match(/\/(\d+)\/(\d+)\/(\d+)(?:[@\.]|$)/);
      if (match) {
        return {
          z: parseInt(match[1]),
          x: parseInt(match[2]),
          y: parseInt(match[3])
        };
      }
    } catch (error) {
      console.error('Error parsing tile coordinates:', error);
    }
    return null;
  }

  async preloadNairobiArea() {
    try {
      await this.cacheService.preloadNairobiCBD([this.mapboxStyle], 16);
      console.log(`✅ Preloaded Nairobi area for ${this.mapboxStyle}`);
    } catch (error) {
      console.error('Error preloading Nairobi area:', error);
    }
  }

  getCacheStats() {
    const hitRate = this.requestCount > 0 
      ? (this.cacheHits / this.requestCount * 100).toFixed(1)
      : 0;

    return {
      requestCount: this.requestCount,
      cacheHits: this.cacheHits,
      hitRate: `${hitRate}%`,
      style: this.mapboxStyle,
      cachingEnabled: this.enableCaching,
      globalStats: this.cacheService.getCacheStats()
    };
  }

  async clearCache() {
    await this.cacheService.clearCache();
    this.requestCount = 0;
    this.cacheHits = 0;
  }
}

// Factory function for creating cached Mapbox sources
export const createCachedMapboxSource = (style, options = {}) => {
  return new CachedMapboxSource({
    style,
    enableCaching: true,
    preloadArea: options.preloadArea || false,
    ...options
  });
};

// Preload function for immediate use
export const preloadMapboxTiles = async (styles = ['satellite_streets']) => {
  console.log('🚀 Starting Mapbox tile preloading...');
  await mapboxCacheService.preloadNairobiCBD(styles, 16);
  console.log('✅ Mapbox tile preloading completed');
};

export default CachedMapboxSource;