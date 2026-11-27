import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Reports from "./pages/Reports.jsx";
import ReportViewer from "./pages/ReportViewer.jsx";
import BookPage from "./pages/book/BookPage.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="relatorios/:id" element={<ReportViewer />} />
          <Route path="book" element={<BookPage />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="book/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
