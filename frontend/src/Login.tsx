import React, { useState } from "react";
import { toast } from "react-toastify";
import { useUserStore } from "./store/user/store";

function Login(): React.JSX.Element {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { onLogin } = useUserStore();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    await onLogin(email, password);

    setLoading(false);
    toast.success("Ви успішно увійшли в систему");
  };

  const onPasteManager = () => {
    setEmail("dyachenko@zlagoda.com");
    setPassword("manager123");
  };

  const onPasteCasher = () => {
    setEmail("kovalenko@zlagoda.com");
    setPassword("cashier123");
  };

  const onPasteCasher1 = () => {
    setEmail("melnyk@zlagoda.com");
    setPassword("cashier123");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e1d999 0%, #daa481 100%)",
      }}
    >
      <div className="card" style={{ maxWidth: "400px", width: "90%" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "2rem", color: "#c1680e" }}>ZLAGODA</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Введіть ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              className="form-control"
              placeholder="Введіть пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Завантаження..." : "Увійти"}
          </button>
        </form>

        <button
          onClick={onPasteManager}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          Manager
        </button>

        <button
          onClick={onPasteCasher}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          Casher
        </button>
        <button
          onClick={onPasteCasher1}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          Casher 2
        </button>
      </div>
    </div>
  );
}

export default Login;
