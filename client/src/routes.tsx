import { Route, Routes } from "react-router-dom";
import { ProtectedRoute, AlreadySignedIn } from "./protected_routes";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddApplication from "./pages/AddApplication";
import Onboarding from "./pages/Onboarding";
import UserResume from "./pages/UserResume";

const routes = (
  <Routes>
    <Route
      path="/"
      element={
        <AlreadySignedIn>
          <Home />
        </AlreadySignedIn>
      }
    ></Route>
    <Route
      path="/register"
      element={
        <AlreadySignedIn>
          <Register />
        </AlreadySignedIn>
      }
    ></Route>
    <Route
      path="/login"
      element={
        <AlreadySignedIn>
          <Login />
        </AlreadySignedIn>
      }
    ></Route>
    <Route
      path="/onboarding"
      element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      }
    ></Route>
    <Route
      path="/your-resume"
      element={
        <ProtectedRoute>
          <UserResume />
        </ProtectedRoute>
      }
    ></Route>
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
