import React, { useState } from "react";
import "./PastOrders.css";

const PastOrders = () => {
  const [orders] = useState([
    {
      id: "ORD-54321",
      date: "2025-01-19",
      total: 149.99,
      status: "Delivered",
      items: [
        { name: "Wireless Headphones", qty: 1, price: 89.99, img: "/img/a1.jpg" },
        { name: "USB-C Charger", qty: 2, price: 30.00, img: "/img/a2.jpg" }
      ]
    },

    {
      id: "ORD-88432",
      date: "2025-01-08",
      total: 59.49,
      status: "Delivered",
      items: [
        { name: "Sports Water Bottle", qty: 1, price: 19.49, img: "/img/p1.jpg" },
        { name: "Compression Socks", qty: 1, price: 40.00, img: "/img/p2.jpg" }
      ]
    }
  ]);

  const [openOrder, setOpenOrder] = useState(null);

  const toggleOrder = (id) => {
    setOpenOrder(openOrder === id ? null : id);
  };

  return (
    <div className="orders-container">
      <h1 className="orders-title">Past Orders</h1>

      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-summary" onClick={() => toggleOrder(order.id)}>
            <div>
              <h3>Order {order.id}</h3>
              <p>Date: {order.date}</p>
              <p>Status: {order.status}</p>
            </div>
            <div className="order-total">
              <h3>${order.total.toFixed(2)}</h3>
              <span className="toggle-btn">
                {openOrder === order.id ? "▲" : "▼"}
              </span>
            </div>
          </div>

          {openOrder === order.id && (
            <div className="order-details">
              {order.items.map((item, index) => (
                <div className="order-item" key={index}>
                  <img src={item.img} alt={item.name} />
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>Quantity: {item.qty}</p>
                    <p>Price: ${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PastOrders;
