import React, { useState } from "react";
import "./Search.css";

const Search = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("any");
  const [results, setResults] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();

    // TODO: Replace this with your real search logic / API call
    const dummyResults = [
      { id: 1, title: "First Result", description: "This is a sample result." },
      { id: 2, title: "Second Result", description: "Another example result." },
    ];

    setResults(dummyResults);
  };

  return (
    <div className="Search">
      {/* LEFT FILTER SIDEBAR */}
      <aside className="search-sidebar">
        <h2 className="side-title">Filters</h2>

        <div className="filter-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All</option>
            <option value="clients">Clients</option>
            <option value="tickets">Tickets</option>
            <option value="users">Users</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="any">Any</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select>
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </aside>

      {/* RIGHT SEARCH AREA */}
      <main className="search-main">
        <header className="search-header">
          <h1>Search</h1>
          <p className="search-subtitle">
            Use the filters on the left to narrow down your results.
          </p>
        </header>

        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <section className="search-results">
          {results.length === 0 ? (
            <p className="no-results">No results yet. Try searching for something.</p>
          ) : (
            results.map((item) => (
              <article key={item.id} className="result-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default Search;