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
  private markers: mapboxgl.Marker[] = [];

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
        logo.style.display = 'none';
      }
      
      this.map.resize();
    });

    this.mapInitialized = true;
    this.pendingInit = false;
  }

  public loadMap(centerLng?: number, centerLat?: number, zoom?: number): void {
    this.hasData = true;
    this.clearMarkers();
    
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
    this.clearMarkers();
  }

  addMarker(lng: number, lat: number, popupContent?: string): void {
    console.log(lat,lng)
    if (!this.mapInitialized) {
      setTimeout(() => {
        this.initializeMap();
        setTimeout(() => this.addMarker(lng, lat, popupContent), 100);
      }, 100);
      return;
    }

    const marker = new mapboxgl.Marker({
      color: '#97a97c'
    })
      .setLngLat([lng, lat])
      .addTo(this.map);

    if (popupContent) {
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false
      })
        .setHTML(`<img src="${popupContent}" style="width: 190px; height: 190px;"></img>`);
      marker.setPopup(popup);
    }

    this.markers.push(marker);
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
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

  fitToMarkers(): void {
    if (!this.mapInitialized || this.markers.length === 0) return;
    
    const bounds = new mapboxgl.LngLatBounds();
    this.markers.forEach(marker => {
      bounds.extend(marker.getLngLat());
    });
    
    this.map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    });
  }
}