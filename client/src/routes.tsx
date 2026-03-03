import { Route, Routes } from "react-router-dom";
import Dashboard from "./components/dashboard";
import Home from "./components/home";
import Login from "./components/login";
import Register from "./components/register";
import ProtectedRoute from "./protected_routes";
import AddApplication from "./components/add_application";

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
    <Route
      path="/applications/add"
      element={
        <ProtectedRoute>
          <AddApplication />
        </ProtectedRoute>
      }
    ></Route>
  </Routes>
);

export default routes;
