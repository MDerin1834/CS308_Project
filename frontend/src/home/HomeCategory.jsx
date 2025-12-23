import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import api from "../api/client";

const subTitle = "Choose Any Products";
const title = "Buy Everything with Us";
const btnText = "Get Started Now";

const fallbackCategories = [
  "Phones",
  "Computers",
  "Speakers",
  "Headphones",
  "Others",
  "Watchs",
];

const categoryArtwork = {
  Phones: "src/assets/images/category/01.jpg",
  Computers: "src/assets/images/category/02.jpg",
  Speakers: "src/assets/images/category/03.jpg",
  Headphones: "src/assets/images/category/04.jpg",
  Others: "src/assets/images/category/05.jpg",
  Watchs: "src/assets/images/category/06.jpg",
};

const HomeCategory = () => {
  const [categories, setCategories] = useState(fallbackCategories);

  useEffect(() => {
    let mounted = true;
    api
      .get("/api/categories")
      .then((res) => {
        if (!mounted) return;
        const list = res.data?.categories?.map((item) => item.name).filter(Boolean) || [];
        if (list.length > 0) setCategories(list);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className='category-section style-4 padding-tb'>
        <div className='container'>
            {/* section header */}
            <div className='section-header text-center'>
                <span className='subtitle'>{subTitle}</span>
                <h2 className='title'>{title}</h2>
            </div>

            {/* section card */}
            <div className='section-wrapper'>
                <div className='row g-4 justify-content-center row-cols-md-3 row-cols-sm-2 row-cols-1'>
                    {
                        categories.map((title, i) => {
                            const imgUrl = categoryArtwork[title] || categoryArtwork.Others;
                            return (
                            <div className='col' key={i}>
                            <Link to={{ pathname: "/shop", search: `?category=${encodeURIComponent(title)}` }} className='category-item'>
                                <div className='category-inner'>
                                    {/* image thumb */}
                                    <div className='category-thumb' style={{
                                        aspectRatio: '1.2 / 1', // Enforces a square shape
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden' // Prevents any overflow
                                    }}>
                                        <img src={imgUrl} alt={`category ${title}`} style={{
                                            width: '100%', height: '100%', objectFit: 'fill' // Stretches the image
                                        }}/>
                                    </div>

                                    {/* content */}
                                    <div className='category-content'>
                                        <div className="cate-icon">
                                            <i className="icofont-brand-windows"></i>
                                        </div>
                                        {/* HATA BURADAYDI: İçteki <Link> kaldırıldı */}
                                        <h6>{title}</h6>
                                    </div>
                                </div>
                            </Link>
                        </div>
                        );
                        })
                    }
                </div>
                <div className='text-center mt-5'>
                    <Link to="/shop" className='lab-btn'><span>{btnText}</span></Link>
                </div>
            </div>
        </div>
    </div>
  )
}

export default HomeCategory
