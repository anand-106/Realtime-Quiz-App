import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function AdminDash() {
  const [quizData, setQuizData] = useState([]);
  const navigator = useNavigate();
  const getQuiz = () => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:3000/user/quiz", {
        headers: {
          authorization: token,
        },
      })
      .then((res) => {
        console.log(res);
        setQuizData(res.data);
        console.log(res.data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(getQuiz, []);

  const startQuiz = (q) => {
    navigator(`/admin/quiz/${q.id}`);
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div>
        <ul>
          {quizData.map((q) => {
            return (
              <li key={q.id} className="flex gap-3">
                <p>{q.quizName}</p>

                <p>{q.isLive ? "Live" : "Not Live"}</p>

                <button
                  className="cursor-pointer"
                  onClick={() => {
                    startQuiz(q);
                  }}
                >
                  Start Quiz
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
