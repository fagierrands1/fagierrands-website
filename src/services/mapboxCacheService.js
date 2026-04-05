// src/services/mapboxCacheService.js
// Mapbox tile caching service to optimize API usage

import { MAPBOX_CONFIG } from '../config/mapbox';

class MapboxCacheService {
  constructor() {
    this.cacheName = 'mapbox-tiles-cache-v1';
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB cache limit
    this.maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      cacheSize: 0
    };
    
    // Initialize cache
    this.initializeCache();
    
    // Cleanup old cache entries periodically
    this.startCacheCleanup();
  }

  async initializeCache() {
    try {
      // Check if Cache API is supported
      if ('caches' in window) {
        this.cache = await caches.open(this.cacheName);
        await this.calculateCacheSize();
        console.log('🗄️ Mapbox cache initialized:', this.cacheStats);
      } else {
        console.warn('Cache API not supported, falling back to memory cache');
        this.memoryCache = new Map();
      }
    } catch (error) {
      console.error('Failed to initialize Mapbox cache:', error);
      this.memoryCache = new Map();
    }
  }

  async calculateCacheSize() {
    if (!this.cache) return;
    
    try {
      const keys = await this.cache.keys();
      let totalSize = 0;
      
      for (const request of keys) {
        const response = await this.cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
      
      this.cacheStats.cacheSize = totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
    }
  }

  generateTileUrl(style, z, x, y, options = {}) {
    // Use secret token for server-side tile requests
    const secretToken = MAPBOX_CONFIG.SECRET_TOKEN;
    
    // Build the tile URL with secret token
    let url = `https://api.mapbox.com/styles/v1/mapbox/${this.getStyleId(style)}/tiles/${z}/${x}/${y}`;
    
    // Add access token
    const params = new URLSearchParams();
    params.append('access_token', secretToken);
    
    // High DPI support
    if (options.highDPI && window.devicePixelRatio > 1) {
      url += '@2x';
    }
    
    // Format optimization
    if (options.format && options.format === 'webp') {
      params.append('format', 'webp');
    }
    
    // Add cache busting parameter based on week to refresh weekly
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    params.append('v', weekNumber.toString());

    url += '?' + params.toString();
    return url;
  }

  getStyleId(style) {
    const styleMap = {
      'satellite': 'satellite-v9',
      'satellite_streets': 'satellite-streets-v12',
      'streets': 'streets-v12',
      'light': 'light-v11',
      'dark': 'dark-v11',
      'outdoors': 'outdoors-v12'
    };
    return styleMap[style] || 'satellite-streets-v12';
  }

  async getTile(style, z, x, y, options = {}) {
    this.cacheStats.totalRequests++;
    
    const url = this.generateTileUrl(style, z, x, y, options);
    const cacheKey = this.generateCacheKey(style, z, x, y, options);

    try {
      // Try to get from cache first
      const cachedTile = await this.getCachedTile(cacheKey);
      if (cachedTile) {
        this.cacheStats.hits++;
        return cachedTile;
      }

      // If not in cache, fetch from Mapbox
      this.cacheStats.misses++;
      const tile = await this.fetchTileFromMapbox(url);
      
      // Cache the tile for future use
      await this.cacheTile(cacheKey, tile, url);
      
      return tile;
    } catch (error) {
      console.error(`Error getting tile ${style}/${z}/${x}/${y}:`, error);
      throw error;
    }
  }

  generateCacheKey(style, z, x, y, options = {}) {
    const optionsStr = JSON.stringify(options);
    return `mapbox-tile-${style}-${z}-${x}-${y}-${btoa(optionsStr)}`;
  }

  async getCachedTile(cacheKey) {
    try {
      if (this.cache) {
        // Use Cache API
        const response = await this.cache.match(cacheKey);
        if (response) {
          // Check if cache entry is still valid
          const cacheDate = response.headers.get('x-cache-date');
          if (cacheDate) {
            const age = Date.now() - parseInt(cacheDate);
            if (age > this.maxCacheAge) {
              // Cache entry is too old, remove it
              await this.cache.delete(cacheKey);
              return null;
            }
          }
          return response;
        }
      } else if (this.memoryCache) {
        // Use memory cache
        const cached = this.memoryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.maxCacheAge) {
          return cached.data;
        } else if (cached) {
          this.memoryCache.delete(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error getting cached tile:', error);
    }
    return null;
  }

  async fetchTileFromMapbox(url) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'max-age=3600', // Cache for 1 hour
      }
    });

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async cacheTile(cacheKey, response, originalUrl) {
    try {
      // Check cache size before adding new entries
      if (this.cacheStats.cacheSize > this.maxCacheSize) {
        await this.cleanupOldEntries();
      }

      if (this.cache) {
        // Clone response for caching
        const responseToCache = response.clone();
        
        // Add cache metadata
        const headers = new Headers(responseToCache.headers);
        headers.set('x-cache-date', Date.now().toString());
        headers.set('x-original-url', originalUrl);
        
        const cachedResponse = new Response(await responseToCache.blob(), {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });

        await this.cache.put(cacheKey, cachedResponse);
        await this.calculateCacheSize();
      } else if (this.memoryCache) {
        // Store in memory cache
        const blob = await response.clone().blob();
        this.memoryCache.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
          size: blob.size
        });
      }
    } catch (error) {
      console.error('Error caching tile:', error);
    }
  }

  async cleanupOldEntries() {
    try {
      if (this.cache) {
        const keys = await this.cache.keys();
        const now = Date.now();
        let deletedCount = 0;

        for (const request of keys) {
          const response = await this.cache.match(request);
          if (response) {
            const cacheDate = response.headers.get('x-cache-date');
            if (cacheDate) {
              const age = now - parseInt(cacheDate);
              if (age > this.maxCacheAge) {
                await this.cache.delete(request);
                deletedCount++;
              }
            }
          }
        }

        if (deletedCount > 0) {
          console.log(`🧹 Cleaned up ${deletedCount} old cache entries`);
          await this.calculateCacheSize();
        }
      } else if (this.memoryCache) {
        const now = Date.now();
        let deletedCount = 0;

        for (const [key, value] of this.memoryCache.entries()) {
          if (now - value.timestamp > this.maxCacheAge) {
            this.memoryCache.delete(key);
            deletedCount++;
          }
        }

        if (deletedCount > 0) {
          console.log(`🧹 Cleaned up ${deletedCount} old memory cache entries`);
        }
      }
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  startCacheCleanup() {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupOldEntries();
    }, 60 * 60 * 1000);
  }

  async clearCache() {
    try {
      if (this.cache) {
        await caches.delete(this.cacheName);
        this.cache = await caches.open(this.cacheName);
      } else if (this.memoryCache) {
        this.memoryCache.clear();
      }
      
      this.cacheStats = {
        hits: 0,
        misses: 0,
        totalRequests: 0,
        cacheSize: 0
      };
      
      console.log('🗑️ Mapbox cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  getCacheStats() {
    const hitRate = this.cacheStats.totalRequests > 0 
      ? (this.cacheStats.hits / this.cacheStats.totalRequests * 100).toFixed(1)
      : 0;

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      cacheSizeMB: (this.cacheStats.cacheSize / (1024 * 1024)).toFixed(2)
    };
  }

  // Preload tiles for a specific area to improve performance
  async preloadArea(style, bounds, minZoom, maxZoom) {
    console.log(`🚀 Preloading ${style} tiles for area...`);
    
    const tiles = [];
    
    for (let z = minZoom; z <= maxZoom; z++) {
      const minTileX = Math.floor((bounds.west + 180) / 360 * Math.pow(2, z));
      const maxTileX = Math.floor((bounds.east + 180) / 360 * Math.pow(2, z));
      const minTileY = Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
      const maxTileY = Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));

      for (let x = minTileX; x <= maxTileX; x++) {
        for (let y = minTileY; y <= maxTileY; y++) {
          tiles.push({ style, z, x, y });
        }
      }
    }

    // Preload tiles in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batch = tiles.slice(i, i + batchSize);
      await Promise.all(
        batch.map(({ style, z, x, y }) => 
          this.getTile(style, z, x, y).catch(error => 
            console.warn(`Failed to preload tile ${z}/${x}/${y}:`, error)
          )
        )
      );
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Preloaded ${tiles.length} tiles for ${style}`);
  }

  // Preload Nairobi CBD area
  async preloadNairobiCBD(styles = ['satellite_streets'], maxZoom = 16) {
    const nairobiBounds = {
      north: -1.270,
      south: -1.300,
      east: 36.840,
      west: 36.810
    };

    for (const style of styles) {
      await this.preloadArea(style, nairobiBounds, 12, maxZoom);
    }
  }
}

// Create singleton instance
export const mapboxCacheService = new MapboxCacheService();

// Export for advanced usage
export default MapboxCacheService;