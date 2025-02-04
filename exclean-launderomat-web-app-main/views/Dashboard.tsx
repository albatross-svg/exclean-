"use client";

import React, { useState, useEffect } from "react";
import "./view.css";
import SideButton, { SideButtonProps } from "@/components/shared/SideButton";
import Order from "@/public/assets/icons/order.png";
import Payment from "@/public/assets/icons/payment.png";
import Inventory from "@/public/assets/icons/product.png";
import { CreateOrderParams, Order as OrderType } from "@/types";
import {
  getUserRole,
  getUserById,
  getUserByEmail,
} from "@/lib/actions/user.action";
import { useAuth, useUser } from "@clerk/nextjs";
import { createOrder, getUserOrders } from "@/lib/actions/order.action";
import CustomerOrderForm from "@/components/shared/CustomerOrderForm";
import AdminOrders from "@/components/shared/AdminOrders";
import AdminInventory from "@/components/shared/AdminInventory";
import AdminPayments from "@/components/shared/AdminPayments";
import CustomerOrderPreview from "@/components/shared/CustomerOrderPreview";
import CustomerPaymentForm from "@/components/shared/CustomerPaymentForm";
import { uploadPayment } from "@/lib/actions/payment.action";

// Array of side button data for customers
const customerButtons: SideButtonProps[] = [
  {
    name: "Order",
    iconUrl: Order,
    variant: "not-selected",
  },
  {
    name: "Payment",
    iconUrl: Payment,
    variant: "not-selected",
  },
];

// Array of side button data for admins
const adminButtons: SideButtonProps[] = [
  {
    name: "Order",
    iconUrl: Order,
    variant: "not-selected",
  },
  {
    name: "Payment",
    iconUrl: Payment,
    variant: "not-selected",
  },
  {
    name: "Inventory",
    iconUrl: Inventory,
    variant: "not-selected",
  },
];

const Dashboard: React.FC = () => {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  const [view, setView] = useState<"customer" | "admin">("customer");
  const [selectedBar, setSelectedBar] = useState<string>("Order");
  const [orders, setOrders] = useState<CreateOrderParams[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<OrderType[]>([]);

  // Validate order status helper
  const validateOrderStatus = (status: string) => {
    const validStatuses = ["pending", "processing", "completed"];
    return validStatuses.includes(status) ? status : "pending";
  };

  // Fetch user role and orders
  useEffect(() => {
    const fetchUserRole = async () => {
      if (userId) {
        const role = await getUserRole(userId);
        setUserRole(role);
        setView(role === "admin" ? "admin" : "customer");
      }
    };

    const fetchUserOrders = async () => {
      if (userId) {
        try {
          const orders = await getUserOrders(userId);
          setUserOrders(orders as unknown as OrderType[]);
        } catch (error) {
          console.error("Failed to fetch user orders:", error);
        }
      }
    };

    if (isLoaded && userId) {
      fetchUserRole();
      fetchUserOrders();
    }
  }, [isLoaded, userId]);

  // Handle loading state
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Handle order creation
  const handleOrderRequest = async (order: CreateOrderParams) => {
    try {
      const createdOrder = await createOrder(order);
      if (!("_id" in createdOrder)) {
        throw new Error("Created order does not have an _id");
      }

      const orderWithId = { ...order, _id: createdOrder._id };
      setOrders((prevOrders) => [...prevOrders, orderWithId]);
      alert("Order created successfully!");
    } catch (error) {
      console.error("Failed to create order:", error);
      alert(
        `Failed to create order: ${
          error instanceof Error ? error.message : "An unknown error occurred"
        }`
      );
    }
  };

  // Toggle bar selection
  const handleToggleClick = (name: string) => {
    setSelectedBar(name);
  };

  // User greeting
  const userName = user?.firstName || "User";

  const handleViewDetails = (orderId: string) => {
    // Implement the logic to view order details
    console.log(`Viewing details for order: ${orderId}`);
    // You might want to navigate to a details page or open a modal here
  };

  const handlePaymentUpload = async (paymentData: any) => {
    try {
      const result = await uploadPayment(paymentData);
      if ("success" in result && result.success) {
        alert("Payment uploaded successfully!");
        // Optionally, you can update the local state or refetch payment history here
      } else {
        throw new Error(
          "error" in result && typeof result.error === "string"
            ? result.error
            : "Failed to upload payment"
        );
      }
    } catch (error) {
      console.error("Failed to upload payment:", error);
      alert(
        `Failed to upload payment: ${
          error instanceof Error ? error.message : "An unknown error occurred"
        }`
      );
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="word text-indigo-600 font-bold text-xl sm:text-2xl mb-4">
        {userName}'s Dashboard
      </h1>
      <section className="bg-black section sm:flex-row">
        <div className="flex flex-col sm:flex-row">
          {/* Sidebar buttons - horizontal on mobile, vertical on larger screens */}
          <div className="button flex flex-row sm:flex-col mb-4 sm:mb-0 sm:w-1/4">
            {(view === "customer" ? customerButtons : adminButtons).map(
              (side, index) => (
                <SideButton
                  key={index}
                  name={side.name}
                  iconUrl={side.iconUrl}
                  variant={
                    selectedBar === side.name ? "selected" : "not-selected"
                  }
                  onClick={() => handleToggleClick(side.name)}
                />
              )
            )}
          </div>
          {/* Main content area */}
          <div className="dashboard mx-2 sm:p-4 w-full sm:w-3/4">
            {selectedBar === "Order" && view === "customer" && (
              <div className="w-full flex sm:flex-col p-2 lg:flex-row gap-4">
                <div className="w-full lg:w-1/2">
                  <CustomerOrderForm handleOrderRequest={handleOrderRequest} />
                </div>
                <div className="w-full lg:w-1/2 lg:mt-0">
                  {userOrders.length > 0 ? (
                    <CustomerOrderPreview />
                  ) : (
                    <p className="text-center text-gray-500">
                      No orders available
                    </p>
                  )}
                </div>
              </div>
            )}
            {selectedBar === "Payment" && view === "customer" && (
              <div className="w-full flex sm:flex-col p-2 lg:flex-row gap-4">
                <div className="w-full lg:w-1/2">
                  <CustomerPaymentForm
                    handlePaymentUpload={handlePaymentUpload}
                  />
                </div>
                <div className="w-full lg:w-1/2 lg:mt-0">
                  <h2 className="text-lg font-semibold mb-2">
                    Payment History
                  </h2>
                  <p className="text-gray-500">
                    Your payment history will appear here.
                  </p>
                </div>
              </div>
            )}
            {selectedBar === "Order" && view === "admin" && <AdminOrders />}
            {selectedBar === "Payment" && view === "admin" && <AdminPayments />}
            {selectedBar === "Inventory" && view === "admin" && (
              <AdminInventory />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
