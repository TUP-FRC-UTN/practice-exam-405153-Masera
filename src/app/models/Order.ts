import { Product } from "./Product";

export interface Order{
    id?: number;
    customerName: string;
    email: string;
    products: Product[];
    total: number;
    orderCode?: string;
    timestamp?: string;
}
