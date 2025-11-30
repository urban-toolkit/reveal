import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PolygonFilterService {

  constructor() { }

  public filterImagesByPolygons(images: any, polygons: any[]): any {
    if (!polygons || polygons.length === 0) {
      return images;
    }

    const filteredIndices: number[] = [];
    const filteredImageIds: number[] = [];
    const filteredSimilarities: number[] = [];
    const filteredProjections: number[][] = [];
    const filteredLabelPaths: string[][] = [];
    const filteredTextIds: any[] = [];
    const filteredLocations: any[] = [];

    images.labels.forEach((imageId: number, index: number) => {
      const location = images.locations[index];
      
      if (!location || location.lat === null || location.lon === null) {
        return;
      }

      const point = [location.lon, location.lat];
      
      if (this.isPointInAnyPolygon(point, polygons)) {
        filteredIndices.push(index);
        filteredImageIds.push(imageId);
        filteredSimilarities.push(images.similarities[index]);
        filteredProjections.push(images.projection[index]);
        filteredLabelPaths.push(images.labelPaths[index]);
        filteredTextIds.push(images.textIds[index]);
        filteredLocations.push(location);
      }
    });

    return {
      similarities: filteredSimilarities,
      labels: filteredImageIds,
      projection: filteredProjections,
      labelPaths: filteredLabelPaths,
      numberOfImages: filteredImageIds.length,
      textIds: filteredTextIds,
      locations: filteredLocations,
      similarityValue: images.similarityValue
    };
  }

  public filterTextsByImages(texts: any, filteredImageIds: number[]): any {
    if (!filteredImageIds || filteredImageIds.length === 0) {
      return {
        similarities: [],
        labels: [],
        labelNames: [],
        numberOfTexts: 0,
        projection: [],
        imageIds: [],
        imageIndices: [],
        similarityValue: texts.similarityValue
      };
    }

    const filteredSimilarities: number[] = [];
    const filteredLabels: number[] = [];
    const filteredLabelNames: string[][] = [];
    const filteredProjections: number[][] = [];
    const filteredTextImageIds: any[] = []; 

    texts.labels.forEach((textId: number, index: number) => {
      const textImageIds = texts.imageIds[index];
      
      if (textImageIds && Array.isArray(textImageIds)) {
        const hasMatchingImage = textImageIds.some((imgId: number) => 
          filteredImageIds.includes(imgId)
        );
        
        if (hasMatchingImage) {
          filteredSimilarities.push(texts.similarities[index]);
          filteredLabels.push(textId);
          filteredLabelNames.push(texts.labelNames[index]);
          filteredProjections.push(texts.projection[index]);
          
          const matchingImageIds = textImageIds.filter((imgId: number) => 
            filteredImageIds.includes(imgId)
          );
          filteredTextImageIds.push(matchingImageIds);
        }
      }
    });

    return {
      similarities: filteredSimilarities,
      labels: filteredLabels,
      labelNames: filteredLabelNames,
      numberOfTexts: filteredLabels.length,
      projection: filteredProjections,
      imageIds: filteredTextImageIds,
      imageIndices: filteredTextImageIds.flat().filter((v: number, i: number, a: number[]) => a.indexOf(v) === i),
      similarityValue: texts.similarityValue
    };
  }

  private isPointInAnyPolygon(point: number[], polygons: any[]): boolean {
    return polygons.some(polygon => {
      if (polygon.geometry && polygon.geometry.type === 'Polygon') {
        return this.isPointInPolygon(point, polygon.geometry.coordinates[0]);
      }
      return false;
    });
  }

  private isPointInPolygon(point: number[], polygonCoords: number[][]): boolean {
    const x = point[0];
    const y = point[1];
    let inside = false;

    for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
      const xi = polygonCoords[i][0];
      const yi = polygonCoords[i][1];
      const xj = polygonCoords[j][0];
      const yj = polygonCoords[j][1];

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  public applyPolygonFilter(response: any, polygons: any[]): any {
    if (!polygons || polygons.length === 0) {
      return response;
    }

    console.log(`Applying polygon filter with ${polygons.length} polygon(s)`);

    const filteredImages = this.filterImagesByPolygons(response.images, polygons);
    
    const filteredTexts = this.filterTextsByImages(response.texts, filteredImages.labels);

    console.log(`Filtered results: ${filteredImages.numberOfImages} images, ${filteredTexts.numberOfTexts} texts`);

    return {
      images: filteredImages,
      texts: filteredTexts
    };
  }
}