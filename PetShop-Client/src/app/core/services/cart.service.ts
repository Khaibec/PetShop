import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject: BehaviorSubject<CartItem[]>;
  public items$: Observable<CartItem[]>;

  constructor() {
    const savedCart = localStorage.getItem('petshop_cart');
    this.cartItemsSubject = new BehaviorSubject<CartItem[]>(
      savedCart ? JSON.parse(savedCart) : []
    );
    this.items$ = this.cartItemsSubject.asObservable();
  }

  public get items(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  public get itemCount$(): Observable<number> {
    return this.items$.pipe(
      map(items => items.reduce((sum, item) => sum + item.quantity, 0))
    );
  }

  public get totalAmount$(): Observable<number> {
    return this.items$.pipe(
      map(items => items.reduce((sum, item) => sum + (item.price * item.quantity), 0))
    );
  }

  addToCart(item: CartItem): void {
    const current = [...this.items];
    const index = current.findIndex(i => i.id === item.id);

    if (index > -1) {
      if (item.itemType === 'Product') {
        const newQty = current[index].quantity + item.quantity;
        const maxStock = current[index].stock ?? 99;
        current[index].quantity = Math.min(newQty, maxStock);
      }
      // Thú cưng là cá thể độc nhất, số lượng luôn là 1
    } else {
      current.push(item);
    }

    this.saveCart(current);
  }

  updateQuantity(id: string, quantity: number): void {
    const current = [...this.items];
    const index = current.findIndex(i => i.id === id);

    if (index > -1) {
      if (quantity <= 0) {
        current.splice(index, 1);
      } else {
        const maxStock = current[index].stock ?? 99;
        current[index].quantity = Math.min(quantity, maxStock);
      }
      this.saveCart(current);
    }
  }

  removeFromCart(id: string): void {
    const current = this.items.filter(i => i.id !== id);
    this.saveCart(current);
  }

  clearCart(): void {
    this.saveCart([]);
  }

  private saveCart(items: CartItem[]): void {
    localStorage.setItem('petshop_cart', JSON.stringify(items));
    this.cartItemsSubject.next(items);
  }
}
