import React from 'react';
import { Link } from 'react-router-dom';

const subTitle = "Choose Any Products";
const title = "Buy Everything with Us";
const btnText = "Get Started Now";

const categoryList = [
    {
        imgUrl: 'src/assets/images/category/01.jpg',
        imgAlt: 'category rajibraj91 rajibraj',
        iconName: 'icofont-brand-windows',
        title: 'Phones',
    },
    {
        imgUrl: 'src/assets/images/category/02.jpg',
        imgAlt: 'category rajibraj91 rajibraj',
        iconName: 'icofont-brand-windows',
        title: 'Computers',
    },
    {
        imgUrl: 'src/assets/images/category/03.jpg',
        imgAlt: 'category rajibraj91 rajibraj',
        iconName: 'icofont-brand-windows',
        title: 'Speakers',
    },
    {
        imgUrl: 'src/assets/images/category/04.jpg',
        imgAlt: 'category rajibraj91 rajibraj',
        iconName: 'icofont-brand-windows',
        title: 'Headphones',
    },
    {
        imgUrl: 'src/assets/images/category/05.jpg',
        imgAlt: 'category rajibraj91 rajibraj',
        iconName: 'icofont-brand-windows',
        title: 'Others',
    },
    {
        imgUrl: 'src/assets/images/category/06.jpg',
        imgAlt: 'category rajibraj91 rajibraj',
        iconName: 'icofont-brand-windows',
        title: 'Watchs',
    },
]

const HomeCategory = () => {
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
                        categoryList.map((val, i) => (<div className='col' key={i}>
                            <Link to={{ pathname: "/shop", search: `?category=${encodeURIComponent(val.title)}` }} className='category-item'>
                                <div className='category-inner'>
                                    {/* image thumb */}
                                    <div className='category-thumb' style={{
                                        aspectRatio: '1.2 / 1', // Enforces a square shape
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden' // Prevents any overflow
                                    }}>
                                        <img src={val.imgUrl} alt={val.imgAlt} style={{
                                            width: '100%', height: '100%', objectFit: 'fill' // Stretches the image
                                        }}/>
                                    </div>

                                    {/* content */}
                                    <div className='category-content'>
                                        <div className="cate-icon">
                                            <i className={val.iconName}></i>
                                        </div>
                                        {/* HATA BURADAYDI: İçteki <Link> kaldırıldı */}
                                        <h6>{val.title}</h6>
                                    </div>
                                </div>
                            </Link>
                        </div>))
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
