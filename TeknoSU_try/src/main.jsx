import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ❗️ HATA DÜZELTMESİ: Bu iki satır, aşağıdaki './assets/css/' içindeki
// dosyalarla çakışıyordu ve temanın stillerini bozuyordu.
// O yüzden kaldırıldılar.
// import 'swiper/css';
// import 'bootstrap/dist/css/bootstrap.min.css';

// ❗️ 'beyaz ekran' hatasına neden olan .js dosyası kaldırıldı (bu doğruydu)
// import 'bootstrap/dist/js/bootstrap.min.js'; 


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
import DeliveryList from './shop/DeliveryList.jsx';



const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/blog",
        element: <Blog />
      },
      // ❗️ HATA DÜZELTMESİ: Bu rota, yukarıdaki import'a bağlı olduğu için yorum satırı yapıldı
      // {
      //   path: "/blog/:id",
      //   element: <SingleBlog />
      // },
      {
        path: "/shop",
        element: <Shop />
      },
      {
        path: "/shop/:id",
        element: <SingleProduct />
      },
      {
        path: "/cart-page",
        element: <PrivateRoute><CartPage /></PrivateRoute>
      },
      {
        path: "/deliveries",
        element: (
          <PrivateRoute allowedRoles={["product_manager"]}>
            <DeliveryList />
          </PrivateRoute>
        ),
      },
      {
        path: "/check-out",
        element: <PrivateRoute><CheckoutPage/></PrivateRoute>
      },
      // ❗️ HATA DÜZELTMESİ: Bu rota da, yukarıdaki import'a bağlı olduğu için yorum satırı yapıldı
      // {
      //   path: "/about",
      //   element: <About />
      // },
      // ❗️ HATA DÜZELTMESİ: Bu rota da, yukarıdaki import'a bağlı olduğu için yorum satırı yapıldı
      // {
      //   path: "/contact",
      //   element: <Contact />
      // }
    ]
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "sign-up",
    element: <Signup />
      },
      {
        path: "/review-order",
        element: <ReviewOrderPage />
      },
      {
        path: "/past-orders",
        element: <PastOrders />
      },
  
      {
        path: "/wishlist",
        element:<WishlistPage />
      },
      {
        path: "/products/new",
        element: (
          <PrivateRoute allowedRoles={["product_manager"]}>
            <ProductCreate />
          </PrivateRoute>
        ),
      }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <RouterProvider router= {router} />
  </AuthProvider>,
)
