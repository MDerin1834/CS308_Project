import React, { useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { useContext, useState } from "react";
import Search from "./Search";
import Pagination from "./Pagination";
import ShopCategory from "./ShopCategory";
import ProductCards from "./ProductCards";
import api from "../api/client";
import { Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthProvider";

const Shop = () => {
  const categories = ["All", "Phones", "Computers", "Speakers", "Headphones", "Watchs", "Others"];
  const { user } = useContext(AuthContext);
  const [GridList, setGridList] = useState(true);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("newest");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);

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

  const normalizeCategory = (value) => (value || "").toString().trim().toLowerCase();

  const categorizeProduct = (item) => {
    const tagText = normalizeCategory(item.tag);
    const tags = tagText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const searchPool = [
      normalizeCategory(item.category),
      normalizeCategory(item.name),
      ...tags,
    ].join(" ");

    if (/(headphone|headset|earbud|earphone|ear pod|airpod)/.test(searchPool))
      return "Headphones";
    if (
      /(\bphone\b|\bphones\b|\bmobile\b|\bcell\b|\bsmartphone\b|\biphone\b|\bandroid\b|\bgalaxy\b|\bpixel\b)/.test(
        searchPool
      )
    )
      return "Phones";
    if (/(laptop|notebook|macbook|pc|computer|desktop|imac|monitor)/.test(searchPool))
      return "Computers";
    if (/(speaker|soundbar|home theater|boom|sonos|jbl|bluetooth speaker)/.test(searchPool))
      return "Speakers";
    if (/(watch|wearable|smartwatch|fitness|fitbit|band)/.test(searchPool))
      return "Watchs";

    return "Others";
  };

  const filterItem = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  useEffect(() => {
    const normalized = normalizeCategory(selectedCategory);
    if (normalized === "all") {
      setProducts(allProducts);
      return;
    }
    const filtered = allProducts.filter(
      (item) => normalizeCategory(categorizeProduct(item)) === normalized
    );
    setProducts(filtered);
  }, [allProducts, selectedCategory]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get("/api/products", { params: { limit: 200, sort, search: searchTerm } })
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
  }, [sort, searchTerm]);

  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setSearchTerm((prev) => (prev === urlSearch ? prev : urlSearch));
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
    const params = {};
    if (searchTerm) {
      params.search = searchTerm;
    }
    setSearchParams(params, { replace: true });
  }, [searchTerm, setSearchParams]);

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
                  <div className="d-flex align-items-center gap-2">
                    <label htmlFor="sort" className="mb-0">
                      Sort by:
                    </label>
                    <select
                      id="sort"
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="form-select form-select-sm"
                      style={{ width: "auto", minWidth: "160px", display: "inline-block" }}
                    >
                      <option value="newest">Newest</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="popularity">Popularity</option>
                    </select>
                  </div>
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
                <Search
                  products={products}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
                {/* <ShopCategory /> */}
                <ShopCategory
                  categories={categories}
                  filterItem={filterItem}
                  selectedCategory={selectedCategory}
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
