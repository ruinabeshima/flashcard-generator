import { Route, Routes } from "react-router-dom";
import Dashboard from "./components/dashboard";
import Home from "./components/home";
import Login from "./components/login";
import Register from "./components/register";
import ProtectedRoute from "./protected_routes";

const routes = (
  <Routes>
    <Route path="/" element={<Home />}></Route>
    <Route path="/register" element={<Register />}></Route>
    <Route path="/login" element={<Login />}></Route>
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    ></Route>
  </Routes>
);

export default routes;
