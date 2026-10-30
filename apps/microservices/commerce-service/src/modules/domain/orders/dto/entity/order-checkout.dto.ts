// Who is paying for a checkout, as the orders and the payment gateway's page show them
export interface CheckoutCustomerDto {
  name: string | null;
  phone: string | null;
  email: string | null;
}
