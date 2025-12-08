import React from 'react'

const SelectCategory = (select) => {
  return (
    <select defaultValue={select}>
    <option value="all">All Categories</option>
    <option value="Computers">Computers</option>
    <option value="Phones">Phones</option>
    <option value="Printers">Printers</option>
    <option value="Watchs">Watchs</option>
    <option value="other">Other Products</option>           
</select>
  )
} 

export default SelectCategory 