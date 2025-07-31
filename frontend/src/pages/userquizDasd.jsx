import axios from "axios";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function UserQuizDash() {
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState(null);
  const [end, setEnd] = useState(false);
  const { quizId } = useParams();
  const navigator = useNavigate();
  console.log(quizId);

  let answers = useRef([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onopen = () => {
      console.log("socket connected");
    };
    ws.onclose = () => {
      console.log("socket disconnected");
    };
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.TYPE == "NEXT_QUESTION") {
        setQuestion(data.question);
        setOptions(data.options);
        console.log(question);
      }
      if (data.TYPE == "END") {
        setEnd(true);
      }
    };
  }, []);

  const setAnswer = (answer) => {
    answers.current.push({
      questionId: question.id,
      selectedOption: answer,
    });
    console.log(answers);
  };

  const submitAnswer = () => {
    axios
      .post(
        `http://localhost:3000/quiz/${quizId}/submit`,
        {
          answers: answers.current,
        },
        {
          headers: {
            authorization: localStorage.getItem("token"),
          },
        }
      )
      .then(() => {
        navigator(`/user/quiz/${quizId}/leaderboard`);
      });
  };

  if (end) {
    return (
      <div>
        <button className="cursor-pointer" onClick={submitAnswer}>
          Submit
        </button>
      </div>
    );
  } else {
    return !question ? (
      <h1>Quiz starts soon</h1>
    ) : (
      <div>
        <h1>Quiz Page</h1>

        <p>{`Q: ${question?.text}`}</p>
        <div className="flex gap-3">
          {options?.map((op) => {
            return (
              <div
                className="h-10 text-center cursor-pointer w-32 border-2 border-black"
                onClick={() => {
                  setAnswer(op.text);
                }}
              >
                <span>{op.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
