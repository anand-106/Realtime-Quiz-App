import { useParams } from "react-router-dom";

export function Leaderboard() {
  const { quizId } = useParams();
  return <div>{quizId}</div>;
}
