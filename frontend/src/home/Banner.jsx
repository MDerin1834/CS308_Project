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
  const [category, setCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  const filteredProducts = products.filter((product) => {
    const matchesName = product.name?.toLowerCase().includes(searchInput.toLowerCase());
    if (!matchesName) return false;
    if (category === "all") return true;
    const productCategory = categorizeProduct(product);
    return productCategory === category;
  });

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = searchInput.trim();
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    if (category && category !== "all") params.set("category", category);
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
