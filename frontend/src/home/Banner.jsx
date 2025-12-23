import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SelectedCategory from "../components/SelectedCategory";
import api from "../api/client";

const title = (
  <h2>
    Search Your One From <span>Thousand</span> Of Products
  </h2>
);
const desc = "We Have The Largest Collection of products";

const bannerList = [
  {
    iconName: "icofont-users-alt-4",
    text: "1.5 Million Customers",
  },
  {
    iconName: "icofont-notification",
    text: "More then 2000 Marchent",
  },
  {
    iconName: "icofont-globe",
    text: "Buy Anything Online",
  },
];

const Banner = () => {
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const normalizeCategory = (value) => (value || "").toString().trim().toLowerCase();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get("/api/products", { params: { limit: 200 } }),
          api.get("/api/categories"),
        ]);
        if (!mounted) return;
        setProducts(productsRes.data?.items || []);
        const apiCategories =
          categoriesRes.data?.categories?.map((item) => item.name).filter(Boolean) || [];
        setCategories(apiCategories);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesName = product.name?.toLowerCase().includes(searchInput.toLowerCase());
    if (!matchesName) return false;
    if (normalizeCategory(category) === "all") return true;
    const productCategory = normalizeCategory(product.category);
    return productCategory === normalizeCategory(category);
  });

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = searchInput.trim();
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    if (category && normalizeCategory(category) !== "all") params.set("category", category);
    const search = params.toString();
    navigate(search ? `/shop?${search}` : "/shop");
  };

  return (
    <div className="banner-section style-4">
      <div className="container">
        <div className="banner-content">
          {title}
          {error && <p style={{ color: "red" }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <SelectedCategory
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              categories={categories}
            />
            <input
              type="text"
              name="search"
              placeholder="Search your product"
              value={searchInput}
              onChange={handleSearch}
              />
            <button type="submit">
              <i className="icofont-search"></i>
            </button>
          </form>
          <p>{desc}</p>
          <ul className="lab-ul">
            {searchInput &&
              !loading &&
              filteredProducts.map((product, i) => (
                <li key={i}>
                  <Link to={`/shop/${product.id}`}>{product.name}</Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Banner;
