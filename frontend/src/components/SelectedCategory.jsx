import React from 'react';

const SelectCategory = ({ value = "all", onChange }) => {
  return (
    <select value={value} onChange={onChange}>
      <option value="all">All Categories</option>
      <option value="Computers">Computers</option>
      <option value="Phones">Phones</option>
      <option value="Printers">Printers</option>
      <option value="Watchs">Watchs</option>
      <option value="other">Other Products</option>
    </select>
  );
};

export default SelectCategory;
