import { Injectable } from '@angular/core';
import { BOB, BULLET, FOOD, FROM_TOP, FROM_RIGHT, FROM_BOTTOM, FROM_LEFT } from '../../shared/game';
const {assign} = Object;

export const TYPE = {
  [BOB]: 'bob',
  [BULLET]: 'bullet',
  [FOOD]: 'food'
};

export const SOURCE = {
  [FROM_TOP]: 'from-top',
  [FROM_RIGHT]: 'from-right',
  [FROM_BOTTOM]: 'from-bottom',
  [FROM_LEFT]: 'from-left'
};

export const CANVAS_SIZE = 1000; // px

@Injectable()
export class BattlefieldService {
  private loaded: Promise<void>;
  private images;
  private imageData;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = CANVAS_SIZE;
    this.offscreenCanvas.height = CANVAS_SIZE;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
  }

  loadImages() {
    if (this.loaded) { return this.loaded; }
    this.loaded = Promise.all([
        'bullet-from-top',
        'bullet-from-right',
        'bullet-from-bottom',
        'bullet-from-left',
        'food-from-top',
        'food-from-right',
        'food-from-bottom',
        'food-from-left',
        'bob'
      ]
      .map(name => new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve({name, image});
        image.src = `images/${name}.png`;
      }))
    ).then(images => {
      this.images = images.reduce(
        (res, {name, image}) => assign({}, res, {[name]: image}), {}
      );
      this.imageData = images
        .map(({name, image}) =>
          (name === 'bob' ? [6] : [2, 4, 6])
            .map(size => ({size, imageData: this.makeImageData(image, size)}))
            .reduce(
              (result, {size, imageData}) =>
                assign({}, result, {[`${name}-${size}`]: imageData}),
              {}
            )
        )
        .reduce((result, imageDatas) => assign({}, result, imageDatas));
    });
    return this.loaded;
  }

  getImageName(type, source) {
    return type === BOB ? TYPE[BOB] : `${TYPE[type]}-${SOURCE[source]}`;
  }

  getImageData(type, source, size) {
    const imageName = this.getImageName(type, source);
    const imageDataId = `${imageName}-${size}`;
    if (!this.imageData[imageDataId]) {
      const image = this.images[imageName];
      this.imageData[imageDataId] = this.makeImageData(image, size);
    }
    return this.imageData[imageDataId];
  }

  makeImageData(image, size) {
    const w = Math.round(size / 100 * CANVAS_SIZE);
    const h = Math.round(size / 100 * CANVAS_SIZE);
    this.offscreenCtx.clearRect(0, 0, w, h);
    this.offscreenCtx.drawImage(image, 0, 0, w, h);
    return this.offscreenCtx.getImageData(0, 0, w, h);
  }
}
