import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Rating from "../components/Rating";
const title = "Our Products";

const CategoryShowCase = () => {
    const [items, setItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);

    const fetchData = async (category) => {
        setLoading(true);
        try {
            const queryCategory = category === "All" ? "" : category;
            const response = await fetch(`http://localhost:5000/api/products?category=${queryCategory}&limit=8`);
            const data = await response.json();
            setItems(data.items || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedCategory);
    }, [selectedCategory]);

  return (
    <div className="course-section style-3 padding-tb">
    <div className="course-shape one"><img src="/src/assets/images/shape-img/icon/01.png" alt="education" /></div>
    <div className="course-shape two"><img src="/src/assets/images/shape-img/icon/02.png" alt="education" /></div>
    <div className="container">

        {/* section header */}
        <div className="section-header">
            <h2 className="title">{title}</h2>
            <div className="course-filter-group">
                <ul className="lab-ul">
                    <li className={selectedCategory === "All" ? "active" : ""} onClick={() => setSelectedCategory("All")}>All</li>
                    <li className={selectedCategory === "Computers" ? "active" : ""} onClick={() => setSelectedCategory('Computers')}>Computers</li>
                    <li className={selectedCategory === "Printers" ? "active" : ""} onClick={() => setSelectedCategory('Printers')}>Printers</li>
                    <li className={selectedCategory === "Phones" ? "active" : ""} onClick={() => setSelectedCategory('Phones')}>Phones</li>
                    <li className={selectedCategory === "Watchs" ? "active" : ""} onClick={() => setSelectedCategory('Watchs')}>Watchs</li>
                </ul>
            </div>
        </div>

        {/* section body */}
        <div className="section-wrapper">
            <div className="row g-4 justify-content-center row-cols-xl-4 row-cols-lg-3 row-cols-md-2 row-cols-1 course-filter">
                { loading ? (
                    <div>Loading...</div>
                ) : items.length > 0 ? (
                    items.map((product) => {
                    const { id, imageURL, category, name, seller, price } = product;
                    return (
                        <div className="col" key={id}>
                            <div className="course-item style-4">
                                <div className="course-inner">
                                    <div className="course-thumb">
                                        <img src={imageURL || "/src/assets/images/categoryTab/01.jpg"} alt={name} />
                                        <div className="course-category">
                                            <div className="course-cate">
                                                <a href="#">{category}</a>
                                            </div>
                                            <div className="course-reiew">
                                                <Rating />
                                            </div>
                                        </div>
                                    </div>

                                    {/* content  */}
                                    <div className="course-content">
                                        <Link to={`/shop/${id}`}><h5>{name}</h5></Link>
                                        <div className="course-footer">
                                            <div className="course-author">
                                                <Link to={`/shop?search=${seller}`} className="ca-name">{seller}</Link>
                                            </div>
                                            <div className="course-price">${price.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})
                ) : (
                    <div>No products found.</div>
                )
                }
            </div>
        </div>
    </div>
</div>
  )
}

export default CategoryShowCase