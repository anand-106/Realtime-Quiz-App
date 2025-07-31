import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function UserSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setname] = useState("");
  const navigator = useNavigate();

  const handleSignup = () => {
    axios
      .post("http://localhost:3000/signup", {
        email,
        name,
        password,
        role: "USER",
      })
      .then((res) => {
        console.log(res);

        navigator("/user/signin");
      })
      .catch((err) => console.log(err));
  };

  return (
    <div>
      <input
        placeholder="name"
        value={name}
        onChange={(e) => {
          setname(e.target.value);
        }}
      />
      <input
        placeholder="email"
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
      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}
