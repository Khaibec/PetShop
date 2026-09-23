import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-rating-stars',
  template: `
    <span class="text-warning small me-1">
      <i *ngFor="let star of stars" [class]="star"></i>
    </span>
    <span class="text-muted small">({{ rating | number:'1.1-1' }})</span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingStarsComponent {
  @Input() rating: number = 5;

  get stars(): string[] {
    const list: string[] = [];
    const full = Math.floor(this.rating);
    const half = this.rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= full) {
        list.push('fa-solid fa-star');
      } else if (i === full + 1 && half) {
        list.push('fa-solid fa-star-half-stroke');
      } else {
        list.push('fa-regular fa-star');
      }
    }
    return list;
  }
}
