import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    <nav *ngIf="totalPages > 1" class="d-flex justify-content-center my-4" aria-label="Phân trang">
      <ul class="pagination pagination-sm shadow-sm">
        <li class="page-item" [class.disabled]="pageNumber <= 1">
          <button class="page-link" (click)="onPageChange(pageNumber - 1)" [disabled]="pageNumber <= 1">
            <i class="fa-solid fa-chevron-left me-1"></i> Trước
          </button>
        </li>

        <li *ngFor="let page of pages; trackBy: trackByPage" class="page-item" [class.active]="page === pageNumber">
          <button class="page-link" (click)="onPageChange(page)">{{ page }}</button>
        </li>

        <li class="page-item" [class.disabled]="pageNumber >= totalPages">
          <button class="page-link" (click)="onPageChange(pageNumber + 1)" [disabled]="pageNumber >= totalPages">
            Sau <i class="fa-solid fa-chevron-right ms-1"></i>
          </button>
        </li>
      </ul>
    </nav>
  `,
  styles: [`
    .page-item.active .page-link {
      background-color: #ff5722;
      border-color: #ff5722;
      color: #fff;
    }
    .page-link {
      color: #333;
      padding: 8px 14px;
      font-weight: 500;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() pageNumber: number = 1;
  @Input() totalPages: number = 1;
  @Output() pageChanged = new EventEmitter<number>();

  get pages(): number[] {
    const list: number[] = [];
    const start = Math.max(1, this.pageNumber - 2);
    const end = Math.min(this.totalPages, this.pageNumber + 2);
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.pageNumber) {
      this.pageChanged.emit(page);
    }
  }

  trackByPage(index: number, page: number): number {
    return page;
  }
}
