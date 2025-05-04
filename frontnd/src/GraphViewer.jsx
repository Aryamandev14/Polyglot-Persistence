import React, { useEffect, useState } from 'react';

export default function GraphViewer() {
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const res = await fetch('http://localhost:3000/graph/customers-orders');
        const data = await res.json();
        setGraphData(data);
      } catch (err) {
        console.error('Error fetching graph data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📈 Customer Order Graph</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        graphData.length === 0 ? (
          <p>No graph data available</p>
        ) : (
          <ul>
            {graphData.map((entry, idx) => (
              <li key={idx}>
                🧑 {entry.customer} ➡️ 📦 {entry.product} (Order ID: {entry.order})
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
