import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Rating from "../components/Rating";

import { Swiper, SwiperSlide } from "swiper/react";
// Import Swiper styles
import "swiper/css";

// import required modules
import { Autoplay } from "swiper/modules";
import Review from "../components/Review";
import ProductDisplay from "./ProductDisplay";
import Tags from "./Tags";
const reviwtitle = "Add a Review";
import api from "../api/client";
import { AuthContext } from "../contexts/AuthProvider";

const SingleProduct = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { id } = useParams();
  useEffect(() => {
    let mounted = true;
    api
      .get(`/api/products/${id}`)
      .then((res) => {
        if (!mounted) return;
        setProduct(res.data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Product could not be loaded");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this product? This action cannot be undone.")) return;
    try {
      const res = await api.delete(`/api/products/${id}`, { validateStatus: () => true });
      if (res.status === 200) {
        alert("Product deleted.");
        navigate("/shop");
      } else {
        setError(res.data?.message || "Failed to delete product");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete product");
    }
  };


  const result = product ? [product] : [];
  return (
    
    <div>
      <PageHeader title={"OUR SHOP SINGLE"} curPage={"Shop / Single Product"} />
      <div className="shop-single padding-tb aside-bg">
        <div className="container">
          {loading && <p>Loading product...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div className="row justify-content-center">
            <div className="col-lg-8 col-12">
              <article>
                <div className="product-details">
                  <div className="row align-items-center">
                    <div className="col-md-6 col-12">
                      <div className="product-thumb">
                        <div className="swiper-container pro-single-top">
                          <Swiper
                            spaceBetween={30}
                            slidesPerView={1}
                            loop={"true"}
                            autoplay={{
                              delay: 2000,
                              disableOnInteraction: false,
                            }}
                            modules={[Autoplay]}
                            navigation={{
                              prevEl: ".pro-single-prev",
                              nextEl: ".pro-single-next",
                            }}
                          >
                            {result.map((item, i) => (
                              <SwiperSlide key={i}>
                                <div className="single-thumb">
                                  <img src={item.img || item.imageURL} alt={item.name} />
                                </div>
                              </SwiperSlide>
                            ))}
                          </Swiper>
                          <div className="pro-single-next">
                            <i className="icofont-rounded-left"></i>
                          </div>
                          <div className="pro-single-prev">
                            <i className="icofont-rounded-right"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 col-12">
                      <div className="post-content">
                        <div>
                          {
                            result.map(item => <ProductDisplay item={item} key={item.id}/>)
                          }
                          {user?.role === "product_manager" && (
                            <button className="lab-btn bg-danger mt-3" onClick={handleDelete}>
                              <span>Delete Product</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="review">
                  <Review />
                </div>
              </article>
            </div>
            <div className="col-lg-4 col-md-7 col-12">
              <aside className="ps-lg-4">
                <Tags/>

              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProduct;
