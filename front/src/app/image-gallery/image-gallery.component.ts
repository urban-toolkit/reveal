import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter, TemplateRef } from '@angular/core';
import { LightGallery } from 'lightgallery/lightgallery';
import lgZoom from 'lightgallery/plugins/zoom';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-image-gallery',
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.css']
})

export class ImageGalleryComponent implements OnInit {
  
  @ViewChild("imageGallery", { static: true }) private imageGalleryDiv!: ElementRef;
  @ViewChild('infoTemplate', { static: true }) private infoTemplate!:TemplateRef<any>;

  @Output() toggleImage = new EventEmitter<any>();
  @Output() gallerySearchSelected = new EventEmitter<any>();
  @Output() dropImage = new EventEmitter<any>();
  @Output() getInfo = new EventEmitter<any>();

  private lightGallery!: LightGallery;
  private needRefresh = false;
  public selectedIndices: number[] = [];
  public selectedImagePaths: string[] = [];
  private allImages: any[] = [];
  public tabsCounter: number = 0;
  public settings = {
    counter: false,
    plugins: [lgZoom, lgThumbnail],
    speed: 500,
    licenseKey: 'DCD313B0-6D77495F-A570ED6F-3C6C65ED'
  };
  public items:any = [];
  public draggedImageUrl: any;
  public modalRef: BsModalRef = new BsModalRef;
  public template: any;
  public info: string = "";
  
  constructor(private modalService: BsModalService) { }

  ngOnInit(): void { }
  
  ngAfterViewInit() {
    this.template = this.infoTemplate;
    document.getElementById("lg-info-1")!.addEventListener("click", () => {
      this.openModal(this.template);
    });
  }

  ngAfterViewChecked(): void {
    if (this.needRefresh) {
      this.lightGallery.refresh();
      this.needRefresh = false;
      const images = document.querySelectorAll('.grid-item img');
      for(let i = 0; i < images.length; i++) { 
        images[i].addEventListener('dragend', (event:any) => {
          this.draggedImageUrl = event.target.src.replace('http://localhost:4200','.')
          this.dropImage.emit(this.draggedImageUrl);
        });
      }
    }
  }

  onInit = (detail:any): void => {
    this.lightGallery = detail.instance;
    const customButtom = '<button type="button" aria-label="Info" id="lg-info-1" class="lg-icon"><i class="fa-solid fa-question fa-xs"></i></button>';
    detail.instance.outer.find('.lg-toolbar').append(customButtom);
  };

  updateImageGallery(data: any) {
    this.allImages = [];
    this.items = [];
    this.selectedIndices = [];
    this.selectedImagePaths = [];

    const similarities = data.similarities;
    const paths = data.labelPaths;
    const ids = data.labels;
    for(let i = 0; i < paths.length; i++) {
      this.allImages.push({
        src: `https://storage.googleapis.com/trabalho_final/dataset/llm/processed/${paths[i]}`,
        thumb: `https://storage.googleapis.com/trabalho_final/dataset/llm/thumbnails/${paths[i]}`, 
        id: ids[i], 
        index: i, 
        width: 80, 
        height: 80, 
        margin: 2,
        border:'none',
        borderColor:'',
        borderWidth:'0px'
      });
    }

    // Show all images instead of slicing to 12
    this.items = this.allImages;

    this.needRefresh = true;
  }

  gallerySearch() {
    if(this.hasSelectedImages()) {
      const imageIndices:any = [];
      const imageLabels:string[] = [];
      for(let i = 0; i < this.selectedIndices.length; i++) {
        imageIndices.push(this.selectedIndices[i]);
        this.allImages.forEach((img: any) => {
          if(this.selectedIndices[i] == img.id) imageLabels.push(img.src);
        })
      };
      this.gallerySearchSelected.emit({"indices": imageIndices, "labels": imageLabels, "queryType": 1});
    }
  }

  onClick(event: any, id: number, index: number) {
    event.preventDefault();
    if(event.ctrlKey) {
      if(!this.selectedIndices.includes(id)) {
        this.selectedIndices.push(id)
        this.selectedImagePaths.push(event.target.currentSrc);
        this.allImages[index].border = 'solid';
        this.allImages[index].borderColor = "#00FF00";
        this.allImages[index].borderWidth = "3px";
      } else {
        const selectedItemIndex = this.selectedIndices.indexOf(id);
        this.selectedIndices.splice(selectedItemIndex, 1);
        const selectedImagePathsIndex = this.selectedImagePaths.indexOf(event.target.currentSrc);
        this.selectedImagePaths.splice(selectedImagePathsIndex, 1);
        this.allImages[index].border = 'none';
        this.allImages[index].borderColor = "";
        this.allImages[index].borderWidth = "0px";
      }
      this.toggleImage.emit({labels: this.selectedIndices, selected: true});
  
      // Update items to reflect changes (now showing all images)
      this.items = this.allImages;

      this.needRefresh = true; 
    }
  }

  selectImages(points: any) {
    this.selectedIndices = [];
    this.selectedImagePaths = [];

    for(let i = 0; i < this.allImages.length; i++) {
      this.allImages[i].border = 'none';
      this.allImages[i].borderColor = "";
      this.allImages[i].borderWidth = "0px";
    }

    for(let i = 0; i < points.length; i++) {
      this.allImages[points[i]].border = 'solid';
      this.allImages[points[i]].borderColor = "#00FF00";
      this.allImages[points[i]].borderWidth = "3px";
      this.selectedIndices.push(this.allImages[points[i]].id);
    }
    this.needRefresh = true; 
  }

  // Keep for backward compatibility but no longer used for pagination
  updateTabCounter(value: number) {
    this.tabsCounter += value;
    // Now showing all images, so just refresh
    this.items = this.allImages;
    this.needRefresh = true;
  }

  hasSelectedImages() {
    return this.selectedIndices.length > 0
  }

  // Keep for backward compatibility
  hasNext() {
    return false;
  }

  // Keep for backward compatibility
  hasPrevious() {
    return false;
  }

  hasImages() {
    return this.items.length > 0;
  }

  clear() {
    this.items = [];
    this.allImages = [];
    this.selectedIndices = [];
    this.selectedImagePaths = [];
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  onAfterSlide = (detail: any): void => {
    const image = document.getElementsByClassName("lg-thumb-item active")[0].children[0] as HTMLImageElement;
    const string = image.src.replace("https://storage.googleapis.com/trabalho_final/dataset/llm/thumbnails/","")
    this.getInfo.emit(string);
  };
}