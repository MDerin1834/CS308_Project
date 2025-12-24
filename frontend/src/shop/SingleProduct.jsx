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
import api from "../api/client";
import { AuthContext } from "../contexts/AuthProvider";

const SingleProduct = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [stockValue, setStockValue] = useState("");
  const [stockUpdating, setStockUpdating] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const { id } = useParams();
  useEffect(() => {
    let mounted = true;
    api
      .get(`/api/products/${id}`)
      .then((res) => {
        if (!mounted) return;
        setProduct(res.data);
        setStockValue(res.data?.stock ?? 0);
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

  useEffect(() => {
    if (!user) {
      setCanReview(false);
      return;
    }
    api
      .get("/api/orders/my-orders", { validateStatus: () => true })
      .then((res) => {
        if (res.status === 200 && Array.isArray(res.data?.orders)) {
          const delivered = res.data.orders.some(
            (o) =>
              o.status === "delivered" &&
              Array.isArray(o.items) &&
              o.items.some((it) => it.productId === id)
          );
          setCanReview(delivered);
        }
      })
      .catch(() => setCanReview(false));
  }, [user, id]);

  useEffect(() => {
    let mounted = true;
    setCommentsLoading(true);
    setCommentsError("");
    api
      .get(`/api/comments/product/${id}`, { validateStatus: () => true })
      .then((res) => {
        if (!mounted) return;
        if (res.status === 200 && Array.isArray(res.data?.comments)) {
          setComments(res.data.comments);
        } else {
          setCommentsError(res.data?.message || "Failed to load comments");
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setCommentsError(err?.response?.data?.message || "Failed to load comments");
      })
      .finally(() => mounted && setCommentsLoading(false));

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

  const handleStockUpdate = async () => {
    const nextStock = Number(stockValue);
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      setError("Stock must be a non-negative number");
      return;
    }
    setStockUpdating(true);
    setError("");
    try {
      const res = await api.put(
        `/api/products/${id}/stock`,
        { stock: nextStock },
        { validateStatus: () => true }
      );
      if (res.status === 200 && res.data?.product) {
        setProduct((prev) => ({ ...prev, stock: res.data.product.stock }));
        setStockValue(res.data.product.stock);
      } else {
        setError(res.data?.message || "Failed to update stock");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update stock");
    } finally {
      setStockUpdating(false);
    }
  };


  const result = product ? [product] : [];
  const productTags = (product?.tag || "")
    .toString()
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
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
                          {result.map((item) => (
                            <ProductDisplay
                              item={item}
                              key={item.id}
                              onDiscountUpdate={(next) => {
                                if (!next) return;
                                setProduct((prev) => {
                                  const merged = { ...(prev || {}), ...next };
                                  setStockValue(merged.stock ?? 0);
                                  return merged;
                                });
                              }}
                            />
                          ))}
                          {user?.role === "product_manager" && (
                            <>
                              <div className="d-flex align-items-center gap-2 mt-3">
                                <input
                                  type="number"
                                  className="form-control"
                                  style={{ maxWidth: "160px" }}
                                  value={stockValue}
                                  min="0"
                                  onChange={(e) => setStockValue(e.target.value)}
                                />
                                <button
                                  className="lab-btn bg-primary"
                                  onClick={handleStockUpdate}
                                  disabled={stockUpdating}
                                >
                                  <span>{stockUpdating ? "Updating..." : "Update Stock"}</span>
                                </button>
                              </div>
                              <button className="lab-btn bg-danger mt-3" onClick={handleDelete}>
                                <span>Delete Product</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="review">
                  <div className="mb-3">
                    <h5>Approved Comments</h5>
                    {commentsLoading && <p>Loading comments...</p>}
                    {commentsError && <p style={{ color: "red" }}>{commentsError}</p>}
                    {!commentsLoading && !commentsError && comments.length === 0 && (
                      <p>No comments yet.</p>
                    )}
                    {!commentsLoading && !commentsError && comments.length > 0 && (
                      <ul className="list-unstyled">
                        {comments.map((c) => (
                          <li key={c.id || c._id} className="mb-2 border-bottom pb-2">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <p style={{ marginBottom: "4px" }}>{c.comment}</p>
                                {c.userName && (
                                  <small style={{ color: "#666", display: "block" }}>
                                    {c.userName}
                                  </small>
                                )}
                                {c.createdAt && (
                                  <small style={{ color: "#666" }}>
                                    {new Date(c.createdAt).toLocaleString()}
                                  </small>
                                )}
                              </div>
                              {c.rating ? (
                                <div className="d-flex align-items-center gap-1">
                                  <span style={{ fontWeight: 600 }}>{c.rating}</span>
                                  <i className="icofont-star text-warning"></i>
                                </div>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Review productId={id} canReview={canReview} />
                </div>
              </article>
            </div>
            <div className="col-lg-4 col-md-7 col-12">
              <aside className="ps-lg-4">
                <Tags tags={productTags}/>

              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProduct;
