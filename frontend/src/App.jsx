import { BrowserRouter, Route, Routes } from "react-router-dom";
import { UserSignin } from "./pages/userLogin";
import { UserSignup } from "./pages/userSignup";
import { UserDash } from "./pages/userDash";
import { UserQuizDash } from "./pages/userquizDasd";
import { AdminSignup } from "./pages/adminSignup";
import { AdminSignin } from "./pages/adminSignin";
import { AdminDash } from "./pages/adminDash";
import { AdminQuizPage } from "./pages/AdminquizPage";
import { Leaderboard } from "./pages/leaderboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/user/signup" element={<UserSignup />} />
        <Route path="/user/signin" element={<UserSignin />} />
        <Route path="/user/dashboard" element={<UserDash />} />
        <Route path="/user/quiz/:quizId" element={<UserQuizDash />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/signin" element={<AdminSignin />} />
        <Route path="/admin/dashboard" element={<AdminDash />} />
        <Route path="/admin/quiz/:quizId" element={<AdminQuizPage />} />
        <Route
          path="/user/quiz/:quizId/leaderboard"
          element={<Leaderboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
