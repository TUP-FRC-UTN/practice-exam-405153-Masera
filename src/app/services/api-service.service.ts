import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Order } from './../models/Order';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:3000';

  constructor() { }

  getAllProducts() :Observable<Product[]> {
    return this.http.get<Product[]>(`${this.url}/products`);
  }

  getAllOrders() :Observable<Order[]>{
    return this.http.get<Order[]>(`${this.url}/orders`);
  }

  getOrdersByEmail(email: string):Observable<Order[]>{
    return this.http.get<Order[]>(`${this.url}/orders?email=${email}`);
  }

  postOrder(order: Order) :Observable<Order>{
    return this.http.post<Order>(`${this.url}/orders`, order);
  }
}
