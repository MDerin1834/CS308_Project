import React from "react";

const fallbackCategories = ["Computers", "Phones", "Printers", "Watchs", "Others"];

const SelectCategory = ({ value = "All", onChange, categories }) => {
  const items = Array.isArray(categories) && categories.length > 0 ? categories : fallbackCategories;
  const uniqueItems = Array.from(new Set(items.map((item) => String(item).trim()).filter(Boolean)));

  return (
    <select value={value} onChange={onChange}>
      <option value="All">All Categories</option>
      {uniqueItems.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
};

export default SelectCategory;
