@startuml
title 3D-Marketplace - Activity Diagram (Core flows)
start
:Open site;
  if ("Are you a Seller / Admin / Customer?") then (Seller)
    :Seller login;
    if ("Valid?") then (yes)
      :View Dashboard;
      :Manage Catalog & Orders;
    else (no)
      :Show login error;
      stop
    endif
  elseif (Admin)
    :Admin login;
    if ("Valid?") then (yes)
      :Admin Dashboard;
      :Approve Sellers / Products;
    else (no)
      :Show login error;
      stop
    endif
  else (Customer)
    :Browse products;
    :View product details;
  endif

:Select product(s);
:Check availability;
if (In stock?) then (yes)
  :Add to cart;
else (no)
  :Notify out of stock;
  stop
endif

:Go to cart;
if (Cart action?) then (update)
  :Update quantities / remove items;
endif

:Proceed to checkout;
:Choose shipping address;
:Choose payment method;

:Submit payment;
:Process payment;
if (Payment success?) then (yes)
  :Create order record;
  :Reserve stock;
  :Send confirmation;
else (no)
  :Show payment failed;
  stop
endif

if (Order placed?) then (yes)
  :Processing order (pack);
  :Ship order;
  :Update order status to shipped;
  :Deliver order;
  if (Return requested?) then (yes)
    :Create return request;
    :Process refund;
  endif
else (no)
  stop
endif

stop
@enduml