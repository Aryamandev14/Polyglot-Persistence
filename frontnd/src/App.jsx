import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Products from './Products';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<Products />} />
        {/* <Route path="/graph-view" element={<GraphViewer />} />
        <Route path="/add-graph-entry" element={<AddGraphEntry />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
