import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function UserSignin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigator = useNavigate();

  const handleSignup = () => {
    axios
      .post("http://localhost:3000/signin", {
        email,
        password,
      })
      .then((res) => {
        console.log(res);
        const token = res.data.token;
        console.log(token);
        localStorage.setItem("token", token);
        navigator("/user/dashboard");
      })
      .catch((err) => console.log(err));
  };

  return (
    <div>
      <input
        placeholder="username"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
      />
      <input
        placeholder="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
        }}
      />
      <button onClick={handleSignup}>Signin</button>
    </div>
  );
}
