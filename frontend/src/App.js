import { useState } from "react";

function App() {
  const [movie, setMovie] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const getRecommendations = async () => {
    if (!movie) return;

    try {
      const res = await fetch("http://localhost:5001/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: movie }), // send as JSON body
      });

      const data = await res.json();

      if (!data.recommendations) {
        console.error("No recommendations received", data);
        setRecommendations([]);
        return;
      }

      setRecommendations(data.recommendations); // array returned from backend
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setRecommendations([]);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>🎬 Movie Recommendation App</h1>

      <input
        type="text"
        placeholder="Enter movie name"
        value={movie}
        onChange={(e) => setMovie(e.target.value)}
        style={{ padding: 10, width: 250 }}
      />

      <button
        onClick={getRecommendations}
        style={{ marginLeft: 10, padding: "10px 20px" }}
      >
        Recommend
      </button>

      <ul style={{ marginTop: 20 }}>
        {recommendations.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
