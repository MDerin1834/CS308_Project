
const title = "Our Popular Tags";

const Tags = ({ tags = [] }) => {
  const uniqueTags = Array.from(
    new Set(
      (tags || [])
        .map((t) => t?.toString().trim())
        .filter(Boolean)
    )
  );

  return (
    <div className="widget widget-tags">
      <div className="widget-header">
        <h5 className="title">{title}</h5>
      </div>
      <ul className="widget-wrapper">
        {uniqueTags.length === 0 ? (
          <li style={{ color: "#777" }}>No tags available</li>
        ) : (
          uniqueTags.map((text, i) => (
            <li key={i}>
              <a href="#">{text}</a>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Tags;
