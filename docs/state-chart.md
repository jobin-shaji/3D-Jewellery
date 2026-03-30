@startuml
title Order Flow - Simplified

[*] --> Cart
Cart --> PendingPayment : checkout
PendingPayment --> Processing : payment_success
PendingPayment --> Cancelled : payment_failed
Processing --> Shipped : pack_and_ship
Shipped --> Delivered : confirm_delivery
Shipped --> Returned : return_initiated
Returned --> Refunded : refund_processed

Cancelled --> [*]
Delivered --> [*]
Refunded --> [*]

@enduml
