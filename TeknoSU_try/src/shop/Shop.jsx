import React, { useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { Component, Fragment, useContext, useState } from "react";
import Search from "./Search";
import Pagination from "./Pagination";
import ShopCategory from "./ShopCategory";
import ProductCards from "./ProductCards";
const showResult = "Showing 01 - 12 of 139 Results";
import api from "../api/client";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthProvider";

const Shop = () => {
  const { user } = useContext(AuthContext);
  const [GridList, setGridList] = useState(true);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //   category active colors
const [selectedCategory, setSelectedCategory] = useState("All");

  // pagination
  // Get current products to display
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12; // Number of products per page

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Function to change the current page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // category based filtering
  const menuItems = [...new Set(allProducts.map((Val) => Val.category))];

  const filterItem = (curcat) => {
    const newItem = allProducts.filter((newVal) => newVal.category === curcat);
    setSelectedCategory(curcat);
    setProducts(newItem);
  };

  useEffect(() => {
    let mounted = true;
    api
      .get("/api/products", { params: { limit: 200 } })
      .then((res) => {
        if (!mounted) return;
        const items = res.data?.items || [];
        setAllProducts(items);
        setProducts(items);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Failed to load products");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <PageHeader title={"Our Shop Pages"} curPage={"Shop"} />

      {/* shop page */}
      <div className="shop-page padding-tb">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-12">
              <article>
                <div className="shop-title d-flex flex-wrap justify-content-between">
                  <p>
                    {loading
                      ? "Loading products..."
                      : `Showing ${currentProducts.length} of ${products.length} Results`}
                  </p>
                  {user?.role === "product_manager" && (
                    <Link className="lab-btn bg-primary" to="/products/new">
                      <span>+ New Product</span>
                    </Link>
                  )}
                  <div
                    className={`product-view-mode ${
                      GridList ? "gridActive" : "listActive"
                    }`}
                  >
                    <a className="grid" onClick={() => setGridList(!GridList)}>
                      <i className="icofont-ghost"></i>
                    </a>
                    <a className="list" onClick={() => setGridList(!GridList)}>
                      <i className="icofont-listine-dots"></i>
                    </a>
                  </div>
                </div>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <div>
                  <ProductCards
                    products={currentProducts}
                    GridList={GridList}
                  />
                </div>
                <Pagination
                  productsPerPage={productsPerPage}
                  totalProducts={products.length}
                  paginate={paginate}
                  activePage={currentPage}
                />
              </article>
            </div>
            <div className="col-lg-4 col-12">
              <aside>
                <Search products={products} GridList={GridList} />
                {/* <ShopCategory /> */}
                <ShopCategory
                  filterItem={filterItem}
                  menuItems={menuItems}
                  setProducts={setProducts}
                  selectedCategory={selectedCategory }
                  allProducts={allProducts}
                />

              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
