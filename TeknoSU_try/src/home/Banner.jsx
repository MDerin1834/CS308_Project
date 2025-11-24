import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    api
      .get("/api/products", { params: { limit: 200 } })
      .then((res) => {
        if (!mounted) return;
        setProducts(res.data?.items || []);
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

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchInput.toLowerCase())
  );

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  return (
    <div className="banner-section style-4">
      <div className="container">
        <div className="banner-content">
          {title}
          {error && <p style={{ color: "red" }}>{error}</p>}
          <form>
            <SelectedCategory select={"all"}/>
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
          {searchInput && !loading && filteredProducts.map((product, i) => (
              <li key={i}>
               <Link to={`/shop/${product.id}`}> {product.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Banner;
