import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) private mapContainer!: ElementRef;

  private map!: mapboxgl.Map;
  private accessToken = 'pk.eyJ1IjoibGVvdnNmIiwiYSI6ImNqZDI0NjFmajBwaWwycXBheDg1NHFiczEifQ.7oGXJmnvyx-9ahJw4n9VSg';
  private style = 'mapbox://styles/leovsf/cmi7uzuzt002e01qmdkd15it1';
  private mapInitialized = false;
  public hasData = false;
  private pendingInit = false;

  private selectionMarkers: mapboxgl.Marker[] = [];

  private heatmapData: any = null;
  private locationIndexMap: Map<number, { lon: number, lat: number }> = new Map();

  constructor() { }

  ngOnInit(): void {
    (mapboxgl as any).accessToken = this.accessToken;
  }

  ngAfterViewInit(): void {
    if (this.pendingInit) {
      setTimeout(() => this.initializeMap(), 0);
    }
  }

  private initializeMap(): void {
    if (this.mapInitialized) return;
    
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      this.pendingInit = true;
      return;
    }
    
    const container = this.mapContainer.nativeElement;
    if (container.offsetHeight === 0 || container.offsetWidth === 0) {
      console.warn('Map container has no dimensions, retrying...');
      setTimeout(() => this.initializeMap(), 100);
      return;
    }
    
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: this.style,
      center: [-87.6298, 41.8781],
      zoom: 10,
      attributionControl: false,
      interactive: true,
      scrollZoom: true,
      boxZoom: true,
      dragRotate: true,
      dragPan: true,
      keyboard: true,
      doubleClickZoom: true,
      touchZoomRotate: true,
      touchPitch: true,
      projection: "mercator"
    });

    this.map.on('load', () => {
      const logo = this.mapContainer.nativeElement.querySelector('.mapboxgl-ctrl-logo');
      if (logo) {
        (logo as HTMLElement).style.display = 'none';
      }
      
      this.map.resize();
      
      if (this.heatmapData) {
        this.addHeatmapLayer();
      }
    });

    this.mapInitialized = true;
    this.pendingInit = false;
  }

  public loadMap(centerLng?: number, centerLat?: number, zoom?: number): void {
    this.hasData = true;
    this.clearSelectionMarkers();
    
    setTimeout(() => {
      if (!this.mapInitialized) {
        this.initializeMap();
      }
      
      setTimeout(() => {
        if (this.mapInitialized) {
          this.map.resize();
          
          if (centerLng !== undefined && centerLat !== undefined) {
            this.map.setCenter([centerLng, centerLat]);
            if (zoom !== undefined) {
              this.map.setZoom(zoom);
            }
          }
        }
      }, 100);
    }, 100);
  }

  public clear(): void {
    this.hasData = false;
    this.clearSelectionMarkers();
    this.clearHeatmap();
    this.locationIndexMap.clear();
  }

  public loadHeatmapData(locations: any[], imageLabels: any[]): void {
    this.locationIndexMap.clear();
    locations.forEach((loc, index) => {
      this.locationIndexMap.set(imageLabels[index], { lon: loc.lon, lat: loc.lat });
    });
    
    const features = locations.map(loc => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [loc.lon, loc.lat]
      },
      properties: {
        weight: 1
      }
    }));

    this.heatmapData = {
      type: 'FeatureCollection',
      features: features
    };
    
    const centerLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
    const centerLon = locations.reduce((sum, loc) => sum + loc.lon, 0) / locations.length;
    
    this.loadMap(centerLon, centerLat, 10);
    
    if (this.mapInitialized && this.map.isStyleLoaded()) {
      this.addHeatmapLayer();
    }
  }

  private addHeatmapLayer(): void {
    if (!this.heatmapData || !this.mapInitialized) return;

    if (this.map.getLayer('heatmap-layer')) {
      this.map.removeLayer('heatmap-layer');
    }
    if (this.map.getLayer('heatmap-point')) {
      this.map.removeLayer('heatmap-point');
    }
    if (this.map.getSource('heatmap-source')) {
      this.map.removeSource('heatmap-source');
    }

    this.map.addSource('heatmap-source', {
      type: 'geojson',
      data: this.heatmapData
    });

    this.map.addLayer({
      id: 'heatmap-layer',
      type: 'heatmap',
      source: 'heatmap-source',
      maxzoom: 15,
      paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          1,
          15,
          3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(255, 245, 240, 0)',
          0.2,
          'rgb(254, 224, 210)',
          0.4,
          'rgb(252, 187, 161)',
          0.6,
          'rgb(252, 146, 114)',
          0.8,
          'rgb(251, 106, 74)',
          1,
          'rgb(203, 24, 29)'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          2,
          15,
          30
        ],
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12,
          1,
          15,
          0.5
        ]
      }
    });

    this.map.addLayer({
      id: 'heatmap-point',
      type: 'circle',
      source: 'heatmap-source',
      minzoom: 12,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12,
          2,
          18,
          6
        ],
        'circle-color': 'rgb(203, 24, 29)',
        'circle-stroke-color': 'white',
        'circle-stroke-width': 1,
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12,
          0,
          13,
          0.8
        ]
      }
    });
  }

  private clearHeatmap(): void {
    if (!this.mapInitialized) return;

    if (this.map.getLayer('heatmap-layer')) {
      this.map.removeLayer('heatmap-layer');
    }
    if (this.map.getLayer('heatmap-point')) {
      this.map.removeLayer('heatmap-point');
    }
    if (this.map.getSource('heatmap-source')) {
      this.map.removeSource('heatmap-source');
    }
    
    this.heatmapData = null;
  }

  public toggleSelectionMarker(imageIndex: any, show: boolean): void {
    this.clearSelectionMarkers();

    if (!show || !imageIndex || !imageIndex.labels) return;

    console.log("HEYA", imageIndex);

    for (let i = 0; i < imageIndex.labels.length; i++) {
      const label = imageIndex.labels[i];
      const location = this.locationIndexMap.get(label);

      if (!location) {
        console.warn(`No location data for image index ${label}`);
        continue;
      }

      this.addSelectionMarker(location.lon, location.lat, label);
    }
  }

  private addSelectionMarker(lng: number, lat: number, imageIndex: number): void {
    if (!this.mapInitialized) {
      setTimeout(() => {
        this.initializeMap();
        setTimeout(() => this.addSelectionMarker(lng, lat, imageIndex), 100);
      }, 100);
      return;
    }

    const marker = new mapboxgl.Marker({
      color: '#97a97c',
      scale: 1.2
    })
      .setLngLat([lng, lat])
      .addTo(this.map);

    const popupContent = `https://storage.googleapis.com/trabalho_final/dataset/llm/processed/${imageIndex}.jpg`;
    const popup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: false
    })
      .setHTML(`<img src="${popupContent}" style="width: 190px; height: 190px;"></img>`);
    
    marker.setPopup(popup);

    this.selectionMarkers.push(marker);
  }

  public clearSelectionMarkers(): void {
    if (!this.selectionMarkers.length) return;

    this.selectionMarkers.forEach(marker => marker.remove());
    this.selectionMarkers = [];
  }

  flyTo(lng: number, lat: number, zoom: number = 12): void {
    if (!this.mapInitialized) {
      setTimeout(() => {
        this.initializeMap();
        setTimeout(() => this.flyTo(lng, lat, zoom), 100);
      }, 100);
      return;
    }
    
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      essential: true
    });
  }

  getCenter(): [number, number] {
    if (!this.mapInitialized) return [-87.6298, 41.8781];
    const center = this.map.getCenter();
    return [center.lng, center.lat];
  }

  getZoom(): number {
    if (!this.mapInitialized) return 10;
    return this.map.getZoom();
  }
}
