@startuml
' Simple object diagram for 3D-Marketplace
object User1 {
  id = "u01234"
  name = "Alice"
  email = "alice@example.com"
}
object Address1 {
  id = "addr00001"
  userId = "u01234"
  city = "Seattle"
}
object Product1 {
  id = "p1001"
  name = "Gold Ring"
  making_price = 50.00
}
object Variant1 {
  variant_id = "var_1001_a"
  product_id = "p1001"
  making_price = 60.00
}
object Cart1 {
  id = 1
  user_id = "u01234"
}
object CartItem1 {
  id = 1
  cart_id = 1
  product_id = "p1001"
  variant_id = "var_1001_a"
  quantity = 1
}
object Order1 {
  id = 2001
  order_id = "ORD-2025-0001"
  user_id = "u01234"
  total_price = 150.00
}
object Payment1 {
  id = 3001
  order_id = 2001
  method = "stripe"
  status = "completed"
}

User1 -- Address1
User1 -- Cart1
Cart1 -- CartItem1
CartItem1 -- Product1
CartItem1 -- Variant1
User1 -- Order1
Order1 -- Payment1
Order1 -- CartItem1

@enduml
