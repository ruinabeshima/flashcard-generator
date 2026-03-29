import { Route, Routes } from "react-router-dom";
import { ProtectedRoute, AlreadySignedIn } from "./protected_routes";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AddApplication from "./pages/applications/AddApplication";
import Onboarding from "./pages/auth/Onboarding";
import UserResume from "./pages/resumes/UserResume";
import ApplicationDetail from "./pages/applications/ApplicationDetail";
import EditApplication from "./pages/applications/EditApplication";
import TailoredList from "./pages/tailoring/TailoredList";
import TailoredResume from "./pages/tailoring/TailoredResume";

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
    <Route
      path="/applications/:id"
      element={
        <ProtectedRoute>
          <ApplicationDetail />
        </ProtectedRoute>
      }
    ></Route>
    <Route
      path="/applications/:id/edit"
      element={
        <ProtectedRoute>
          <EditApplication />
        </ProtectedRoute>
      }
    ></Route>
    <Route
      path="/tailored"
      element={
        <ProtectedRoute>
          <TailoredList />
        </ProtectedRoute>
      }
    ></Route>
    <Route
      path="/applications/:id/tailored/:tailoredResumeId"
      element={
        <ProtectedRoute>
          <TailoredResume />
        </ProtectedRoute>
      }
    ></Route>
  </Routes>
);

export default routes;
