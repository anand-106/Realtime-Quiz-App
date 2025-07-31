import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export function AdminQuizPage() {
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState(null);
  const { quizId } = useParams();
  console.log(quizId);

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
    };
  }, []);

  const setAnswer = (answer) => {
    axios
      .post(
        "http://localhost:3000/user/test",
        {
          quizId,
          questionId: question.id,
          answer: answer,
        },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      )
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return !question ? (
    <div>
      <h1>Quiz starts soon</h1>
      <div>
        <NextQuestionButton quizId={quizId} />
      </div>
    </div>
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
      <div>
        <NextQuestionButton quizId={quizId} />
      </div>
    </div>
  );
}

function NextQuestionButton({ quizId }) {
  const next = (isNext) => {
    axios
      .post(
        "http://localhost:3000/admin/next",
        {
          quizId,
          next: isNext,
        },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      )
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  return (
    <div>
      <button
        onClick={() => {
          next(true);
        }}
        className="cursor-pointer"
      >
        Next question
      </button>
      <button
        onClick={() => {
          next(false);
        }}
        className="cursor-pointer"
      >
        Previos Question
      </button>
    </div>
  );
}
