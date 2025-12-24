import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'



// fonts and icons (Temanın kendi stil dosyaları)
import './assets/css/animate.css';
import './assets/css/bootstrap.min.css'; 
import './assets/css/icofont.min.css';
import './assets/css/swiper.min.css';
import './assets/css/style.min.css';
import './assets/css/magnific-popup.css';

// Orijinal App.css dosyanızın import'u
import './App.css'; 


import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Home from './home/Home.jsx';
import Blog from './blog/Blog.jsx';
import Shop from './shop/Shop.jsx';
import SingleProduct from './shop/SingleProduct.jsx';
import CartPage from './shop/CartPage.jsx';
// ❗️ HATA DÜZELTMESİ: Bu dosya bulunamadığı için yorum satırı yapıldı
// import SingleBlog from './blog/SingleBlog.jsx';
// ❗️ HATA DÜZELTMESİ: Bu dosya da bulunamadığı için yorum satırı yapıldı
// import About from './about/About.jsx';
// ❗️ HATA DÜZELTMESİ: Bu dosya da bulunamadığı için yorum satırı yapıldı
// import Contact from './contactPage/Contact.jsx';
import AuthProvider from './contexts/AuthProvider.jsx';
import PrivateRoute from './PrivateRoute.jsx/PrivateRoute.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import CheckoutPage from './shop/CheckoutPage.jsx';
import ReviewOrderPage from './shop/ReviewOrderPage.jsx';
import PastOrders from './shop/PastOrders.jsx';
import ProductCreate from './shop/ProductCreate.jsx';
import WishlistPage from './shop/WishList.jsx';
import Deliveries from './shop/Deliveries.jsx';
import PendingComments from './shop/PendingComments.jsx';
import CategoryManager from './shop/CategoryManager.jsx';
import Profile from './components/Profile.jsx';
import SupportAgentChatPage from "./support/SupportAgentChatPage.jsx";
import SalesInvoices from './shop/SalesInvoices.jsx';
import RefundRequests from './shop/RefundRequests.jsx';
import DiscountManager from './shop/DiscountManager.jsx';
import Notifications from './shop/Notifications.jsx';



const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/blog", element: <Blog /> },
      // { path: "/blog/:id", element: <SingleBlog /> },
      { path: "/shop", element: <Shop /> },
      { path: "/shop/:id", element: <SingleProduct /> },
      { path: "/cart-page", element: <CartPage /> },
      { path: "/check-out", element: <PrivateRoute><CheckoutPage useModal={false} /></PrivateRoute> },
      // { path: "/about", element: <About /> },
      // { path: "/contact", element: <Contact /> },
      { path: "/wishlist", element: <WishlistPage /> },
      { path: "/past-orders", element: <PastOrders /> },
      { path: "/products/new", element: (
        <PrivateRoute allowedRoles={["product_manager"]}>
          <ProductCreate />
        </PrivateRoute>
      ) },
      { path: "/deliveries", element: (
        <PrivateRoute allowedRoles={["product_manager"]}>
          <Deliveries />
        </PrivateRoute>
      ) },
      { path: "/comments/pending", element: (
        <PrivateRoute allowedRoles={["product_manager"]}>
          <PendingComments />
        </PrivateRoute>
      ) },
      { path: "/categories/manage", element: (
        <PrivateRoute allowedRoles={["product_manager"]}>
          <CategoryManager />
        </PrivateRoute>
      ) },
      { path: "/profile", element: (
        <PrivateRoute allowedRoles={["customer"]}>
          <Profile />
        </PrivateRoute>
      ) },
      { path: "/sales/invoices", element: (
        <PrivateRoute allowedRoles={["sales_manager"]}>
          <SalesInvoices />
        </PrivateRoute>
      ) },
      { path: "/refunds/pending", element: (
        <PrivateRoute allowedRoles={["sales_manager"]}>
          <RefundRequests />
        </PrivateRoute>
      ) },
      { path: "/sales/discounts", element: (
        <PrivateRoute allowedRoles={["sales_manager"]}>
          <DiscountManager />
        </PrivateRoute>
      ) },
      { path: "/notifications", element: (
        <PrivateRoute>
          <Notifications />
        </PrivateRoute>
      ) },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "sign-up", element: <Signup /> },
  { path: "/review-order", element: <ReviewOrderPage /> },
  {
    path: "/support/chat",
    element: (
      <PrivateRoute allowedRoles={["support_agent"]}>
        <SupportAgentChatPage />
      </PrivateRoute>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <RouterProvider router= {router} />
  </AuthProvider>,
)
