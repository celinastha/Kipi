import React, { useState } from "react";
import './Search_Bar.css';
import { IoIosSearch } from "react-icons/io";

const Search_Bar = ({ placeholder, onSearch }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value); 
  };

  return (
    <div className="Search_Bar">
      <IoIosSearch className="searchIcon"/>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder || "Search"}
        className={`search_input ${query? 'typing' : ''}`}
      />
      
    </div>
  );
};

export default Search_Bar;