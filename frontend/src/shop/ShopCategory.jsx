/* eslint-disable react/prop-types */
const title = "All Categories";

const ShopCategory = ({ categories, filterItem, selectedCategory }) => {
  return (
    <>
      <div className="widget-header">
        <h5 className="ms-2">{title}</h5>
      </div>
      <div className="">
        {categories.map((category) => (
          <button
            key={category}
            className={`m-2 ${selectedCategory === category ? "bg-warning" : ""}`}
            onClick={() => filterItem(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </>
  );
};

export default ShopCategory;
